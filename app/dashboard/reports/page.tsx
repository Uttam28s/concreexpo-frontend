'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { appointmentApi, inventoryApi, workerVisitApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Download,
  Calendar,
  Package,
  Users,
  Loader2,
  FileText,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Filter states
  const [appointmentFilters, setAppointmentFilters] = useState({
    startDate: '',
    endDate: '',
  });

  const [inventoryFilters, setInventoryFilters] = useState({
    startDate: '',
    endDate: '',
  });

  const [workerFilters, setWorkerFilters] = useState({
    startDate: '',
    endDate: '',
  });

  // Redirect if not admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleExportAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.export({
        startDate: appointmentFilters.startDate || undefined,
        endDate: appointmentFilters.endDate || undefined,
      });

      // response.data is already a Blob when responseType is 'blob'
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Appointments report exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      // If error response is JSON, try to parse it
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.error || 'Failed to export report');
        } catch {
          toast.error('Failed to export report');
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to export report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.export({
        startDate: inventoryFilters.startDate || undefined,
        endDate: inventoryFilters.endDate || undefined,
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Inventory report exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.error || 'Failed to export report');
        } catch {
          toast.error('Failed to export report');
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to export report');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportWorkerVisits = async () => {
    try {
      setLoading(true);
      const response = await workerVisitApi.export({
        startDate: workerFilters.startDate || undefined,
        endDate: workerFilters.endDate || undefined,
      });

      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `worker_visits_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Worker visits report exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const errorData = JSON.parse(text);
          toast.error(errorData.error || 'Failed to export report');
        } catch {
          toast.error('Failed to export report');
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to export report');
      }
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">Export and analyze business data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Appointments</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">Reports Available</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Inventory</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">Reports Available</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Worker Counts</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">Reports Available</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appointments" className="space-y-6">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger
                value="appointments"
                className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400"
              >
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger
                value="workers"
                className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400"
              >
                <Users className="w-4 h-4 mr-2" />
                Worker Counts
              </TabsTrigger>
            </TabsList>

            {/* Appointments Reports */}
            <TabsContent value="appointments" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apptStartDate" className="text-slate-200">
                    Start Date
                  </Label>
                  <Input
                    id="apptStartDate"
                    type="date"
                    value={appointmentFilters.startDate}
                    onChange={(e) =>
                      setAppointmentFilters({ ...appointmentFilters, startDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apptEndDate" className="text-slate-200">
                    End Date
                  </Label>
                  <Input
                    id="apptEndDate"
                    type="date"
                    value={appointmentFilters.endDate}
                    onChange={(e) =>
                      setAppointmentFilters({ ...appointmentFilters, endDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleExportAppointments}
                  disabled={loading}
                  className="w-full sm:w-auto gradient-primary text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Appointments Report
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-4">
                <h4 className="text-sm font-medium text-slate-200 mb-2">Report Includes:</h4>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>All appointments within date range</li>
                  <li>Client and engineer details</li>
                  <li>Visit dates and site addresses</li>
                  <li>OTP verification status</li>
                  <li>Feedback and completion status</li>
                </ul>
              </div>
            </TabsContent>

            {/* Inventory Reports */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invStartDate" className="text-slate-200">
                    Start Date
                  </Label>
                  <Input
                    id="invStartDate"
                    type="date"
                    value={inventoryFilters.startDate}
                    onChange={(e) =>
                      setInventoryFilters({ ...inventoryFilters, startDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invEndDate" className="text-slate-200">
                    End Date
                  </Label>
                  <Input
                    id="invEndDate"
                    type="date"
                    value={inventoryFilters.endDate}
                    onChange={(e) =>
                      setInventoryFilters({ ...inventoryFilters, endDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleExportInventory}
                  disabled={loading}
                  className="w-full sm:w-auto gradient-primary text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Inventory Report
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-4">
                <h4 className="text-sm font-medium text-slate-200 mb-2">Report Includes:</h4>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>All stock transactions within date range</li>
                  <li>Material-wise stock in/out quantities</li>
                  <li>Current stock balances</li>
                  <li>Site-wise material usage</li>
                  <li>Low stock alerts</li>
                </ul>
              </div>
            </TabsContent>

            {/* Worker Visits Reports */}
            <TabsContent value="workers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workerStartDate" className="text-slate-200">
                    Start Date
                  </Label>
                  <Input
                    id="workerStartDate"
                    type="date"
                    value={workerFilters.startDate}
                    onChange={(e) =>
                      setWorkerFilters({ ...workerFilters, startDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workerEndDate" className="text-slate-200">
                    End Date
                  </Label>
                  <Input
                    id="workerEndDate"
                    type="date"
                    value={workerFilters.endDate}
                    onChange={(e) =>
                      setWorkerFilters({ ...workerFilters, endDate: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleExportWorkerVisits}
                  disabled={loading}
                  className="w-full sm:w-auto gradient-primary text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Worker Counts Report
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-4">
                <h4 className="text-sm font-medium text-slate-200 mb-2">Report Includes:</h4>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>All worker count visits within date range</li>
                  <li>Client and contractor details</li>
                  <li>Site-wise worker count summary</li>
                  <li>Date-wise worker count trends</li>
                  <li>Verified vs pending visits</li>
                  <li>Useful for contractor payment calculations</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-slate-100 mb-1">Report Format</h3>
              <p className="text-sm text-slate-400">
                All reports are exported in Excel (.xlsx) format with detailed data and formatting.
                Filters are optional - leave blank to export all data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
