'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { workerVisitApi, clientApi, engineerApi } from '@/lib/api';
import { WorkerVisit, Client, Engineer, PaginatedResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Loader2,
  Building2,
  User,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function WorkerCountsPage() {
  const { user } = useAuthStore();
  const [visits, setVisits] = useState<WorkerVisit[]>([]);
  const [pendingVisits, setPendingVisits] = useState<WorkerVisit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<WorkerVisit | null>(null);

  // Create form
  const [createData, setCreateData] = useState({
    clientId: '',
    engineerId: '',
    visitDate: '',
    siteAddress: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Submit form
  const [submitData, setSubmitData] = useState({
    workerCount: '',
    otp: '',
    remarks: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchVisits();
      fetchClients();
      fetchEngineers();
    } else if (user?.role === 'ENGINEER') {
      fetchPendingVisits();
    }
  }, [page, searchTerm, user]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await workerVisitApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      const data = response.data as PaginatedResponse<WorkerVisit>;
      setVisits(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVisits = async () => {
    try {
      setLoading(true);
      const response = await workerVisitApi.getPending();
      setPendingVisits(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch pending visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientApi.getAll({ limit: 1000 });
      const data = response.data as PaginatedResponse<Client>;
      setClients(data.data.filter((c) => c.isActive));
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchEngineers = async () => {
    try {
      const response = await engineerApi.getAll({ limit: 1000 });
      const data = response.data as PaginatedResponse<Engineer>;
      setEngineers(data.data.filter((e) => e.isActive));
    } catch (error: any) {
      console.error('Failed to fetch engineers:', error);
    }
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      await workerVisitApi.create({
        ...createData,
        siteAddress: createData.siteAddress || undefined,
      });

      toast.success('Worker visit created and OTP sent to client & admin');
      setIsCreateDialogOpen(false);
      setCreateData({
        clientId: '',
        engineerId: '',
        visitDate: '',
        siteAddress: '',
      });
      if (user?.role === 'ADMIN') {
        fetchVisits();
      } else {
        fetchPendingVisits();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create visit');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenSubmitDialog = (visit: WorkerVisit) => {
    setSelectedVisit(visit);
    setSubmitData({
      workerCount: '',
      otp: '',
      remarks: '',
    });
    setIsSubmitDialogOpen(true);
  };

  const handleSubmitCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    setSubmitLoading(true);
    try {
      await workerVisitApi.submitCount(selectedVisit.id, {
        workerCount: Number(submitData.workerCount),
        otp: submitData.otp,
        remarks: submitData.remarks || undefined,
      });

      toast.success('Worker count submitted successfully');
      setIsSubmitDialogOpen(false);
      if (user?.role === 'ENGINEER') {
        fetchPendingVisits();
      } else {
        fetchVisits();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit count');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string; icon: any }> = {
      PENDING: {
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: 'Pending',
        icon: Clock,
      },
      OTP_VERIFIED: {
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        label: 'Verified',
        icon: CheckCircle,
      },
      COMPLETED: {
        className: 'bg-green-500/10 text-green-400 border-green-500/30',
        label: 'Completed',
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Engineer View - Pending Visits
  if (user?.role === 'ENGINEER') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Worker Count Visits</h1>
          <p className="text-slate-400 mt-1">Submit worker counts for pending visits</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : pendingVisits.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-4 text-slate-400">No pending visits</p>
                <p className="text-sm text-slate-500 mt-1">
                  Check back later for new worker count assignments
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingVisits.map((visit) => {
              const isExpired = visit.otpExpiresAt && isPast(new Date(visit.otpExpiresAt));

              return (
                <Card
                  key={visit.id}
                  className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-slate-100">
                            {visit.client.name}
                          </CardTitle>
                          <p className="text-sm text-slate-400 mt-1">
                            {format(new Date(visit.visitDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(visit.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Site Address */}
                    {visit.siteAddress && (
                      <div className="flex items-start text-slate-300">
                        <MapPin className="w-4 h-4 mr-2 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{visit.siteAddress}</span>
                      </div>
                    )}

                    {/* OTP Info */}
                    {visit.otpSentAt && (
                      <div className={`p-3 border rounded-lg ${
                        isExpired
                          ? 'bg-red-500/5 border-red-500/20'
                          : 'bg-blue-500/5 border-blue-500/20'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-400">OTP Status</p>
                          {isExpired ? (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                              Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                              Valid
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {visit.otpExpiresAt && (
                            isExpired
                              ? `Expired ${formatDistanceToNow(new Date(visit.otpExpiresAt), { addSuffix: true })}`
                              : `Expires ${formatDistanceToNow(new Date(visit.otpExpiresAt), { addSuffix: true })}`
                          )}
                        </p>
                      </div>
                    )}

                    {/* Worker Count Display */}
                    {visit.status === 'COMPLETED' && visit.workerCount !== null && (
                      <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Worker Count:</span>
                          <span className="text-2xl font-bold text-green-400">
                            {visit.workerCount}
                          </span>
                        </div>
                        {visit.remarks && (
                          <p className="text-xs text-slate-500 mt-2">{visit.remarks}</p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {visit.status === 'PENDING' && !isExpired && (
                      <Button
                        onClick={() => handleOpenSubmitDialog(visit)}
                        className="w-full gradient-primary text-white"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Submit Worker Count
                      </Button>
                    )}

                    {isExpired && visit.status === 'PENDING' && (
                      <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-center">
                        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-red-400">
                          OTP expired. Contact admin for a new visit.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Submit Count Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Worker Count</DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter the worker count and verify with OTP
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitCount} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="workerCount" className="text-slate-200">
                  Number of Workers *
                </Label>
                <Input
                  id="workerCount"
                  type="number"
                  min="0"
                  value={submitData.workerCount}
                  onChange={(e) =>
                    setSubmitData({ ...submitData, workerCount: e.target.value })
                  }
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  placeholder="Enter worker count"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-200">
                  OTP Code *
                </Label>
                <Input
                  id="otp"
                  value={submitData.otp}
                  onChange={(e) =>
                    setSubmitData({ ...submitData, otp: e.target.value })
                  }
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="bg-slate-800 border-slate-700 text-slate-100 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoComplete="off"
                />
                <p className="text-xs text-slate-500">
                  OTP sent to client and admin (valid for 24 hours)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-slate-200">
                  Remarks
                </Label>
                <textarea
                  id="remarks"
                  value={submitData.remarks}
                  onChange={(e) =>
                    setSubmitData({ ...submitData, remarks: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                  disabled={submitLoading}
                  className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitLoading}
                  className="gradient-primary text-white"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Count'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin View - All Visits
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Worker Count Management</h1>
          <p className="text-slate-400 mt-1">Track worker counts for contractor payments</p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Visit
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search visits by client, engineer, or site..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            All Worker Visits ({visits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No worker visits found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Create your first worker count visit'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Client</TableHead>
                      <TableHead className="text-slate-300">Engineer</TableHead>
                      <TableHead className="text-slate-300">Site Address</TableHead>
                      <TableHead className="text-slate-300">Worker Count</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow
                        key={visit.id}
                        className="border-slate-800 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <div className="flex items-center text-slate-300 text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2 text-blue-400" />
                            {format(new Date(visit.visitDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="font-medium text-slate-200">
                              {visit.client.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-slate-300">{visit.engineer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {visit.siteAddress ? (
                            <div className="flex items-start text-slate-400 text-sm max-w-xs">
                              <MapPin className="w-3 h-3 mr-1.5 mt-0.5 text-slate-500 flex-shrink-0" />
                              <span className="line-clamp-2">{visit.siteAddress}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {visit.workerCount !== null ? (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-green-400" />
                              <span className="text-lg font-bold text-green-400">
                                {visit.workerCount}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(visit.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Worker Count Visit</DialogTitle>
            <DialogDescription className="text-slate-400">
              Schedule a new worker count visit (OTP will be sent to client & admin)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVisit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-slate-200">
                Client *
              </Label>
              <Select
                value={createData.clientId}
                onValueChange={(value) =>
                  setCreateData({ ...createData, clientId: value })
                }
                required
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="engineer" className="text-slate-200">
                Engineer *
              </Label>
              <Select
                value={createData.engineerId}
                onValueChange={(value) =>
                  setCreateData({ ...createData, engineerId: value })
                }
                required
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Select engineer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {engineers.map((engineer) => (
                    <SelectItem
                      key={engineer.id}
                      value={engineer.id}
                      className="text-slate-100 focus:bg-slate-700 focus:text-slate-100"
                    >
                      {engineer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitDate" className="text-slate-200">
                Visit Date *
              </Label>
              <Input
                id="visitDate"
                type="date"
                value={createData.visitDate}
                onChange={(e) =>
                  setCreateData({ ...createData, visitDate: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteAddress" className="text-slate-200">
                Site Address
              </Label>
              <Input
                id="siteAddress"
                value={createData.siteAddress}
                onChange={(e) =>
                  setCreateData({ ...createData, siteAddress: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="123 Main Street, City"
              />
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400">
                <Send className="w-3 h-3 inline mr-1" />
                OTP will be sent to both client and admin when this visit is created
              </p>
              <p className="text-xs text-slate-500 mt-1">
                OTP is valid for 24 hours with no attempt limit
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="gradient-primary text-white"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Visit'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
