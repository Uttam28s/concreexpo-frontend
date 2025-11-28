'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect authenticated users to dashboard based on role
      if (user?.role === 'ADMIN') {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboard/engineer');
      }
    } else {
      // Redirect unauthenticated users to login
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
