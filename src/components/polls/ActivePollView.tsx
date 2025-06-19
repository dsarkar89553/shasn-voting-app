"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePollData } from '@/hooks/usePollData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { submitVote, endPoll, deletePoll } from '@/lib/firebaseService'; // Placeholder
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ThumbsUp, Trash2, Ban, ShieldCheck, BarChart3, User, CalendarDays, CheckCircle2 } from 'lucide-react';
import type { PollParticipant } from '@/types';

interface VoteCount {
  [participantId: string]: number;
}

export default function ActivePollView({ pollId }: { pollId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { poll, votes, loadingPoll, loadingVotes, errorPoll, errorVotes, userVotedParticipantId } = usePollData(pollId, user?.id);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (participantId: string) => {
    if (!user || !poll) return;
    setIsSubmitting(true);
    try {
      const success = await submitVote(poll.id, user.id, participantId);
      if (success) {
        toast({ title: 'Vote Submitted!', description: 'vote hoye geche.khusi thak.' });
      } else {
        toast({ title: 'Vote Failed', description: 'kono karone hoyni, refresh kore chesta kor.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'kichu somossa hoiche bara.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleEndPoll = async () => {
    if (!user || !poll) return;
    setIsSubmitting(true);
    try {
      const success = await endPoll(poll.id, user.id);
      if (success) {
        toast({ title: 'Vote sesh', description: 'Sesh hoye geche bari ja.' });
        // Poll data will update via stream, showing results
      } else {
        toast({ title: 'sesh hocche na', description: 'Je banay sudhu sei sesh korte pare.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'janina ki hoiche.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDeletePoll = async () => {
    if (!user || !poll) return;
    setIsSubmitting(true);
    try {
      const success = await deletePoll(poll.id, user.id);
      if (success) {
        toast({ title: 'voting Deleted', description: 'Voye paye delete kore dilam.' });
        router.push('/dashboard');
      } else {
        toast({ title: 'Delete hocche na', description: 'Je banay sudhu sei nosto korte pare.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'janina bara.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  if (authLoading || loadingPoll || loadingVotes) {
    return <LoadingSpinner size="lg" />;
  }

  if (errorPoll || errorVotes) {
    return <div className="text-destructive text-center">Vote er data load kora jacchena apatoto: {errorPoll?.message || errorVotes?.message}</div>;
  }

  if (!poll) {
    return <div className="text-center text-xl font-semibold mt-10">Vote hoyni ba khuje pacchina.</div>;
  }
  
  const isCreator = user?.id === poll.creatorId;
  const pollIsActive = poll.status === 'active';

  const calculateVoteCounts = (): VoteCount => {
    const counts: VoteCount = {};
    poll.participants.forEach(p => counts[p.id] = 0); // Initialize counts
    votes.forEach(vote => {
      counts[vote.votedForId] = (counts[vote.votedForId] || 0) + 1;
    });
    return counts;
  };
  const voteCounts = calculateVoteCounts();

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">{poll.name}</CardTitle>
        <CardDescription className="text-center space-y-1">
          <span className="flex items-center justify-center gap-1"><User className="h-4 w-4 text-muted-foreground" /> Created by: {poll.creatorDisplayName}</span>
          <span className="flex items-center justify-center gap-1"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Created on: {new Date(poll.createdAt).toLocaleDateString()}</span>
          Status: <span className={`font-semibold ${pollIsActive ? 'text-green-600' : 'text-orange-600'}`}>{poll.status.toUpperCase()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pollIsActive && user && !userVotedParticipantId && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center text-primary">Cast Your Vote:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {poll.participants.map((participant: PollParticipant) => (
                participant.id !== user.id && (
                  <Button
                    key={participant.id}
                    onClick={() => handleVote(participant.id)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 transition-all duration-150 ease-in-out hover:shadow-md hover:bg-accent/10 focus:ring-2 focus:ring-accent"
                  >
                    <ThumbsUp className="mr-3 h-5 w-5 text-accent" />
                    <span className="flex-grow">{participant.displayName}</span>
                  </Button>
                )
              ))}
            </div>
             {poll.participants.every(p => p.id === user.id) && (
                <p className="text-muted-foreground text-center mt-4">Eka khelte parbi bara ?</p>
            )}
             {!poll.participants.some(p => p.id !== user.id) && poll.participants.length > 0 && (
                <p className="text-muted-foreground text-center mt-4">Vote kake korbi ?keu e to nai.</p>
            )}
          </div>
        )}

        {userVotedParticipantId && pollIsActive && (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-700">You have voted for {poll.participants.find(p => p.id === userVotedParticipantId)?.displayName || 'a participant'}.</p>
            <p className="text-sm text-green-600">Sesh hole dekhte pabi.</p>
          </div>
        )}
        
        {poll.status === 'ended' && (
           <div>
            <h3 className="text-xl font-semibold mb-4 text-center text-primary flex items-center justify-center gap-2">
              <BarChart3 className="h-6 w-6" />Results
            </h3>
            <ul className="space-y-3">
              {poll.participants.sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)).map((participant: PollParticipant) => (
                <li key={participant.id} className="p-3 bg-muted/50 rounded-md shadow-sm flex justify-between items-center">
                  <span className="font-medium">{participant.displayName}</span>
                  <span className="font-bold text-primary">{voteCounts[participant.id] || 0} votes</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </CardContent>
      {isCreator && pollIsActive && (
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10" disabled={isSubmitting}>
                <Ban className="mr-2 h-5 w-5" /> vote sesh kori
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>End Voting?</AlertDialogTitle></AlertDialogHeader>
              <AlertDialogDescription>Tui ki sotti e voting sesh korte chas?</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>na</AlertDialogCancel>
                <AlertDialogAction onClick={handleEndPoll} className="bg-destructive hover:bg-destructive/90">sesh kori</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
       {isCreator && poll.status !== 'deleted' && ( // Show delete if not already deleted
        <CardFooter className={`flex flex-col sm:flex-row justify-end gap-3 ${pollIsActive ? '' : 'pt-6 border-t'}`}>
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto" disabled={isSubmitting}>
                <Trash2 className="mr-2 h-5 w-5" /> voy paye gechi
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete korbi?</AlertDialogTitle></AlertDialogHeader>
              <AlertDialogDescription>Keno re gar faite geche naki?</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Bal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePoll} className="bg-destructive hover:bg-destructive/90">Ha onekta</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
