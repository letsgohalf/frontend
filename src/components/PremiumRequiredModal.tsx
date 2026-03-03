'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Star, Eye, MessageCircle, Loader2 } from 'lucide-react';
import paymentsApi from '@/lib/api/payments';

interface PremiumRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewListings?: () => void;
  title?: string;
  description?: string;
  secondaryLabel?: string;
  targetUserId?: string;
  targetUserName?: string;
  onChatUnlocked?: () => void;
}

export default function PremiumRequiredModal({
  isOpen,
  onClose,
  onViewListings,
  title = 'Premium Feature',
  description = 'Direct messaging is a Premium feature. Upgrade to message anyone directly, or express interest on their listings to chat for free.',
  secondaryLabel,
  targetUserId,
  targetUserName,
  onChatUnlocked,
}: PremiumRequiredModalProps) {
  const router = useRouter();
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount or close
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setUnlockLoading(false);
      setUnlockError(null);
    }
  }, [isOpen, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push('/premium');
  };

  const handleSecondary = () => {
    onClose();
    if (onViewListings) {
      onViewListings();
    }
  };

  const handleChatUnlock = async () => {
    if (!targetUserId) return;

    setUnlockLoading(true);
    setUnlockError(null);

    try {
      const { authorizationUrl, reference } = await paymentsApi.initiatePayment(
        'chat_unlock',
        targetUserId,
      );

      // Open Paystack in a new tab
      window.open(authorizationUrl, '_blank');

      // Poll for payment verification every 5 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const result = await paymentsApi.verifyPayment(reference);
          if (result.status === 'success') {
            stopPolling();
            setUnlockLoading(false);
            onClose();
            onChatUnlocked?.();
          } else if (result.status === 'failed') {
            stopPolling();
            setUnlockLoading(false);
            setUnlockError('Payment failed. Please try again.');
          }
        } catch {
          // Keep polling — verification might not be ready yet
        }
      }, 5000);
    } catch (err: any) {
      setUnlockLoading(false);
      const message = err?.response?.data?.message || err?.message || 'Failed to initiate payment';
      setUnlockError(message);
    }
  };

  const resolvedSecondaryLabel = secondaryLabel
    ?? (onViewListings ? 'View Their Listings' : 'Maybe Later');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md sm:mx-4 bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Premium Feature</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Star className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Chat Unlock CTA — only shown when targetUserId is provided */}
          {targetUserId && (
            <>
              <button
                onClick={handleChatUnlock}
                disabled={unlockLoading}
                className="w-full py-3 px-4 bg-[var(--teal-500)] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--teal-600)] transition-colors disabled:opacity-70"
              >
                {unlockLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Waiting for payment...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Unlock Chat with {targetUserName || 'this user'} — ₦1,000
                  </>
                )}
              </button>
              {unlockError && (
                <p className="text-sm text-red-500 text-center">{unlockError}</p>
              )}
            </>
          )}

          {/* Primary CTA */}
          <button
            onClick={handleUpgrade}
            className="w-full py-3 px-4 border-2 border-amber-400 text-amber-600 dark:text-amber-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Star className="w-5 h-5" />
            Upgrade to Premium — ₦5,000/mo
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleSecondary}
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Eye className="w-5 h-5" />
            {resolvedSecondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
