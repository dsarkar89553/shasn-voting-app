
"use client";

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createPollAction } from '@/actions/pollActions';
import type { AppUser, Poll } from '@/types';
import { appUsers } from '@/lib/users'; 
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, Users, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
// Removed: _forceClientSideActivePollStatus, _clientSideCachePoll as Firestore handles this

const initialState = {
  message: '',
  success: false,
  errors: {},
  poll: undefined as Poll | undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={pending}>
      {pending ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-5 w-5" />}
      {pending ? 'Publishing...' : 'Publish Poll'}
    </Button>
  );
}

export default function PollCreateForm() {
  const [state, formAction] = useActionState(createPollAction, initialState);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

 useEffect(() => {
    // Set creator as selected by default
    if (user && !selectedParticipants.includes(user.id)) { 
      setSelectedParticipants(prev => [...prev, user.id]);
    }
  }, [user, selectedParticipants]);


  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Success!' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success && state.poll) {
        // No longer need to manually cache or force status. Firestore listeners will update UI.
        router.push('/dashboard');
      }
    }
  }, [state, toast, router]);

  const handleParticipantChange = (participantId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };
  
  const handleFormAction = (payload: FormData) => {
    // The creator is automatically included by the server action.
    // We filter out the creator from the participant list being sent if they unchecked themselves,
    // as the action ensures their inclusion.
    // However, it's simpler if the action handles this. The form sends all checked IDs.
    // The action `createPollAction` will ensure creator is added and handles duplicates.
    formAction(payload);
  };


  if (authLoading || !user) {
    return <LoadingSpinner size="lg"/>;
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">Create a New Poll</CardTitle>
        <CardDescription className="text-center">Define your poll details and select participants. You are automatically included.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleFormAction} className="space-y-6">
          <input type="hidden" name="creatorId" value={user.id} />
          
          <div className="space-y-2">
            <Label htmlFor="pollName" className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Poll Name</Label>
            <Input
              id="pollName"
              name="pollName"
              required
              minLength={3}
              placeholder="e.g., Favorite Weekend Activity"
              className="bg-background"
            />
            {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Select other participants (min. 1)</Label>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">You, as the creator, are automatically included in the poll.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-4 bg-muted/30">
              {appUsers.map(participantUser => {
                const isCreator = participantUser.id === user.id;
                return (
                  <div key={participantUser.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/10 transition-colors">
                    <Checkbox
                      id={`participant-${participantUser.id}`}
                      name="participants" // This name is used by formData.getAll('participants')
                      value={participantUser.id}
                      checked={selectedParticipants.includes(participantUser.id)}
                      onCheckedChange={() => handleParticipantChange(participantUser.id)}
                      aria-label={participantUser.displayName + (isCreator ? " (You - automatically included)" : "")}
                      // Creator checkbox is now clickable but their inclusion is guaranteed by backend
                    />
                    <Label 
                      htmlFor={`participant-${participantUser.id}`} 
                      className={`font-normal cursor-pointer flex-grow ${isCreator ? 'text-muted-foreground' : ''}`}
                    >
                      {participantUser.displayName} {isCreator && "(You - automatically included)"}
                    </Label>
                  </div>
                );
              })}
            </div>
             {state?.errors?.participants && <p className="text-sm text-destructive">{state.errors.participants.join(', ')}</p>}
          </div>
          
          <SubmitButton />
          {state?.errors?.general && <p className="text-sm text-destructive text-center mt-2">{state.errors.general.join(', ')}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
