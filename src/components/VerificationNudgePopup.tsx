'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'verificationNudgeShown';
const COOLDOWN_KEY = 'verificationNudgeDismissedAt';
const COOLDOWN_MS = 72 * 60 * 60 * 1000; // 72 hours
const SHOW_DELAY_MS = 2000;

export default function VerificationNudgePopup() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Only show for unverified users with pending interest
    if (user.isVerified) return;
    if (!user.pendingInterestCount || user.pendingInterestCount === 0) return;

    // Session check — max once per session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;

    // Cooldown check — 72 hours after last dismissal
    if (typeof localStorage !== 'undefined') {
      const lastDismissed = localStorage.getItem(COOLDOWN_KEY);
      if (lastDismissed) {
        const elapsed = Date.now() - parseInt(lastDismissed, 10);
        if (elapsed < COOLDOWN_MS) return;
      }
    }

    // Show after 2-second delay
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    }, SHOW_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, user]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    }
  }, []);

  const handleGetVerified = useCallback(() => {
    setIsVisible(false);
    router.push('/verification');
  }, [router]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]"
          />

          {/* Card — centered on desktop, bottom sheet on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-4 right-4 bottom-6 md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[151]"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
              {/* Header */}
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Verification needed
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  People want to connect with you!
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  You have interested people on your listings, but your account isn't verified yet. Verify now to start chatting with them.
                </p>

                {/* Interest count badge */}
                {user?.pendingInterestCount && user.pendingInterestCount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {user.pendingInterestCount} {user.pendingInterestCount === 1 ? 'person' : 'people'} interested
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={handleGetVerified}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] hover:opacity-90 transition-opacity text-sm"
                >
                  Get Verified
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-3 rounded-2xl text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
