'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/lib/sounds';

export default function AuthPrompt() {
  const router = useRouter();
  const { showAuthPrompt, setShowAuthPrompt, authPromptMessage } = useAuth();

  const handleClose = () => {
    playSound('swooshDown');
    setShowAuthPrompt(false);
  };

  const handleSignUp = () => {
    playSound('click');
    setShowAuthPrompt(false);
    router.push('/register');
  };

  const handleLogin = () => {
    setShowAuthPrompt(false);
    router.push('/login');
  };

  return (
    <AnimatePresence>
      {showAuthPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 bottom-8 md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[201]"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center z-10"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>

              {/* Header gradient */}
              <div className="h-2 bg-gradient-to-r from-[var(--lime-400)] via-[var(--yellow-400)] to-[var(--peach-400)]" />

              <div className="p-6 pt-8">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--peach-200)] to-[var(--pink-200)] dark:from-[var(--peach-300)]/20 dark:to-[var(--pink-300)]/20 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-neutral-800 dark:text-neutral-200">
                    <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 16L28 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 16V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 16L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
                  Join LetsGoHalf
                </h2>

                {/* Message */}
                <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6">
                  {authPromptMessage || 'Sign up to find roommates and go half on rent'}
                </p>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSignUp}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base"
                  >
                    Create an account
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleLogin}
                    className="w-full btn-secondary py-4 flex items-center justify-center gap-2 text-base"
                  >
                    I already have an account
                  </button>
                </div>

                {/* Options */}
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs text-center text-neutral-500 mb-4">
                    Sign up with
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleSignUp}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Email</span>
                    </button>
                    <button
                      onClick={handleSignUp}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">Phone</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
