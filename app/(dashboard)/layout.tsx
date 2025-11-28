'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  // Protect dashboard routes
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Initialize desktop sidebar state on mount
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      // On desktop, start with sidebar expanded
      setSidebarCollapsed(false);
    }
  }, [setSidebarCollapsed]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Topbar */}
      <Topbar />

      {/* Main Content */}
      <main
        className={cn(
          'pt-20 transition-all duration-300',
          // Desktop: adjust padding based on sidebar state
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72',
          // Mobile: no padding (sidebar is overlay)
          'pl-0 lg:pl-0'
        )}
      >
        <div className="p-6 min-h-[calc(100vh-5rem)]">{children}</div>
      </main>
    </div>
  );
}
