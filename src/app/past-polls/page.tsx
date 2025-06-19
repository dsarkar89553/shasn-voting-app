"use client";

import PastPollsList from '@/components/polls/PastPollsList';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PastPollsPage() {
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
    return <LoadingSpinner size="lg" />;
  }
  
  return (
    <div>
      <PastPollsList />
    </div>
  );
}
