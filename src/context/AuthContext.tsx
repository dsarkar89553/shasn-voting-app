"use client";

import type { AppUser } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { findUserByUsername, findUserById } from '@/lib/users';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (username: string, password_input: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUserId = localStorage.getItem('pollMasterUserId');
    if (storedUserId) {
      const foundUser = findUserById(storedUserId);
      if (foundUser) {
        setUser({ ...foundUser, password: '' }); // Clear password from state
      } else {
        localStorage.removeItem('pollMasterUserId'); // Invalid user ID
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/login'];
      const pathIsPublic = publicPaths.includes(pathname);

      if (!user && !pathIsPublic) {
        router.push('/login');
      } else if (user && pathIsPublic) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);


  const login = async (username: string, password_input: string): Promise<boolean> => {
    setLoading(true);
    const foundUser = findUserByUsername(username);
    if (foundUser && foundUser.password === password_input) {
      setUser({ ...foundUser, password: '' }); // Clear password from state
      localStorage.setItem('pollMasterUserId', foundUser.id);
      setLoading(false);
      router.push('/dashboard');
      return true;
    }
    setUser(null);
    localStorage.removeItem('pollMasterUserId');
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pollMasterUserId');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
