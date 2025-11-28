'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { appointmentApi, clientApi, engineerApi } from '@/lib/api';
import { Appointment, Client, Engineer, PaginatedResponse, AppointmentStatus } from '@/types';
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
  FileText,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    engineerId: '',
    visitDate: '',
    purpose: '',
    siteAddress: '',
    otpMobileNumber: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    if (user?.role === 'ADMIN') {
      fetchClients();
      fetchEngineers();
    }
  }, [page, searchTerm, user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      const data = response.data as PaginatedResponse<Appointment>;
      setAppointments(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch appointments');
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

  const handleOpenDialog = () => {
    setFormData({
      clientId: '',
      engineerId: '',
      visitDate: '',
      purpose: '',
      siteAddress: '',
      otpMobileNumber: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const submitData = {
        ...formData,
        purpose: formData.purpose || undefined,
        siteAddress: formData.siteAddress || undefined,
        otpMobileNumber: formData.otpMobileNumber || undefined,
      };

      await appointmentApi.create(submitData);
      toast.success('Appointment created successfully');
      setIsDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create appointment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendOtp = async (appointmentId: string) => {
    try {
      await appointmentApi.sendOtp(appointmentId);
      toast.success('OTP sent successfully');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleViewDetails = async (appointmentId: string) => {
    try {
      setDetailLoading(true);
      setIsDetailDialogOpen(true);
      const response = await appointmentApi.getById(appointmentId);
      setSelectedAppointment(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch appointment details');
      setIsDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedAppointment(null);
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusConfig = {
      SCHEDULED: {
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        icon: Clock,
        label: 'Scheduled',
      },
      OTP_SENT: {
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: Send,
        label: 'OTP Sent',
      },
      VERIFIED: {
        className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        icon: CheckCircle,
        label: 'Verified',
      },
      COMPLETED: {
        className: 'bg-green-500/10 text-green-400 border-green-500/30',
        icon: CheckCircle,
        label: 'Completed',
      },
      CANCELLED: {
        className: 'bg-red-500/10 text-red-400 border-red-500/30',
        icon: XCircle,
        label: 'Cancelled',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Appointments</h1>
          <p className="text-slate-400 mt-1">Manage client site visits and verifications</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button
            onClick={handleOpenDialog}
            className="gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search appointments by client, engineer, or site..."
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

      {/* Appointments Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            All Appointments ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No appointments found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Schedule your first appointment to get started'}
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
                      <TableHead className="text-slate-300 hidden md:table-cell">Engineer</TableHead>
                      <TableHead className="text-slate-300 hidden lg:table-cell">Site Address</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow
                        key={appointment.id}
                        className="border-slate-800 hover:bg-slate-800/30 cursor-pointer"
                        onClick={() => handleViewDetails(appointment.id)}
                      >
                        <TableCell>
                          <div className="flex items-center text-slate-300 text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2 text-blue-400" />
                            {format(new Date(appointment.visitDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="font-medium text-slate-200">
                              {appointment.client.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-slate-300">{appointment.engineer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {appointment.siteAddress ? (
                            <div className="flex items-start text-slate-400 text-sm max-w-xs">
                              <MapPin className="w-3 h-3 mr-1.5 mt-0.5 text-slate-500 flex-shrink-0" />
                              <span className="line-clamp-2">{appointment.siteAddress}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Mobile View Details Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(appointment.id)}
                              className="md:hidden text-blue-400 hover:bg-blue-500/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* Send OTP Button for Admin */}
                            {user?.role === 'ADMIN' && appointment.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendOtp(appointment.id);
                                }}
                                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Send OTP</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new site visit appointment
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client" className="text-slate-200">
                Client *
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
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

            {/* Engineer */}
            <div className="space-y-2">
              <Label htmlFor="engineer" className="text-slate-200">
                Engineer *
              </Label>
              <Select
                value={formData.engineerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, engineerId: value })
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

            {/* Visit Date */}
            <div className="space-y-2">
              <Label htmlFor="visitDate" className="text-slate-200">
                Visit Date *
              </Label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={(e) =>
                  setFormData({ ...formData, visitDate: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Site Address */}
            <div className="space-y-2">
              <Label htmlFor="siteAddress" className="text-slate-200">
                Site Address
              </Label>
              <Input
                id="siteAddress"
                value={formData.siteAddress}
                onChange={(e) =>
                  setFormData({ ...formData, siteAddress: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="123 Main Street, City"
              />
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose" className="text-slate-200">
                Purpose
              </Label>
              <Input
                id="purpose"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="Site inspection, measurement, etc."
              />
            </div>

            {/* OTP Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="otpMobileNumber" className="text-slate-200">
                OTP Mobile Number (Optional)
              </Label>
              <Input
                id="otpMobileNumber"
                value={formData.otpMobileNumber}
                onChange={(e) =>
                  setFormData({ ...formData, otpMobileNumber: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="+91 98765 43210"
              />
              <p className="text-xs text-slate-500">
                If not provided, OTP will be sent to client's primary contact
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={formLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="gradient-primary text-white"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Appointment'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={handleCloseDetailDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
              Appointment Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete information about this appointment
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : selectedAppointment ? (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Current Status</span>
                {getStatusBadge(selectedAppointment.status)}
              </div>

              {/* Visit Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Visit Date</span>
                </div>
                <p className="text-slate-100 pl-6">
                  {format(new Date(selectedAppointment.visitDate), 'EEEE, MMMM dd, yyyy')}
                </p>
              </div>

              {/* Client Information */}
              <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Client Information</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="text-xs text-slate-400">Name</p>
                    <p className="text-slate-100">{selectedAppointment.client.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Primary Contact</p>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedAppointment.client.primaryContact}
                    </div>
                  </div>
                  {selectedAppointment.client.secondaryContact && (
                    <div>
                      <p className="text-xs text-slate-400">Secondary Contact</p>
                      <div className="flex items-center gap-2 text-slate-100">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedAppointment.client.secondaryContact}
                      </div>
                    </div>
                  )}
                  {selectedAppointment.client.address && (
                    <div>
                      <p className="text-xs text-slate-400">Client Address</p>
                      <div className="flex items-start gap-2 text-slate-100">
                        <MapPin className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
                        <span>{selectedAppointment.client.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Engineer Information */}
              <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-slate-300">Engineer Information</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="text-xs text-slate-400">Name</p>
                    <p className="text-slate-100">{selectedAppointment.engineer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedAppointment.engineer.email}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mobile Number</p>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedAppointment.engineer.mobileNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Details */}
              <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Site Details</span>
                </div>
                <div className="space-y-2 pl-6">
                  {selectedAppointment.siteAddress ? (
                    <div>
                      <p className="text-xs text-slate-400">Site Address</p>
                      <p className="text-slate-100">{selectedAppointment.siteAddress}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No site address specified</p>
                  )}
                  {selectedAppointment.googleMapsLink && (
                    <div>
                      <p className="text-xs text-slate-400">Google Maps Link</p>
                      <a
                        href={selectedAppointment.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Purpose */}
              {selectedAppointment.purpose && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">Purpose</span>
                  </div>
                  <p className="text-slate-100 pl-6">{selectedAppointment.purpose}</p>
                </div>
              )}

              {/* OTP Details */}
              {selectedAppointment.otpMobileNumber && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">OTP Mobile Number</span>
                  </div>
                  <p className="text-slate-100 pl-6">{selectedAppointment.otpMobileNumber}</p>
                </div>
              )}

              {/* OTP Sent Information */}
              {selectedAppointment.otpSentAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">OTP Sent At</span>
                  </div>
                  <p className="text-slate-100 pl-6">
                    {format(new Date(selectedAppointment.otpSentAt), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}

              {/* Verification Information */}
              {selectedAppointment.verifiedAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-slate-300">Verified At</span>
                  </div>
                  <p className="text-slate-100 pl-6">
                    {format(new Date(selectedAppointment.verifiedAt), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {selectedAppointment.feedback && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Feedback</span>
                  </div>
                  <div className="pl-6 p-3 bg-slate-800 rounded border border-slate-700">
                    <p className="text-slate-100">{selectedAppointment.feedback}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-slate-700 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{format(new Date(selectedAppointment.createdAt), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{format(new Date(selectedAppointment.updatedAt), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
            <Button
              onClick={handleCloseDetailDialog}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
