'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Loader2, AlertCircle } from 'lucide-react';

interface LocationPromptProps {
  locationName: string | null;
  hasExplicitLocation: boolean;
  isLoading: boolean;
  error: string | null;
  dismissed: boolean;
  onRequestLocation: () => void;
  onDismiss: () => void;
}

export default function LocationPrompt({
  locationName,
  hasExplicitLocation,
  isLoading,
  error,
  dismissed,
  onRequestLocation,
  onDismiss,
}: LocationPromptProps) {
  // Don't show if user has shared location and there's no error, or if dismissed
  if ((hasExplicitLocation && !error) || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4"
      >
        {error ? (
          // Error state
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {error}
              </p>
              {locationName && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Using your home location instead
                </p>
              )}
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        ) : (
          // Share location prompt
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--peach-50)] dark:bg-neutral-800/60 border border-[var(--peach-200)] dark:border-neutral-700">
            <div className="w-9 h-9 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Share your location to see nearby rides
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                We&apos;ll show you rides sorted by distance
              </p>
            </div>
            <button
              onClick={onRequestLocation}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm flex-shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Share'
              )}
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
