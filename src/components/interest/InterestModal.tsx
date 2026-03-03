'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Send, Loader2, AlertCircle, MessageCircle, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import interestThreadsApi from '@/lib/api/interest-threads';
import { playSound } from '@/lib/sounds';

interface InterestModalProps {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (threadId: string, requiresScreening: boolean) => void;
}

const howItWorksSteps = [
  {
    number: '1',
    title: 'Start a Thread',
    description: 'A private thread is created between you and the poster.',
    dotColor: 'bg-gradient-to-br from-[var(--lime-400)] to-[var(--lime-500)]',
  },
  {
    number: '2',
    title: 'Answer & Ask Questions',
    description: "Answer the poster's screening questions, and ask your own — it's a two-way conversation.",
    dotColor: 'bg-gradient-to-br from-[var(--yellow-300)] to-[var(--yellow-400)]',
  },
  {
    number: '3',
    title: 'Get Matched',
    description: "If it's a good fit, the poster can match with you and you'll connect directly.",
    dotColor: 'bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)]',
  },
];

export default function InterestModal({
  postId,
  postTitle,
  isOpen,
  onClose,
  onSuccess,
}: InterestModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'message' | 'submitting' | 'error'>('info');
  const [initialMessage, setInitialMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const handleSubmit = async () => {
    try {
      setStep('submitting');
      setError(null);

      const { thread } = await interestThreadsApi.expressInterest(postId, {
        initialMessage: initialMessage.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess(thread.id, thread.status === 'pending_screening');
      }

      onClose();
      router.push(`/interest/${thread.id}`);
    } catch (err: any) {
      if (err?.code === 'VERIFICATION_REQUIRED' || err?.message?.includes('verify')) {
        setVerificationRequired(true);
        setError('You need to verify your identity before expressing interest.');
      } else {
        setError(err?.message || 'Failed to express interest');
      }
      setStep('error');
    }
  };

  const handleClose = () => {
    playSound('swooshDown');
    setStep('info');
    setInitialMessage('');
    setError(null);
    setVerificationRequired(false);
    onClose();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] sm:w-full sm:max-w-md sm:mx-auto"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col sm:mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--peach-200)] dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {step === 'info' ? "I'm Interested" : 'Say Hello'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Post preview */}
                <div className="p-3 bg-[var(--peach-50)] dark:bg-neutral-800 rounded-xl border border-[var(--peach-200)] dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{postTitle}</p>
                </div>

                {/* Error state */}
                {step === 'error' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>

                    {verificationRequired ? (
                      <button
                        onClick={() => {
                          handleClose();
                          router.push('/verification');
                        }}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm"
                      >
                        <Shield className="w-5 h-5" />
                        Verify Your Identity
                      </button>
                    ) : (
                      <button
                        onClick={() => setStep('info')}
                        className="w-full py-3 px-4 bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )}

                {/* Info step - How It Works */}
                {step === 'info' && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[var(--lime-600)] dark:text-[var(--lime-400)]" />
                        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                          How it works
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {howItWorksSteps.map((s) => (
                          <div key={s.number} className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-full ${s.dotColor} text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm`}>
                              {s.number}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{s.title}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{s.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/10 rounded-xl border border-[var(--lime-200)] dark:border-[var(--lime-500)]/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--lime-600)] dark:text-[var(--lime-400)] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--lime-700)] dark:text-[var(--lime-300)] leading-relaxed">
                          Both you and the poster can ask questions freely. It&apos;s a two-way conversation to make sure everyone is comfortable.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Message step */}
                {step === 'message' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Send a greeting (optional)</span>
                      </div>
                      <textarea
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        placeholder="Hi! I saw your listing and I'm interested..."
                        className="w-full p-3 border border-[var(--peach-200)] dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--lime-400)] text-sm placeholder:text-neutral-400"
                        rows={3}
                        autoFocus
                      />
                    </div>

                    <p className="text-xs text-neutral-400 text-center">
                      You can skip this — you&apos;ll chat in the thread
                    </p>
                  </>
                )}

                {/* Submitting state */}
                {step === 'submitting' && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--lime-500)]" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Starting your thread...</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {step === 'info' && (
                <div className="p-4 border-t border-[var(--peach-200)] dark:border-neutral-700 bg-[var(--peach-50)]/50 dark:bg-neutral-800/50">
                  <button
                    onClick={() => { playSound('click'); setStep('message'); }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 'message' && (
                <div className="p-4 border-t border-[var(--peach-200)] dark:border-neutral-700 bg-[var(--peach-50)]/50 dark:bg-neutral-800/50 space-y-2">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    Start Thread
                  </button>
                  <button
                    onClick={() => setStep('info')}
                    className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
