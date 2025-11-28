'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, Settings, User, Menu } from 'lucide-react';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      logout();
      toast.success('Logged out successfully');
      router.push('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        'fixed top-0 z-30 h-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 transition-all duration-300',
        sidebarCollapsed ? 'lg:left-20' : 'lg:left-72',
        'left-0 right-0'
      )}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Menu Toggle - visible on all screen sizes */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </Button>

          {/* Breadcrumb / Page Title */}
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Dashboard</h2>
            <p className="text-sm text-slate-400">Welcome back, {user?.name}!</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 hover:bg-slate-800 px-3"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <Avatar className="h-10 w-10 ring-2 ring-slate-700">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <Badge
                  variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}
                  className={cn(
                    'hidden sm:block',
                    user?.role === 'ADMIN'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  )}
                >
                  {user?.role}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-slate-800 border-slate-700"
            >
              <DropdownMenuLabel className="text-slate-200">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
