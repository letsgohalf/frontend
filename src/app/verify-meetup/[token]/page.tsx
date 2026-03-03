'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2,
  CheckCircle2,
  MapPin,
  Clock,
  Car,
  DollarSign,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import interestThreadsApi, { MeetupVerification } from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { resolveImageUrl } from '@/lib/utils/image';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function VerifyMeetupPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [verification, setVerification] = useState<MeetupVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    loadVerification();
  }, [token]);

  const loadVerification = async () => {
    try {
      setLoading(true);
      const data = await interestThreadsApi.getMeetupVerification(token);
      setVerification(data);
      if (data.alreadyConfirmed) {
        setConfirmed(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification link');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/verify-meetup/${token}`);
      return;
    }

    try {
      setConfirming(true);
      await interestThreadsApi.confirmMeetup(token);
      setConfirmed(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to confirm meetup');
    } finally {
      setConfirming(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peach-50)] dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peach-50)] dark:bg-neutral-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center border border-red-200 dark:border-red-500/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Invalid Link
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {error || 'This verification link is invalid or has expired.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[var(--teal-500)] text-white rounded-xl text-sm font-medium hover:bg-[var(--teal-600)] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { qrOwner, carpool } = verification;
  const departureDate = carpool.departureTime
    ? new Date(carpool.departureTime)
    : null;

  // Confirmed state
  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peach-50)] dark:bg-neutral-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center border border-[var(--lime-200)] dark:border-[var(--lime-500)]/20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[var(--lime-500)]" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Meetup Confirmed!
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            You&apos;ve verified that you&apos;re meeting {qrOwner.name}. Have a safe trip!
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[var(--teal-500)] text-white rounded-xl text-sm font-medium hover:bg-[var(--teal-600)] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--peach-50)] dark:bg-neutral-950 p-4">
      <div className="max-w-sm mx-auto pt-8 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Verify Meetup
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Confirm you&apos;re meeting the right person
          </p>
        </div>

        {/* Person card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex flex-col items-center text-center">
            {qrOwner.avatar ? (
              <Image
                src={resolveImageUrl(qrOwner.avatar) || ''}
                alt={qrOwner.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] flex items-center justify-center text-2xl font-bold text-neutral-800 mb-3">
                {qrOwner.name.charAt(0)}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {qrOwner.name}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">Carpool Partner</p>
          </div>
        </div>

        {/* Carpool details */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-[var(--peach-200)] dark:border-neutral-800 space-y-3">
          {carpool.origin && carpool.destination && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-[var(--teal-500)] flex-shrink-0" />
              <span className="text-neutral-700 dark:text-neutral-300">{carpool.origin}</span>
              <ArrowRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-700 dark:text-neutral-300">{carpool.destination}</span>
            </div>
          )}

          {carpool.meetupPoint && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-[var(--lavender-500)] flex-shrink-0" />
              <span className="text-neutral-600 dark:text-neutral-400">
                Pickup: {carpool.meetupPoint}
              </span>
            </div>
          )}

          {departureDate && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-[var(--yellow-500)] flex-shrink-0" />
              <span className="text-neutral-600 dark:text-neutral-400">
                {departureDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                {' at '}
                {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {carpool.carType && (
            <div className="flex items-center gap-3 text-sm">
              <Car className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-600 dark:text-neutral-400">{carpool.carType}</span>
            </div>
          )}

          {carpool.costPerSeat != null && carpool.costPerSeat > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="w-4 h-4 text-[var(--lime-500)] flex-shrink-0" />
              <span className="font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                &#8358;{carpool.costPerSeat.toLocaleString()}/seat
              </span>
            </div>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full py-4 bg-[var(--teal-500)] text-white rounded-2xl font-semibold text-base hover:bg-[var(--teal-600)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {confirming ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {user ? 'Confirm Meetup' : 'Log in to Confirm'}
            </>
          )}
        </button>

        {!user && (
          <p className="text-xs text-center text-neutral-400">
            You need to be logged in to confirm this meetup
          </p>
        )}
      </div>
    </div>
  );
}
