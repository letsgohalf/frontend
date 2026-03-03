'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Play sound based on toast type
    const soundMap = { success: 'success', error: 'error', info: 'info', warning: 'info' } as const;
    playSound(soundMap[type]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[var(--lime-500)]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[var(--yellow-500)]" />;
      default:
        return <Info className="w-5 h-5 text-[var(--teal-500)]" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-[var(--lime-500)] bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/10';
      case 'error':
        return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-500/10';
      case 'warning':
        return 'border-l-4 border-l-[var(--yellow-500)] bg-[var(--yellow-50)] dark:bg-[var(--yellow-500)]/10';
      default:
        return 'border-l-4 border-l-[var(--teal-500)] bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm",
                getStyles(toast.type)
              )}
            >
              <span className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</span>
              <p className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
