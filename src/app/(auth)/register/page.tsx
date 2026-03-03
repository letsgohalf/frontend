'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Lock,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthMethod } from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

type SignUpMethod = 'email' | 'phone';

export default function RegisterPage() {
  const router = useRouter();
  const { register, requestOtp } = useAuth();

  const [method, setMethod] = useState<SignUpMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useOtp, setUseOtp] = useState(true); // Default to OTP method

  // Nigerian phone number validation
  const validateNigerianPhone = (phoneNumber: string): boolean => {
    // Remove spaces and dashes
    const cleaned = phoneNumber.replace(/[\s\-]/g, '');
    // Nigerian phone: starts with +234, 234, or 0, followed by 7/8/9, then 9 more digits
    // Valid prefixes: 070x, 080x, 081x, 090x, 091x etc.
    const nigerianRegex = /^(\+?234|0)[789]\d{9}$/;
    return nigerianRegex.test(cleaned);
  };

  const formatPhoneDisplay = (value: string): string => {
    // Remove non-digits except +
    let cleaned = value.replace(/[^\d+]/g, '');
    // Format as user types
    if (cleaned.startsWith('+234')) {
      // +234 XXX XXX XXXX
      const rest = cleaned.slice(4);
      if (rest.length > 3) {
        return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`.trim();
      }
      return `+234 ${rest}`.trim();
    } else if (cleaned.startsWith('0')) {
      // 0XXX XXX XXXX
      if (cleaned.length > 4) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`.trim();
      }
      return cleaned;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d+]/g, '');
    // Limit length
    if (rawValue.length > 14) return;
    
    const formatted = formatPhoneDisplay(rawValue);
    setPhone(formatted);
    
    // Validate
    const cleaned = rawValue.replace(/[\s\-]/g, '');
    if (cleaned.length >= 11) {
      if (!validateNigerianPhone(cleaned)) {
        setPhoneError('Please enter a valid Nigerian number');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone before submitting
    const cleanedPhone = phone.replace(/[\s\-]/g, '');
    if (!validateNigerianPhone(cleanedPhone)) {
      setPhoneError('Please enter a valid Nigerian phone number');
      return;
    }

    setIsLoading(true);

    try {
      let authMethod: AuthMethod;
      const data: any = { name, phone: cleanedPhone };

      if (method === 'email') {
        data.email = email;
        if (useOtp) {
          authMethod = 'email_otp';
        } else {
          authMethod = 'email_password';
          data.password = password;
        }
      } else {
        authMethod = 'phone_otp';
      }

      data.method = authMethod;

      const response = await register(data);
      playSound('success');

      // If OTP is required, redirect to verify page
      if (response.requiresVerification || !response.accessToken) {
        const verifyParams = new URLSearchParams();
        if (method === 'email') {
          verifyParams.set('email', email);
        } else {
          verifyParams.set('phone', phone);
        }
        verifyParams.set('type', 'register');
        router.push(`/verify?${verifyParams.toString()}`);
      } else {
        // Already logged in
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Create account
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Join LetsGoHalf and split your way to better living
            </p>
          </div>

          {/* Method Toggle - Phone registration coming soon */}
          {/*
          <div className="tabs-pill mb-6">
            <button
              onClick={() => setMethod('email')}
              className={`tab-item flex items-center gap-2 ${method === 'email' ? 'active' : ''}`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setMethod('phone')}
              className={`tab-item flex items-center gap-2 ${method === 'phone' ? 'active' : ''}`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>
          */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Number (Nigerian) */}
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                Phone Number <span className="text-neutral-400 font-normal">(Nigerian)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="0801 234 5678"
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all",
                    phoneError 
                      ? "border-red-400 focus:ring-red-400" 
                      : "border-[var(--peach-200)] dark:border-neutral-700 focus:ring-[var(--teal-400)]"
                  )}
                  required
                />
              </div>
              {phoneError && (
                <p className="mt-2 text-xs text-red-500">{phoneError}</p>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                We&apos;ll use this to contact you about listings
              </p>
            </div>

            {/* Auth Method Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUseOtp(!useOtp)}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  useOtp
                    ? "bg-[var(--teal-500)] border-[var(--teal-500)]"
                    : "border-neutral-300 dark:border-neutral-600"
                )}
              >
                {useOtp && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Sign up with a one-time code (no password needed)
              </span>
            </div>

            {/* Password (if not using OTP) */}
            {!useOtp && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:border-transparent transition-all"
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
            )}

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
                  {useOtp ? 'Send verification code' : 'Create account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-neutral-600 dark:text-neutral-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium">
              Sign in
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-neutral-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
