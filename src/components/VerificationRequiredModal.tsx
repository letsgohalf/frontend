'use client';

import { useRouter } from 'next/navigation';
import { X, Shield, MessageCircle, AlertTriangle } from 'lucide-react';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport?: () => void;
  title?: string;
  description?: string;
  verifyRoute?: string;
  verifyLabel?: string;
}

export default function VerificationRequiredModal({
  isOpen,
  onClose,
  onContactSupport,
  title = 'Verify to Message',
  description = "For everyone's safety, only verified users can message other members.",
  verifyRoute = '/verification',
  verifyLabel = 'Get Verified',
}: VerificationRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleVerify = () => {
    onClose();
    router.push(verifyRoute);
  };

  const handleSupport = () => {
    onClose();
    if (onContactSupport) {
      onContactSupport();
    } else {
      router.push('/chat?support=true');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md sm:mx-4 bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Verification Required</h2>
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
              <AlertTriangle className="w-8 h-8 text-amber-500" />
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

          {/* How it works */}
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              How to get verified
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5">
              <li>1. Go to your profile</li>
              <li>2. Tap the verification button</li>
              <li>3. Upload a valid ID document</li>
              <li>4. You'll be verified within 48 hours</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Primary CTA */}
          <button
            onClick={handleVerify}
            className="w-full py-3 px-4 bg-[var(--teal-500)] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--teal-600)] transition-colors"
          >
            <Shield className="w-5 h-5" />
            {verifyLabel}
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleSupport}
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Support Instead
          </button>
        </div>
      </div>
    </div>
  );
}
