'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    confirmState?.resolve(true);
    setConfirmState(null);
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    confirmState?.resolve(false);
    setConfirmState(null);
  }, [confirmState]);

  const getButtonStyles = (type?: 'danger' | 'warning' | 'info') => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'warning':
        return 'bg-[var(--yellow-500)] hover:bg-[var(--yellow-600)] text-[#212121]';
      default:
        return 'bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] text-[#212121]';
    }
  };

  const getIconColor = (type?: 'danger' | 'warning' | 'info') => {
    switch (type) {
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-[var(--yellow-500)]';
      default:
        return 'text-[var(--teal-500)]';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmState && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
            >
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden mx-4">
                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      confirmState.type === 'danger' ? 'bg-red-100 dark:bg-red-500/20' :
                      confirmState.type === 'warning' ? 'bg-[var(--yellow-100)] dark:bg-[var(--yellow-500)]/20' :
                      'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20'
                    )}>
                      <AlertTriangle className={cn("w-6 h-6", getIconColor(confirmState.type))} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {confirmState.title || 'Confirm Action'}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {confirmState.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    {confirmState.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-medium transition-colors",
                      getButtonStyles(confirmState.type)
                    )}
                  >
                    {confirmState.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
