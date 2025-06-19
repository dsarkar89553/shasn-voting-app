
import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type { Poll, AppUser, ActivePollStatus, Vote, PollParticipant } from '@/types';
import { appUsers, findUserById } from './users'; // Still used for display names and mock auth

const ACTIVE_POLL_STATUS_DOC_PATH = 'app_status/active_poll_status';

// --- Helper to convert Firestore Timestamps ---
const convertTimestampToMillis = (timestamp: Timestamp | number | undefined): number | undefined => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }
  return timestamp; // Return as is if already a number or undefined
};


// --- Stream Functions ---

export const getActivePollStatusStream = (callback: (status: ActivePollStatus) => void): (() => void) => {
  const docRef = doc(db, ACTIVE_POLL_STATUS_DOC_PATH);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as ActivePollStatus);
    } else {
      // Document doesn't exist, create it with default state
      const defaultStatus: ActivePollStatus = { activePollId: null, isCreating: false };
      setDoc(docRef, defaultStatus)
        .then(() => callback(defaultStatus))
        .catch(error => console.error("Error setting default active poll status:", error));
    }
  }, (error) => {
    console.error("Error getting active poll status stream:", error);
    // Potentially callback with an error state or a default if appropriate
    callback({ activePollId: null, isCreating: false });
  });
  return unsubscribe;
};

export const getPollStream = (pollId: string, callback: (poll: Poll | null) => void): (() => void) => {
  const docRef = doc(db, 'polls', pollId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        ...data,
        id: docSnap.id,
        createdAt: convertTimestampToMillis(data.createdAt as Timestamp)!,
        endedAt: convertTimestampToMillis(data.endedAt as Timestamp),
      } as Poll);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error getting poll stream for ${pollId}:`, error);
    callback(null);
  });
  return unsubscribe;
};

export const getPollVotesStream = (pollId: string, callback: (votes: Vote[]) => void): (() => void) => {
  const votesColRef = collection(db, 'polls', pollId, 'votes');
  const q = query(votesColRef, orderBy('createdAt', 'asc'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const votesData = querySnapshot.docs.map(docSnap => ({
      ...(docSnap.data() as Omit<Vote, 'createdAt'>),
      createdAt: convertTimestampToMillis(docSnap.data().createdAt as Timestamp)!,
    }));
    callback(votesData as Vote[]);
  }, (error) => {
    console.error(`Error getting votes stream for poll ${pollId}:`, error);
    callback([]);
  });
  return unsubscribe;
};


// --- Core Service Functions ---

export const createPoll = async (
  name: string,
  creatorId: string, // This should be Firebase Auth UID in a real app
  participants: PollParticipant[]
): Promise<Poll | null> => {
  const creator = findUserById(creatorId); // Using mock users for displayName
  if (!creator) {
    console.error("Creator not found via mock users");
    return null;
  }

  const activePollStatusRef = doc(db, ACTIVE_POLL_STATUS_DOC_PATH);

  try {
    // Check if a poll is already active or being created (basic check)
    // For robust solution, use Firestore transaction if strict one-active-poll rule is needed
    const currentStatusSnap = await getDoc(activePollStatusRef);
    if (currentStatusSnap.exists() && currentStatusSnap.data().activePollId) {
       console.warn("An active poll might already exist or is being created.");
       // Decide if this should be a hard block or a soft warning.
       // For this app, we block.
       return null;
    }
    
    await setDoc(activePollStatusRef, { activePollId: null, isCreating: true });

    const newPollData = {
      name,
      creatorId,
      creatorDisplayName: creator.displayName,
      participants,
      status: 'active' as 'active' | 'ended' | 'deleted',
      createdAt: Timestamp.now(),
      // `votes` map is removed, counts derived from Vote documents
    };

    const docRef = await addDoc(collection(db, 'polls'), newPollData);
    
    await setDoc(activePollStatusRef, { activePollId: docRef.id, isCreating: false });

    return {
      ...newPollData,
      id: docRef.id,
      createdAt: convertTimestampToMillis(newPollData.createdAt)!,
    } as Poll;

  } catch (error) {
    console.error("Error creating poll in Firestore:", error);
    // Reset isCreating flag on error
    try {
      await setDoc(activePollStatusRef, { activePollId: null, isCreating: false }, { merge: true });
    } catch (resetError) {
      console.error("Error resetting active poll status after poll creation failure:", resetError);
    }
    return null;
  }
};

export const submitVote = async (pollId: string, voterId: string, votedForId: string): Promise<boolean> => {
  const pollRef = doc(db, 'polls', pollId);
  const votesColRef = collection(db, 'polls', pollId, 'votes');

  try {
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists() || pollSnap.data().status !== 'active') {
      console.error("Poll not found or not active for voting.");
      return false;
    }

    // Check if user already voted (query votes subcollection)
    const q = query(votesColRef, where('voterId', '==', voterId));
    const existingVoteSnap = await getDocs(q);
    if (!existingVoteSnap.empty) {
      console.error("User has already voted in this poll.");
      return false;
    }

    const newVoteData = {
      pollId,
      voterId,
      votedForId,
      createdAt: Timestamp.now(),
    };
    await addDoc(votesColRef, newVoteData);
    return true;
  } catch (error) {
    console.error("Error submitting vote:", error);
    return false;
  }
};

export const endPoll = async (pollId: string, currentUserId: string): Promise<boolean> => {
  const pollRef = doc(db, 'polls', pollId);
  const activePollStatusRef = doc(db, ACTIVE_POLL_STATUS_DOC_PATH);
  
  try {
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists()) {
      console.error("Poll not found to end.");
      return false;
    }
    if (pollSnap.data().creatorId !== currentUserId) {
      console.error("Only the creator can end the poll.");
      return false;
    }
    if (pollSnap.data().status !== 'active') {
      console.error("Poll is not active, cannot end.");
      return false;
    }

    const batch = writeBatch(db);
    batch.update(pollRef, {
      status: 'ended',
      endedAt: Timestamp.now(),
    });
    
    // Check if this was the active poll
    const activeStatusSnap = await getDoc(activePollStatusRef);
    if(activeStatusSnap.exists() && activeStatusSnap.data().activePollId === pollId) {
        batch.set(activePollStatusRef, { activePollId: null, isCreating: false });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error ending poll:", error);
    return false;
  }
};

export const deletePoll = async (pollId: string, currentUserId: string): Promise<boolean> => {
  const pollRef = doc(db, 'polls', pollId);
  const activePollStatusRef = doc(db, ACTIVE_POLL_STATUS_DOC_PATH);

  try {
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists()) {
      console.error("Poll not found to delete.");
      return false;
    }
    if (pollSnap.data().creatorId !== currentUserId) {
      console.error("Only the creator can delete the poll.");
      return false;
    }
     if (pollSnap.data().status === 'deleted') {
      console.warn("Poll already marked as deleted.");
      return true; // Or false if you want to indicate no change was made
    }

    const batch = writeBatch(db);
    batch.update(pollRef, {
      status: 'deleted',
      endedAt: Timestamp.now(), // Use endedAt for deletion timestamp as well
    });

    const activeStatusSnap = await getDoc(activePollStatusRef);
    if(activeStatusSnap.exists() && activeStatusSnap.data().activePollId === pollId) {
        batch.set(activePollStatusRef, { activePollId: null, isCreating: false });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting poll:", error);
    return false;
  }
};

export const getPastPolls = async (): Promise<Poll[]> => {
  const pollsColRef = collection(db, 'polls');
  const q = query(pollsColRef, 
    where('status', 'in', ['ended', 'deleted']),
    orderBy('endedAt', 'desc') // Order by when they ended/were deleted
  );

  try {
    const querySnapshot = await getDocs(q);
    const pollsData: Poll[] = [];

    for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const poll: Poll = {
            ...data,
            id: docSnap.id,
            createdAt: convertTimestampToMillis(data.createdAt as Timestamp)!,
            endedAt: convertTimestampToMillis(data.endedAt as Timestamp),
        } as Poll;
        
        // Fetch votes for each poll to calculate counts for display
        // This makes the function heavier but ensures results are available
        // In a real app, vote counts might be denormalized on the poll document via Cloud Functions
        const votesColRef = collection(db, 'polls', poll.id, 'votes');
        const votesSnapshot = await getDocs(votesColRef);
        const votes: Vote[] = votesSnapshot.docs.map(vDoc => ({
            ...(vDoc.data() as Omit<Vote, 'createdAt'>),
            createdAt: convertTimestampToMillis(vDoc.data().createdAt as Timestamp)!,
        })) as Vote[];

        // Calculate vote counts from the fetched votes
        const voteCounts: { [participantId: string]: number } = {};
        poll.participants.forEach(p => voteCounts[p.id] = 0);
        votes.forEach(vote => {
            voteCounts[vote.votedForId] = (voteCounts[vote.votedForId] || 0) + 1;
        });
        poll.votes = voteCounts; // Add calculated votes to the poll object for PastPollsList

        pollsData.push(poll);
    }
    return pollsData;
  } catch (error) {
    console.error("Error fetching past polls:", error);
    return [];
  }
};


export const getPollById = async (pollId: string): Promise<Poll | null> => {
  const docRef = doc(db, 'polls', pollId);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: convertTimestampToMillis(data.createdAt as Timestamp)!,
        endedAt: convertTimestampToMillis(data.endedAt as Timestamp),
      } as Poll;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching poll by ID ${pollId}:`, error);
    return null;
  }
};

// Functions _forceClientSideActivePollStatus and _clientSideCachePoll are no longer needed
// as Firestore's onSnapshot handles real-time client updates.
// The old localStorage based reset functions are also removed.
