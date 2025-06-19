"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Users, VoteIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function AppNavbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading || !user || pathname === '/login') {
    return (
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href={user ? "/dashboard" : "/login"} className="text-2xl font-headline font-bold flex items-center gap-2">
             <VoteIcon className="h-7 w-7" /> BostroCart exclusive voting system
          </Link>
        </div>
      </header>
    );
  }
  
  return (
    <header className="bg-primary text-primary-foreground shadow-md print:hidden">
      <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-headline font-bold flex items-center gap-2 mb-2 sm:mb-0">
          <VoteIcon className="h-7 w-7" /> BostroCart exclusive voting system
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-sm hidden sm:block">Welcome, {user.displayName}!</span>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="hover:bg-primary-foreground/10">
            AllFucks
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-primary-foreground/10">
            <LogOut className="mr-1 h-4 w-4" /> Beroy jai
          </Button>
        </div>
      </div>
    </header>
  );
}