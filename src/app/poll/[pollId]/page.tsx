
"use client";

import ActivePollView from '@/components/polls/ActivePollView';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, use } from 'react'; // Import React.use

interface PollPageProps {
  params: { // The type definition remains as an object for now
    pollId: string;
  };
}

export default function PollPage({ params }: PollPageProps) {
  // Unwrap params using React.use, as per the Next.js warning.
  // Cast to `any` as the runtime value might be a Promise (or promise-like)
  // while the static type from PollPageProps is an object.
  const resolvedParams = use(params as any); 
  const { pollId } = resolvedParams; // Destructure from the resolved params

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }
  if (!user) {
    // Will be redirected by useEffect, but good to have a fallback render
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div>
      <ActivePollView pollId={pollId} />
    </div>
  );
}
