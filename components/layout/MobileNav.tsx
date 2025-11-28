'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';

export function MobileNav() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);
  const previousIsMobileRef = useRef<boolean | null>(null);

  // Detect mobile screen size and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (previousIsMobileRef.current !== null && mobile !== previousIsMobileRef.current) {
        if (mobile) {
          setSidebarCollapsed(true);
        } else {
          setSidebarCollapsed(false);
        }
      }
      previousIsMobileRef.current = mobile;
    };

    const initialMobile = window.innerWidth < 1024;
    setIsMobile(initialMobile);
    
    if (previousIsMobileRef.current === null) {
      previousIsMobileRef.current = initialMobile;
      if (initialMobile) {
        setSidebarCollapsed(true);
      }
    }
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const isCurrentlyMobile = window.innerWidth < 1024;
    if (isCurrentlyMobile) {
      setSidebarCollapsed(true);
    }
  }, [pathname]);

  return (
    <>
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <div className="lg:hidden">
        <Sidebar />
      </div>
    </>
  );
}
