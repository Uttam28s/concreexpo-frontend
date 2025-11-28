'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { featureFlags } from '@/lib/featureFlags';
import {
  LayoutDashboard,
  Calendar,
  Package,
  Users,
  BarChart3,
  Settings,
  Building2,
  Wrench,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: ('ADMIN' | 'ENGINEER')[];
  featureFlag?: () => boolean;
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    featureFlag: featureFlags.dashboard,
  },
  {
    title: 'Appointments',
    href: '/dashboard/appointments',
    icon: Calendar,
    featureFlag: featureFlags.appointments,
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    featureFlag: featureFlags.inventory,
  },
  {
    title: 'Worker Counts',
    href: '/dashboard/worker-counts',
    icon: Users,
    featureFlag: featureFlags.workerCounts,
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['ADMIN'],
    featureFlag: featureFlags.reports,
  },
];

const masterNavItems: NavItem[] = [
  {
    title: 'Clients',
    href: '/dashboard/clients',
    icon: Building2,
    roles: ['ADMIN'],
    featureFlag: featureFlags.clients,
  },
  {
    title: 'Engineers',
    href: '/dashboard/engineers',
    icon: Wrench,
    roles: ['ADMIN'],
    featureFlag: featureFlags.engineers,
  },
  {
    title: 'Materials',
    href: '/dashboard/materials',
    icon: Boxes,
    roles: ['ADMIN'],
    featureFlag: featureFlags.materials,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      // Check feature flag first
      if (item.featureFlag && !item.featureFlag()) {
        return false;
      }
      // Then check role permissions
      if (!item.roles) return true;
      return item.roles.includes(user?.role as any);
    });
  };

  // Get the correct dashboard href based on user role
  const getDashboardHref = () => {
    return user?.role === 'ENGINEER' ? '/dashboard/engineer' : '/dashboard';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300',
        // Z-index: higher than overlay (z-30) but below modals
        'z-40',
        // Mobile: always full width when visible, hide/show with translate
        'w-72',
        // Desktop: collapse/expand behavior (width only, no translation)
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-72',
        // Mobile: hide/show behavior (translate off-screen when collapsed)
        // On mobile, translate when collapsed; on desktop, never translate
        sidebarCollapsed 
          ? '-translate-x-full lg:translate-x-0' 
          : 'translate-x-0'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          {!sidebarCollapsed && (
            <Link href={getDashboardHref()} className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src="/Concreexpo-large-icon.png"
                  alt="Concreexpo"
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  CONCREEXPO
                </h1>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href={getDashboardHref()} className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto overflow-hidden flex-shrink-0">
              <Image
                src="/Concreexpo-large-icon.png"
                alt="Concreexpo"
                width={56}
                height={56}
                className="object-contain w-full h-full"
              />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {/* Main Navigation */}
          <div>
            {!sidebarCollapsed && (
              <h2 className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Main
              </h2>
            )}
            <ul className="space-y-1">
              {filterByRole(mainNavItems).map((item) => {
                // Use role-specific href for Dashboard
                const actualHref = item.title === 'Dashboard' ? getDashboardHref() : item.href;

                // Check if current page is active
                const isActive = item.title === 'Dashboard'
                  ? pathname === actualHref
                  : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <li key={item.href}>
                    <Link
                      href={actualHref}
                      className={cn(
                        'flex items-center px-3 py-3 rounded-lg transition-all duration-200 group',
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'flex-shrink-0',
                          sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="ml-3 font-medium">{item.title}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Masters Section - Only show for roles with access */}
          {filterByRole(masterNavItems).length > 0 && (
            <>
              <Separator className="bg-slate-800" />
              <div>
                {!sidebarCollapsed && (
                  <h2 className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Masters
                  </h2>
                )}
                <ul className="space-y-1">
                  {filterByRole(masterNavItems).map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-3 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-purple-500/10 text-purple-400 border-l-4 border-purple-500'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'flex-shrink-0',
                          sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="ml-3 font-medium">{item.title}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
            </>
          )}
        </nav>

        {/* Settings at Bottom */}
        {featureFlags.settings() && (
          <div className="px-3 py-4 border-t border-slate-800">
            <Link
              href="/dashboard/settings"
              className="flex items-center px-3 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200"
            >
              <Settings className={cn('flex-shrink-0', sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5')} />
              {!sidebarCollapsed && <span className="ml-3 font-medium">Settings</span>}
            </Link>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="px-3 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
      </div>
    </aside>
  );
}
