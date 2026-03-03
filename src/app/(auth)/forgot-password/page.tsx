'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle,
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';

type Step = 'email' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      setSuccess(response.message || 'If an account exists with this email, you will receive a password reset code.');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ email, otp, newPassword });
      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setSuccess('A new code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-12 pr-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--lavender-300)] focus:border-transparent transition-all";
  const inputWithRightClass = "w-full pl-12 pr-12 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--lavender-300)] focus:border-transparent transition-all";

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center">
        <Link
          href="/login"
          className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              {/* Title */}
              <div className="mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 flex items-center justify-center mb-4">
                  <KeyRound className="w-8 h-8 text-[var(--lavender-400)] dark:text-[var(--lavender-300)]" />
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                  Forgot password?
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  No worries! Enter your email and we&apos;ll send you a code to reset your password.
                </p>
              </div>

              {/* Form Card */}
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send reset code
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Back to login */}
              <p className="mt-6 text-center text-neutral-500 dark:text-neutral-400">
                Remember your password?{' '}
                <Link href="/login" className="text-[var(--lavender-400)] dark:text-[var(--lavender-300)] font-medium">
                  Sign in
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="reset-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              {/* Title */}
              <div className="mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--lavender-400)] dark:text-[var(--lavender-300)]" />
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                  Reset password
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-medium text-neutral-900 dark:text-neutral-200">{email}</span>
                  {' '}and your new password.
                </p>
              </div>

              {/* Success message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                >
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </motion.div>
              )}

              {/* Form Card */}
              <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* OTP */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                      Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(val);
                        }}
                        placeholder="Enter 6-digit code"
                        className={`${inputClass} tracking-widest text-lg`}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={inputWithRightClass}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      Minimum 8 characters
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className={inputWithRightClass}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Resend code */}
              <div className="mt-6 text-center">
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Didn&apos;t receive the code?{' '}
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[var(--lavender-400)] dark:text-[var(--lavender-300)] font-medium disabled:opacity-50"
                  >
                    Resend
                  </button>
                </p>
                <button
                  onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
                  className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 underline"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
