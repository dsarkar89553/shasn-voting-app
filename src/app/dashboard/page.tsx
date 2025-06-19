"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useActivePollStatus } from '@/hooks/useActivePollStatus';
import { PlusCircle, Eye, Archive, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activePollStatus, loading: pollStatusLoading, error: pollStatusError } = useActivePollStatus();

  if (authLoading || pollStatusLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // This should ideally be handled by AuthProvider/AuthGuard, but as a fallback:
    router.replace('/login');
    return <LoadingSpinner size="lg" />;
  }
  
  if (pollStatusError) {
    return <div className="text-destructive text-center">Error loading poll status: {pollStatusError.message}</div>;
  }

  const canCreatePoll = !activePollStatus?.activePollId && !activePollStatus?.isCreating;
  const canViewActivePoll = !!activePollStatus?.activePollId;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center sm:text-left">Poll Master Dashboard</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Manage your polls or participate in active ones.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <PlusCircle className="text-primary" /> Create New Poll
            </CardTitle>
            <CardDescription>Start a new poll for users to vote on.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/create-poll')}
              disabled={!canCreatePoll || pollStatusLoading}
              className="w-full bg-primary hover:bg-primary/90"
              aria-label="Create New Poll"
            >
              {pollStatusLoading && activePollStatus?.isCreating ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2 h-5 w-5" />}
              {activePollStatus?.isCreating ? 'Creating...' : 'Create Poll'}
            </Button>
            {!canCreatePoll && !activePollStatus?.isCreating && (
              <p className="text-sm text-muted-foreground mt-2">
                An active poll is already running or being created.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Eye className="text-accent" /> View Active Poll
            </CardTitle>
            <CardDescription>See the current active poll and cast your vote.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push(`/poll/${activePollStatus?.activePollId}`)}
              disabled={!canViewActivePoll || pollStatusLoading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label="View Active Poll"
            >
              {pollStatusLoading ? <Loader2 className="animate-spin mr-2" /> : <Eye className="mr-2 h-5 w-5" />}
              View Poll
            </Button>
            {!canViewActivePoll && (
              <p className="text-sm text-muted-foreground mt-2">
                No poll is currently active.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Archive className="text-secondary-foreground" /> View Past Polls
            </CardTitle>
            <CardDescription>Browse through completed or deleted polls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/past-polls')}
              variant="secondary"
              className="w-full"
              aria-label="View Past Polls"
            >
              <Archive className="mr-2 h-5 w-5" />
              Past Polls
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}