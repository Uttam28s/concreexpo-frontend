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
  MessageSquare,
  Eye,
  Phone,
  Mail,
  ExternalLink,
  RotateCw,
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
  const [totalCount, setTotalCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Detail Dialog
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<Appointment | null>(null);

  // OTP Dialog
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Feedback Dialog
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    engineerId: '',
    visitDate: '',
    visitTime: '09:00', // Default time
    purpose: '',
    siteAddress: '',
    googleMapsLink: '',
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
      setTotalCount(data.pagination.total);
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
      visitTime: '09:00',
      purpose: '',
      siteAddress: '',
      googleMapsLink: '',
      otpMobileNumber: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Combine date and time into ISO datetime string
      const visitDateTime = `${formData.visitDate}T${formData.visitTime}:00`;

      const submitData = {
        clientId: formData.clientId,
        engineerId: formData.engineerId,
        visitDate: visitDateTime,
        purpose: formData.purpose || undefined,
        siteAddress: formData.siteAddress || undefined,
        googleMapsLink: formData.googleMapsLink || undefined,
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

  const handleResendOtp = async (appointmentId: string) => {
    try {
      setResendOtpLoading(true);
      const response = await appointmentApi.resendOtp(appointmentId);
      toast.success('OTP resent successfully');
      
      // Set cooldown timer (60 seconds)
      setResendCooldown(60);
      const cooldownInterval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Refresh appointments to get updated OTP sent time
      fetchAppointments();
      
      // If dialog is open, refresh the selected appointment
      if (isOtpDialogOpen && selectedAppointment?.id === appointmentId) {
        const updatedAppointment = await appointmentApi.getById(appointmentId);
        setSelectedAppointment(updatedAppointment.data);
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 60;
        setResendCooldown(retryAfter);
        toast.error(error.response?.data?.error || `Please wait ${retryAfter} seconds before resending`);
        
        // Start cooldown timer
        const cooldownInterval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(error.response?.data?.error || 'Failed to resend OTP');
      }
    } finally {
      setResendOtpLoading(false);
    }
  };

  const handleViewDetails = async (appointmentId: string) => {
    try {
      setDetailLoading(true);
      setIsDetailDialogOpen(true);
      const response = await appointmentApi.getById(appointmentId);
      setSelectedAppointmentForDetail(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch appointment details');
      setIsDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedAppointmentForDetail(null);
  };

  const handleOpenOtpDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setOtp('');
    setIsOtpDialogOpen(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setOtpLoading(true);
    try {
      await appointmentApi.verifyOtp(selectedAppointment.id, otp);
      toast.success('OTP verified successfully');
      setIsOtpDialogOpen(false);
      setOtp('');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOpenFeedbackDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFeedback(appointment.feedback || '');
    setIsFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setFeedbackLoading(true);
    try {
      await appointmentApi.submitFeedback(selectedAppointment.id, feedback);
      toast.success('Feedback submitted successfully');
      setIsFeedbackDialogOpen(false);
      setFeedback('');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
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
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Appointments</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Manage client site visits and verifications</p>
        </div>
        {/* Desktop Button */}
        {user?.role === 'ADMIN' && (
          <Button
            onClick={handleOpenDialog}
            className="hidden md:flex gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      {user?.role === 'ADMIN' && (
        <Button
          onClick={handleOpenDialog}
          className="md:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

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
            All Appointments ({totalCount})
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
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Client</TableHead>
                      <TableHead className="text-slate-300">Engineer</TableHead>
                      <TableHead className="text-slate-300">Site Address</TableHead>
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
                            {format(new Date(appointment.visitDate), 'MMM dd, yyyy hh:mm a')}
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
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-slate-300">{appointment.engineer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* View Details Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(appointment.id)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Admin Actions */}
                            {user?.role === 'ADMIN' && appointment.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendOtp(appointment.id)}
                                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send OTP
                              </Button>
                            )}

                            {/* Engineer Actions */}
                            {user?.role === 'ENGINEER' && appointment.engineerId === user.id && (
                              <>
                                {appointment.status === 'SCHEDULED' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendOtp(appointment.id)}
                                    className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Send OTP
                                  </Button>
                                )}

                                {appointment.status === 'OTP_SENT' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenOtpDialog(appointment)}
                                    className="gradient-primary text-white"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verify OTP
                                  </Button>
                                )}

                                {(appointment.status === 'VERIFIED' || appointment.status === 'COMPLETED') && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenFeedbackDialog(appointment)}
                                    className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {appointment.feedback ? 'Edit Feedback' : 'Add Feedback'}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 space-y-3">
                      {/* Date and Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center text-slate-300 text-sm">
                          <CalendarIcon className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" />
                          <span>{format(new Date(appointment.visitDate), 'MMM dd, yyyy hh:mm a')}</span>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      {/* Client */}
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Client</p>
                          <p className="font-medium text-slate-200">{appointment.client.name}</p>
                        </div>
                      </div>

                      {/* Engineer */}
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Engineer</p>
                          <p className="text-slate-300">{appointment.engineer.name}</p>
                        </div>
                      </div>

                      {/* Site Address */}
                      {appointment.siteAddress && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Site Address</p>
                            <p className="text-sm text-slate-400">{appointment.siteAddress}</p>
                          </div>
                        </div>
                      )}

                      {/* Purpose */}
                      {appointment.purpose && (
                        <div className="flex items-start space-x-2">
                          <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Purpose</p>
                            <p className="text-sm text-slate-400">{appointment.purpose}</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                        {/* View Details Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(appointment.id)}
                          className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>

                        {/* Admin Actions */}
                        {user?.role === 'ADMIN' && (
                          <>
                            {appointment.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendOtp(appointment.id)}
                                className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send OTP
                              </Button>
                            )}
                            {appointment.status === 'OTP_SENT' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendOtp(appointment.id)}
                                disabled={resendOtpLoading}
                                className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                              >
                                {resendOtpLoading ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <RotateCw className="h-3 w-3 mr-1" />
                                )}
                                Resend OTP
                              </Button>
                            )}
                          </>
                        )}

                        {/* Engineer Actions */}
                        {user?.role === 'ENGINEER' && appointment.engineerId === user.id && (
                          <>
                            {appointment.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                onClick={() => handleSendOtp(appointment.id)}
                                className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send OTP
                              </Button>
                            )}

                            {appointment.status === 'OTP_SENT' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenOtpDialog(appointment)}
                                  className="flex-1 gradient-primary text-white"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verify OTP
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResendOtp(appointment.id)}
                                  disabled={resendOtpLoading}
                                  className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                                >
                                  {resendOtpLoading ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <RotateCw className="h-3 w-3 mr-1" />
                                  )}
                                  Resend OTP
                                </Button>
                              </>
                            )}

                            {(appointment.status === 'VERIFIED' || appointment.status === 'COMPLETED') && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenFeedbackDialog(appointment)}
                                className="flex-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {appointment.feedback ? 'Edit Feedback' : 'Add Feedback'}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

            {/* Visit Date and Time */}
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="visitTime" className="text-slate-200">
                  Visit Time *
                </Label>
                <Input
                  id="visitTime"
                  type="time"
                  value={formData.visitTime}
                  onChange={(e) =>
                    setFormData({ ...formData, visitTime: e.target.value })
                  }
                  required
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
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

            {/* Google Maps Link */}
            <div className="space-y-2">
              <Label htmlFor="googleMapsLink" className="text-slate-200">
                Google Maps Link (Optional)
              </Label>
              <Input
                id="googleMapsLink"
                value={formData.googleMapsLink}
                onChange={(e) =>
                  setFormData({ ...formData, googleMapsLink: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="https://maps.google.com/?q=..."
              />
              <p className="text-xs text-slate-500">
                Engineer can tap to open directions in Google Maps
              </p>
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

      {/* OTP Verification Dialog */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>Verify OTP</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the OTP sent to the client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
            {selectedAppointment && (
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
                <p className="text-sm text-slate-400">Client:</p>
                <p className="font-medium text-slate-200">{selectedAppointment.client.name}</p>
                <p className="text-xs text-slate-500">
                  OTP sent to: {selectedAppointment.otpMobileNumber || selectedAppointment.client.primaryContact}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-slate-200">
                Enter OTP *
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="bg-slate-800 border-slate-700 text-slate-100 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              {selectedAppointment && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Didn't receive OTP?
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendOtp(selectedAppointment.id)}
                    disabled={resendOtpLoading || resendCooldown > 0}
                    className="h-auto p-0 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                  >
                    {resendOtpLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Resending...
                      </>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      <>
                        <RotateCw className="h-3 w-3 mr-1" />
                        Resend OTP
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOtpDialogOpen(false)}
                disabled={otpLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={otpLoading}
                className="gradient-primary text-white"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify OTP
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment?.feedback ? 'Edit Feedback' : 'Add Feedback'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Share your notes and observations from the site visit
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFeedback} className="space-y-4 mt-4">
            {selectedAppointment && (
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
                <p className="text-sm text-slate-400">Appointment:</p>
                <p className="font-medium text-slate-200">{selectedAppointment.client.name}</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(selectedAppointment.visitDate), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-slate-200">
                Feedback / Notes *
              </Label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Enter your observations, measurements, site condition, materials needed, etc..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFeedbackDialogOpen(false)}
                disabled={feedbackLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={feedbackLoading}
                className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
              >
                {feedbackLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
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
          ) : selectedAppointmentForDetail ? (
            <div className="space-y-6 mt-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Current Status</span>
                {getStatusBadge(selectedAppointmentForDetail.status)}
              </div>

              {/* Visit Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Visit Date</span>
                </div>
                <p className="text-slate-100 pl-6">
                  {format(new Date(selectedAppointmentForDetail.visitDate), 'EEEE, MMMM dd, yyyy hh:mm a')}
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
                    <p className="text-slate-100">{selectedAppointmentForDetail.client.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Primary Contact</p>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedAppointmentForDetail.client.primaryContact}
                    </div>
                  </div>
                  {selectedAppointmentForDetail.client.secondaryContact && (
                    <div>
                      <p className="text-xs text-slate-400">Secondary Contact</p>
                      <div className="flex items-center gap-2 text-slate-100">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedAppointmentForDetail.client.secondaryContact}
                      </div>
                    </div>
                  )}
                  {selectedAppointmentForDetail.client.address && (
                    <div>
                      <p className="text-xs text-slate-400">Client Address</p>
                      <div className="flex items-start gap-2 text-slate-100">
                        <MapPin className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
                        <span>{selectedAppointmentForDetail.client.address}</span>
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
                    <p className="text-slate-100">{selectedAppointmentForDetail.engineer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedAppointmentForDetail.engineer.email}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mobile Number</p>
                    <div className="flex items-center gap-2 text-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedAppointmentForDetail.engineer.mobileNumber}
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
                  {selectedAppointmentForDetail.siteAddress ? (
                    <div>
                      <p className="text-xs text-slate-400">Site Address</p>
                      <p className="text-slate-100">{selectedAppointmentForDetail.siteAddress}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No site address specified</p>
                  )}
                  {selectedAppointmentForDetail.googleMapsLink && (
                    <div>
                      <p className="text-xs text-slate-400">Google Maps Link</p>
                      <a
                        href={selectedAppointmentForDetail.googleMapsLink}
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
              {selectedAppointmentForDetail.purpose && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">Purpose</span>
                  </div>
                  <p className="text-slate-100 pl-6">{selectedAppointmentForDetail.purpose}</p>
                </div>
              )}

              {/* OTP Details */}
              {selectedAppointmentForDetail.otpMobileNumber && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">OTP Mobile Number</span>
                  </div>
                  <p className="text-slate-100 pl-6">{selectedAppointmentForDetail.otpMobileNumber}</p>
                </div>
              )}

              {/* OTP Sent Information */}
              {selectedAppointmentForDetail.otpSentAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">OTP Sent At</span>
                  </div>
                  <p className="text-slate-100 pl-6">
                    {format(new Date(selectedAppointmentForDetail.otpSentAt), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}

              {/* Verification Information */}
              {selectedAppointmentForDetail.verifiedAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-slate-300">Verified At</span>
                  </div>
                  <p className="text-slate-100 pl-6">
                    {format(new Date(selectedAppointmentForDetail.verifiedAt), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {selectedAppointmentForDetail.feedback && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Feedback</span>
                  </div>
                  <div className="pl-6 p-3 bg-slate-800 rounded border border-slate-700">
                    <p className="text-slate-100">{selectedAppointmentForDetail.feedback}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-slate-700 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{format(new Date(selectedAppointmentForDetail.createdAt), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{format(new Date(selectedAppointmentForDetail.updatedAt), 'MMM dd, yyyy hh:mm a')}</span>
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
