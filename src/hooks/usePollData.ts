"use client";

import { useState, useEffect } from 'react';
import type { Poll, Vote } from '@/types';
import { getPollStream, getPollVotesStream, getPollById } from '@/lib/firebaseService'; // Placeholder

interface PollDataHookResponse {
  poll: Poll | null;
  votes: Vote[];
  loadingPoll: boolean;
  loadingVotes: boolean;
  errorPoll: Error | null;
  errorVotes: Error | null;
  userVotedParticipantId: string | null;
}

export const usePollData = (pollId: string | undefined, currentUserId: string | undefined): PollDataHookResponse => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loadingPoll, setLoadingPoll] = useState(true);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [errorPoll, setErrorPoll] = useState<Error | null>(null);
  const [errorVotes, setErrorVotes] = useState<Error | null>(null);
  const [userVotedParticipantId, setUserVotedParticipantId] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) {
      setLoadingPoll(false);
      setLoadingVotes(false);
      setPoll(null);
      setVotes([]);
      return;
    }

    setLoadingPoll(true);
    setErrorPoll(null);
    const unsubscribePoll = getPollStream(pollId, (data) => {
      setPoll(data);
      setLoadingPoll(false);
    });
    // Fallback if stream doesn't immediately return, or for initial load for non-streamed data
    getPollById(pollId).then(initialPollData => {
      if (!poll && initialPollData) setPoll(initialPollData);
    }).catch(err => {
      console.error("Error fetching initial poll data:", err);
      if(loadingPoll) setErrorPoll(err instanceof Error ? err : new Error("Failed to fetch poll"));
    }).finally(() => {
      // If stream hasn't set loading to false yet
      // setTimeout(() => { if(loadingPoll) setLoadingPoll(false); }, 500); 
    });


    setLoadingVotes(true);
    setErrorVotes(null);
    const unsubscribeVotes = getPollVotesStream(pollId, (data) => {
      setVotes(data);
      if (currentUserId) {
        const userVote = data.find(v => v.voterId === currentUserId);
        setUserVotedParticipantId(userVote ? userVote.votedForId : null);
      }
      setLoadingVotes(false);
    });
    
    return () => {
      unsubscribePoll();
      unsubscribeVotes();
    };
  }, [pollId, currentUserId]);

  return { poll, votes, loadingPoll, loadingVotes, errorPoll, errorVotes, userVotedParticipantId };
};
