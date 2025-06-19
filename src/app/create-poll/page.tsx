"use client";

import PollCreateForm from '@/components/polls/PollCreateForm';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreatePollPage() {
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
      <PollCreateForm />
    </div>
  );
}
