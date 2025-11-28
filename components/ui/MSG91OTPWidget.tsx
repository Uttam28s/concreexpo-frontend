'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MSG91OTPWidgetProps {
  token: string;
  phone: string;
  onSuccess: (accessToken: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    MSG91OTPWidget?: any;
  }
}

export function MSG91OTPWidget({
  token,
  phone,
  onSuccess,
  onError,
  onClose,
}: MSG91OTPWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load MSG91 OTP Widget script
    const script = document.createElement('script');
    // TODO: Replace with actual MSG91 widget script URL from MSG91 documentation
    script.src = process.env.NEXT_PUBLIC_MSG91_WIDGET_SCRIPT_URL || 'https://widget.msg91.com/otp-widget/otp-widget.js';
    script.async = true;

    script.onload = () => {
      try {
        if (window.MSG91OTPWidget && widgetRef.current) {
          // Initialize widget
          widgetInstanceRef.current = new window.MSG91OTPWidget({
            container: widgetRef.current,
            authkey: process.env.NEXT_PUBLIC_MSG91_AUTH_KEY || '', // This might not be needed if using token
            token: token,
            phone: phone,
            onSuccess: (accessToken: string) => {
              setLoading(false);
              onSuccess(accessToken);
            },
            onError: (error: any) => {
              setLoading(false);
              const errorMessage = error?.message || 'OTP verification failed';
              setError(errorMessage);
              onError?.(errorMessage);
            },
            onClose: () => {
              onClose?.();
            },
          });

          setLoading(false);
        } else {
          throw new Error('MSG91 OTP Widget not available');
        }
      } catch (err: any) {
        setLoading(false);
        const errorMessage = err?.message || 'Failed to initialize OTP widget';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    };

    script.onerror = () => {
      setLoading(false);
      const errorMessage = 'Failed to load MSG91 OTP Widget script';
      setError(errorMessage);
      onError?.(errorMessage);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (widgetInstanceRef.current) {
        try {
          widgetInstanceRef.current.destroy?.();
        } catch (e) {
          console.error('Error destroying widget:', e);
        }
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [token, phone, onSuccess, onError, onClose]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-slate-300">Loading OTP widget...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={widgetRef} className="w-full" />
    </div>
  );
}


