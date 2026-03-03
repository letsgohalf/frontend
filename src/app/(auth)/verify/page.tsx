'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, requestOtp } = useAuth();

  const email = searchParams.get('email');
  const phone = searchParams.get('phone');
  const type = searchParams.get('type'); // 'register' or 'login'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const data: any = { otp: otpString };
      if (email) data.email = email;
      if (phone) data.phone = phone;

      await verifyOtp(data);
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setError('');

    try {
      const data: any = {};
      if (email) data.email = email;
      if (phone) data.phone = phone;

      await requestOtp(data);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.every(digit => digit !== '') && !isLoading) {
      handleSubmit();
    }
  }, [otp]);

  const maskedContact = email
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : phone?.replace(/(.{4})(.*)(.{4})/, '$1****$3');

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--lime-200)] flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-[var(--lime-600)]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Verified!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Redirecting you to the app...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Enter code
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              We sent a 6-digit code to<br />
              <span className="font-medium text-neutral-900 dark:text-white">
                {maskedContact}
              </span>
            </p>
          </div>

          {/* OTP Inputs */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:border-transparent transition-all"
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || otp.some(d => !d)}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Verify'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium disabled:opacity-50"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend code'
              )}
            </button>
          </div>

          {/* Dev hint */}
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-8 text-xs text-center text-neutral-400">
              Dev mode: Check console for OTP
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
