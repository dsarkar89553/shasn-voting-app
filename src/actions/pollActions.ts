
"use server";

import { revalidatePath } from 'next/cache';
import { createPoll as createPollService } from '@/lib/firebaseService';
import type { AppUser, Poll, PollParticipant } from '@/types';
import { findUserById } from '@/lib/users'; // For participant details

interface CreatePollFormState {
  message: string;
  success: boolean;
  poll?: Poll; 
  errors?: {
    name?: string[];
    participants?: string[];
    general?: string[];
  };
}

export async function createPollAction(
  prevState: CreatePollFormState | undefined,
  formData: FormData
): Promise<CreatePollFormState> {
  const pollName = formData.get('pollName') as string;
  const creatorId = formData.get('creatorId') as string; // This would be auth.currentUser.uid
  const otherParticipantIds = formData.getAll('participants') as string[];
  
  if (!pollName || pollName.trim().length < 3) {
    return { success: false, message: "Poll name must be at least 3 characters.", errors: { name: ["Poll name must be at least 3 characters."]}};
  }
  if (!creatorId) {
    return { success: false, message: "Creator ID is missing." , errors: { general: ["Creator ID is missing."]}};
  }

  const creatorUser = findUserById(creatorId); // From mock users
  if (!creatorUser) {
    return { success: false, message: "Creator user not found.", errors: { general: ["Creator user not found."] }};
  }

  const finalParticipants: PollParticipant[] = [
    { id: creatorUser.id, displayName: creatorUser.displayName }
  ];

  for (const otherId of otherParticipantIds) {
    if (otherId === creatorId) continue;
    const participantUser = findUserById(otherId); // From mock users
    if (participantUser) {
      if (!finalParticipants.some(p => p.id === participantUser.id)) {
         finalParticipants.push({ id: participantUser.id, displayName: participantUser.displayName });
      }
    } else {
      return { success: false, message: `Selected participant with ID ${otherId} not found. Please refresh and try again.`, errors: { participants: [`Invalid participant selected.`] }};
    }
  }
  
  if (finalParticipants.length < 2) { 
    return { success: false, message: "Please select at least 1 other participant.", errors: { participants: ["Please select at least 1 other participant."] }};
  }
  
  try {
    // createPollService now interacts with Firestore
    const newPoll = await createPollService(pollName, creatorId, finalParticipants);
    if (newPoll) {
      // Revalidation might still be useful for non-realtime parts or immediate UI updates
      // if not solely relying on Firestore's onSnapshot for everything.
      // For this app, onSnapshot should handle dashboard button state updates.
      // revalidatePath('/dashboard'); 
      return { success: true, message: 'Poll created successfully!', poll: newPoll };
    } else {
      return { success: false, message: 'Failed to create poll. An active poll might already exist or a server error occurred.' };
    }
  } catch (error) {
    console.error("Error creating poll:", error);
    // Ensure isCreating flag is reset in Firestore if createPollService failed mid-way
    // This is handled within createPollService now.
    return { success: false, message: 'An unexpected error occurred while creating the poll.' };
  }
}
