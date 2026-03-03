'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Handshake,
  Loader2,
  CheckCircle2,
  Home,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import partnersApi, { PartnerStatusResponse } from '@/lib/api/partners';

const hearAboutOptions = [
  'Social Media',
  'Friend/Referral',
  'Online Ad',
  'Other',
];

export default function BecomePartnerPage() {
  const router = useRouter();
  const { user, isAuthenticated, promptAuth } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [hearAbout, setHearAbout] = useState('');
  const [experience, setExperience] = useState('');
  const [whyPartner, setWhyPartner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PartnerStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Check partner status on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingStatus(false);
      return;
    }
    partnersApi.getStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setIsLoadingStatus(false));
  }, [isAuthenticated]);

  // Pre-fill from user data
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || '');
      if (!phone) setPhone(user.phone || '');
      if (!email) setEmail(user.email || '');
    }
  }, [user]);

  const canSubmit =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0 &&
    locationData !== null &&
    hearAbout.length > 0 &&
    whyPartner.trim().length >= 20;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      promptAuth('Sign in to apply as a partner');
      return;
    }
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await partnersApi.submit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        locationName: locationData?.name,
        locationLatitude: locationData?.latitude,
        locationLongitude: locationData?.longitude,
        hearAbout,
        experience: experience.trim() || undefined,
        whyPartner: whyPartner.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingStatus) {
    return (
      <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
        </div>
      </AppLayout>
    );
  }

  // Already a partner
  if (status?.isPartner) {
    return (
      <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--teal-100)] to-[var(--lime-100)] dark:from-[var(--teal-900)] dark:to-[var(--lime-900)] flex items-center justify-center mx-auto mb-6">
              <Handshake className="w-10 h-10 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              You're a Partner!
            </h2>
            <p className="text-neutral-500 mb-2">
              Your referral code is:
            </p>
            <p className="text-2xl font-mono font-bold text-[var(--teal-600)] dark:text-[var(--teal-400)] mb-6">
              {status.referralCode}
            </p>
            <button
              onClick={() => router.push('/partner-dashboard')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white font-semibold inline-flex items-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Go to Partner Dashboard
            </button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // Has pending application
  if (status?.hasPendingApplication) {
    return (
      <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-[var(--peach-100)] dark:from-amber-900/30 dark:to-[var(--peach-900)]/30 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Application Pending
            </h2>
            <p className="text-neutral-500 mb-8">
              Your partner application is under review. We'll notify you once it's been processed. This usually takes up to 48 hours.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] font-semibold inline-flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // Success state after submission
  if (isSuccess) {
    return (
      <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--teal-100)] to-[var(--lime-100)] dark:from-[var(--teal-900)] dark:to-[var(--lime-900)] flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
            </motion.div>

            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Application Submitted!
            </h2>
            <p className="text-neutral-500 mb-8">
              Thank you, {fullName.split(' ')[0]}! We're excited to have you help connect house owners with tenants.
              We'll review your application and get back to you within 48 hours.
            </p>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] font-semibold inline-flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
      {/* Mobile Header */}
      <header className="header-mobile sticky top-0 z-40 px-5 py-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex-1 text-center">
            Become a Partner
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Become a Partner
            </h1>
            <p className="text-neutral-500 text-sm">Help house owners find tenants, earn commissions</p>
          </div>
        </div>
      </header>

      <div className="content-container py-6">
        <div className="create-form-container space-y-6">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass p-6 text-center bg-gradient-to-br from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-900)]/20 dark:to-[var(--lime-900)]/20 border border-[var(--teal-100)] dark:border-[var(--teal-800)]"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--teal-200)] to-[var(--lime-200)] dark:from-[var(--teal-800)] dark:to-[var(--lime-800)] flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-8 h-8 text-[var(--teal-700)] dark:text-[var(--teal-300)]" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Become a LetsGoHalf Partner
            </h2>
            <p className="text-sm text-neutral-500">
              Know house owners with available spaces? Bring them to LetsGoHalf and earn commissions on every successful tenant match.
            </p>
          </motion.div>

          {/* Full Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-2 block">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-[var(--teal-400)] focus:ring-1 focus:ring-[var(--teal-400)] transition-colors"
            />
          </motion.div>

          {/* Phone Number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-2 block">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08012345678"
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-[var(--teal-400)] focus:ring-1 focus:ring-[var(--teal-400)] transition-colors"
            />
          </motion.div>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-2 block">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-[var(--teal-400)] focus:ring-1 focus:ring-[var(--teal-400)] transition-colors"
            />
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LocationPicker
              value={locationData}
              onChange={(loc) => setLocationData(loc)}
              label="Location / Area of Operation"
              subtitle="Where do you have access to house owners?"
              placeholder="e.g. Lekki, Lagos"
            />
          </motion.div>

          {/* How did you hear about us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-2 block">
              How did you hear about us? <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {hearAboutOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setHearAbout(option)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                    hearAbout === option
                      ? "bg-gradient-to-r from-[var(--lime-300)] to-[var(--yellow-300)] text-[#212121]"
                      : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Brief experience description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-2 block">
              Brief experience description <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Do you know house owners looking for tenants? Tell us about your connections to property owners or experience in real estate..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-[var(--teal-400)] focus:ring-1 focus:ring-[var(--teal-400)] transition-colors resize-none"
            />
          </motion.div>

          {/* Why do you want to become a partner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-2 block">
              Why do you want to become a partner? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={whyPartner}
              onChange={(e) => setWhyPartner(e.target.value)}
              placeholder="Share your motivation for joining our partner program (minimum 20 characters)..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-[var(--teal-400)] focus:ring-1 focus:ring-[var(--teal-400)] transition-colors resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className={cn(
                "text-xs",
                whyPartner.length < 20 ? "text-neutral-400" : "text-[var(--teal-600)]"
              )}>
                {whyPartner.length}/20 min
              </span>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-4"
          >
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-2",
                canSubmit && !isSubmitting
                  ? "bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121]"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Handshake className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
