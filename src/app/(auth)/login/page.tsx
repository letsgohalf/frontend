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
  Lock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/lib/sounds';

type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const { login, requestOtp } = useAuth();

  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usePassword, setUsePassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (method === 'email' && usePassword) {
        // Login with email and password
        const response = await login({ email, password });
        if (response.accessToken) {
          playSound('success');
          router.push('/');
        }
      } else {
        // Request OTP
        const data = method === 'email' ? { email } : { phone };
        await requestOtp(data);

        // Redirect to verify page
        const verifyParams = new URLSearchParams();
        if (method === 'email') {
          verifyParams.set('email', email);
        } else {
          verifyParams.set('phone', phone);
        }
        verifyParams.set('type', 'login');
        router.push(`/verify?${verifyParams.toString()}`);
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
              Welcome back
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Sign in to continue to LetsGoHalf
            </p>
          </div>

          {/* Method Toggle - Phone registration coming soon */}
          {/*
          <div className="tabs-pill mb-6">
            <button
              onClick={() => { setMethod('email'); setUsePassword(false); }}
              className={`tab-item flex items-center gap-2 ${method === 'email' ? 'active' : ''}`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => { setMethod('phone'); setUsePassword(false); }}
              className={`tab-item flex items-center gap-2 ${method === 'phone' ? 'active' : ''}`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>
          */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Phone - Coming Soon
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            */}

            {/* Password (optional) */}
            {usePassword && (
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
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/80 dark:bg-neutral-800/80 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {/* Toggle Password/OTP */}
            <button
              type="button"
              onClick={() => setUsePassword(!usePassword)}
              className="text-sm text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium"
            >
              {usePassword ? 'Use one-time code instead' : 'Use password instead'}
            </button>

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
                  {usePassword ? 'Sign in' : 'Send code'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-neutral-600 dark:text-neutral-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
