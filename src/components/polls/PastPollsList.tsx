
"use client";

import { useEffect, useState } from 'react';
import type { Poll, Vote } from '@/types'; // Import Vote
import { getPastPolls } from '@/lib/firebaseService'; 
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, User, CalendarDays, CheckSquare, XSquare, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function PastPollsList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true);
        // getPastPolls now fetches polls and their votes for calculating results
        const pastPollsData = await getPastPolls();
        setPolls(pastPollsData);
      } catch (err) {
        console.error("Error fetching past polls:", err);
        setError("Failed to load past polls.");
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <div className="text-destructive text-center">{error}</div>;
  }

  if (polls.length === 0) {
    return (
      <Card className="shadow-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2"><Archive className="h-7 w-7 text-primary" />No Past Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">There are no ended or deleted polls to display yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-headline text-center mb-8 flex items-center justify-center gap-2">
         <Archive className="h-8 w-8 text-primary" /> Past Polls
       </h1>
      {polls.map(poll => (
        <Card key={poll.id} className="shadow-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-xl font-headline">{poll.name}</CardTitle>
              <Badge variant={poll.status === 'ended' ? 'secondary' : 'destructive'} className="whitespace-nowrap">
                {poll.status === 'ended' ? <CheckSquare className="mr-1 h-4 w-4" /> : <XSquare className="mr-1 h-4 w-4" />}
                {poll.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription className="space-y-1 pt-1">
              <span className="flex items-center gap-1 text-sm"><User className="h-4 w-4" />Created by: {poll.creatorDisplayName}</span>
              <span className="flex items-center gap-1 text-sm"><CalendarDays className="h-4 w-4" />
                {poll.status === 'ended' ? 'Ended' : 'Deleted'} on: {new Date(poll.endedAt || poll.createdAt).toLocaleDateString()}
              </span>
            </CardDescription>
          </CardHeader>
          {poll.status === 'ended' && poll.votes && ( // poll.votes is now calculated and added by getPastPolls
            <CardContent>
              <h4 className="font-semibold mb-2 flex items-center gap-1"><BarChart3 className="h-5 w-5 text-primary"/>Results:</h4>
              <ul className="space-y-1 text-sm">
                {poll.participants.sort((a,b) => (poll.votes![b.id] || 0) - (poll.votes![a.id] || 0) ).map(participant => (
                  <li key={participant.id} className="flex justify-between items-center p-1.5 bg-muted/30 rounded">
                    <span>{participant.displayName}</span>
                    <span className="font-medium">{poll.votes![participant.id] || 0} votes</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
           {poll.status === 'deleted' && (
            <CardContent>
              <p className="text-sm text-muted-foreground italic">This poll was deleted and results are not available.</p>
            </CardContent>
           )}
          <CardFooter>
            <Button asChild variant="link" className="p-0 h-auto text-primary">
              <Link href={`/poll/${poll.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
