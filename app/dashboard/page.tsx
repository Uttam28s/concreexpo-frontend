'use client';

import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Mock data - will be replaced with real API calls
  const stats = [
    {
      title: 'Total Appointments',
      value: '24',
      change: '+12%',
      icon: Calendar,
      color: 'blue',
    },
    {
      title: 'Pending Verifications',
      value: '8',
      change: '-5%',
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Total Stock',
      value: '450',
      change: '+8%',
      icon: Package,
      color: 'green',
    },
    {
      title: 'Active Workers',
      value: '35',
      change: '+15%',
      icon: Users,
      color: 'purple',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      yellow: 'from-amber-500 to-amber-600',
      green: 'from-emerald-500 to-emerald-600',
      purple: 'from-purple-500 to-purple-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-blue-400 border-blue-500/30 bg-blue-500/10 px-4 py-2"
        >
          {user?.role}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-200 card-hover"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {stat.title}
              </CardTitle>
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorClasses(
                  stat.color
                )} flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-slate-100">{stat.value}</div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="w-3 h-3 mr-1 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">{stat.change}</span>
                    <span className="text-slate-500 ml-1">from last month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">ABC Construction</p>
                    <p className="text-xs text-slate-400">Today at 2:00 PM</p>
                  </div>
                </div>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Scheduled
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">XYZ Builders</p>
                    <p className="text-xs text-slate-400">Yesterday</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border-l-4 border-amber-500">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Wall Putty</p>
                    <p className="text-xs text-slate-400">15 buckets remaining</p>
                  </div>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  Low
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border-l-4 border-red-500">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Tile Adhesive</p>
                    <p className="text-xs text-slate-400">8 buckets remaining</p>
                  </div>
                </div>
                <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                  Critical
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
