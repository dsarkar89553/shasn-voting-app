"use client";

import { useState, useEffect } from 'react';
import type { ActivePollStatus } from '@/types';
import { getActivePollStatusStream } from '@/lib/firebaseService'; // Placeholder

export const useActivePollStatus = () => {
  const [activePollStatus, setActivePollStatus] = useState<ActivePollStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const unsubscribe = getActivePollStatusStream((status) => {
        setActivePollStatus(status);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error fetching active poll status:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch active poll status"));
      setLoading(false);
    }
  }, []);

  return { activePollStatus, loading, error };
};
