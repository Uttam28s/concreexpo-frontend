'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { appointmentApi } from '@/lib/api';
import { Appointment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Loader2,
  Building2,
  MapPin,
  FileText,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  MessageSquare,
  Navigation,
  RotateCw,
} from 'lucide-react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function EngineerDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [otp, setOtp] = useState('');
  const [feedback, setFeedback] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if not engineer
  useEffect(() => {
    if (user?.role !== 'ENGINEER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'ENGINEER') {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentApi.getDashboard();
      setAppointments(response.data?.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (appointment: Appointment) => {
    try {
      await appointmentApi.sendOtp(appointment.id);
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
        setResendCooldown((prev: number) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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
          setResendCooldown((prev: number) => {
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
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getDateBadge = (visitDate: string) => {
    const date = new Date(visitDate);
    if (isToday(date)) {
      return (
        <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
          Today
        </Badge>
      );
    }
    if (isFuture(date)) {
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          Upcoming
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">
        Past
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string; icon: any }> = {
      SCHEDULED: {
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        label: 'Scheduled',
        icon: Clock,
      },
      OTP_SENT: {
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: 'OTP Sent',
        icon: Send,
      },
      VERIFIED: {
        className: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        label: 'Verified',
        icon: CheckCircle,
      },
      COMPLETED: {
        className: 'bg-green-500/10 text-green-400 border-green-500/30',
        label: 'Completed',
        icon: CheckCircle,
      },
      CANCELLED: {
        className: 'bg-red-500/10 text-red-400 border-red-500/30',
        label: 'Cancelled',
        icon: XCircle,
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

  if (user?.role !== 'ENGINEER') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">My Appointments</h1>
        <p className="text-slate-400 mt-1">Manage your site visits and verifications</p>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : appointments?.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No appointments scheduled</p>
              <p className="text-sm text-slate-500 mt-1">
                Check back later for new assignments
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments?.map((appointment) => (
            <Card
              key={appointment.id}
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
                        {appointment.client.name}
                      </CardTitle>
                      <a
                        href={`tel:${appointment.client.primaryContact}`}
                        className="flex items-center text-sm text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        {appointment.client.primaryContact}
                      </a>
                    </div>
                  </div>
                  {getDateBadge(appointment.visitDate)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Visit Date */}
                <div className="flex items-center text-slate-300">
                  <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" />
                  <span className="text-sm">
                    {format(new Date(appointment.visitDate), 'EEEE, MMMM dd, yyyy')}
                  </span>
                </div>

                {/* Site Address */}
                {appointment.siteAddress && (
                  <div className="flex items-start text-slate-300">
                    <MapPin className="w-4 h-4 mr-2 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{appointment.siteAddress}</span>
                  </div>
                )}

                {/* Google Maps Link */}
                {appointment.googleMapsLink && (
                  <a
                    href={appointment.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </a>
                )}

                {/* Purpose */}
                {appointment.purpose && (
                  <div className="flex items-start text-slate-300">
                    <FileText className="w-4 h-4 mr-2 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{appointment.purpose}</span>
                  </div>
                )}

                {/* Status */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Status:</span>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>

                {/* OTP Info */}
                {appointment.status === 'OTP_SENT' && appointment.otpExpiresAt && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-400">
                      OTP sent to: {appointment.otpMobileNumber || appointment.client.primaryContact}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Expires: {format(new Date(appointment.otpExpiresAt), 'MMM dd, hh:mm a')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-2 pt-2">
                  {appointment.status === 'SCHEDULED' && (
                    <Button
                      onClick={() => handleSendOtp(appointment)}
                      className="w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send OTP
                    </Button>
                  )}

                  {appointment.status === 'OTP_SENT' && (
                    <>
                      <Button
                        onClick={() => handleOpenOtpDialog(appointment)}
                        className="w-full gradient-primary text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify OTP
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResendOtp(appointment.id)}
                        disabled={resendOtpLoading}
                        className="w-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                      >
                        {resendOtpLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resending...
                          </>
                        ) : (
                          <>
                            <RotateCw className="w-4 h-4 mr-2" />
                            Resend OTP
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {appointment.status === 'VERIFIED' && (
                    <Button
                      onClick={() => handleOpenFeedbackDialog(appointment)}
                      className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Feedback
                    </Button>
                  )}

                  {appointment.status === 'COMPLETED' && appointment.feedback && (
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Feedback:</p>
                      <p className="text-sm text-slate-300">{appointment.feedback}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* OTP Verification Dialog */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>Verify OTP</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the 6-digit OTP sent to the client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-slate-200">
                OTP Code *
              </Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                pattern="[0-9]{6}"
                className="bg-slate-800 border-slate-700 text-slate-100 text-center text-2xl tracking-widest"
                placeholder="000000"
                autoComplete="off"
              />
              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-500">
                  Attempts remaining: {selectedAppointment ? 3 - selectedAppointment.otpAttempts : 3}
                </p>
                {selectedAppointment && (
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
                )}
              </div>
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
                disabled={otpLoading || otp?.length !== 6}
                className="gradient-primary text-white"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
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
            <DialogTitle>Add Site Visit Feedback</DialogTitle>
            <DialogDescription className="text-slate-400">
              Share your observations from the site visit
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFeedback} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-slate-200">
                Feedback *
              </Label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
                rows={5}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Enter your feedback about the site visit..."
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
                className="gradient-primary text-white"
              >
                {feedbackLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
