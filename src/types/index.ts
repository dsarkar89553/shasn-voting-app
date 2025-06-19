
export interface AppUser {
  id: string; // Corresponds to Firebase Auth UID in a full Firebase app
  username: string;
  password?: string; 
  displayName: string;
}

export interface PollParticipant extends Pick<AppUser, 'id' | 'displayName'> {}

export interface Poll {
  id: string;
  name: string;
  creatorId: string; // Firebase Auth UID
  creatorDisplayName: string;
  participants: PollParticipant[];
  status: 'active' | 'ended' | 'deleted';
  createdAt: number; // Milliseconds since epoch
  endedAt?: number; // Milliseconds since epoch
  votes?: { [participantId: string]: number }; // No longer stored in Firestore poll doc, calculated client-side for display
}

export interface Vote {
  pollId: string;
  voterId: string; // Firebase Auth UID
  votedForId: string; // Participant's ID (AppUser.id)
  createdAt: number; // Milliseconds since epoch
}

export interface ActivePollStatus {
  activePollId: string | null;
  isCreating: boolean;
}
