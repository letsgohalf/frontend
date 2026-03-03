'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePremium } from '@/contexts/PremiumContext';
import BadgeShape from './BadgeShape';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { outer: 'w-4 h-4', inner: 'w-2.5 h-2.5', stroke: 2.5 },
  md: { outer: 'w-5 h-5', inner: 'w-3 h-3', stroke: 2.5 },
  lg: { outer: 'w-6 h-6', inner: 'w-3.5 h-3.5', stroke: 3 },
};

export default function PremiumBadge({ size = 'md', className }: PremiumBadgeProps) {
  const { premiumEnabled } = usePremium();
  const config = sizeConfig[size];
  const [showInfo, setShowInfo] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  if (!premiumEnabled) return null;

  return (
    <span className="relative inline-flex">
      <button
        ref={badgeRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowInfo(!showInfo);
        }}
        className={cn(
          'cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded-full',
          className
        )}
        aria-label="Premium member"
      >
        <BadgeShape
          className={config.outer}
          bgClassName="bg-blue-500 hover:bg-blue-600"
        >
          <Check className={cn('text-white', config.inner)} strokeWidth={config.stroke} />
        </BadgeShape>
      </button>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[9999] w-56"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-neutral-800 rotate-45 border-l border-t border-[var(--peach-200)] dark:border-neutral-700 z-[1]" />

            <div className="relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-[var(--peach-200)] dark:border-neutral-700 overflow-hidden">
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                    Premium Member
                  </p>
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug mt-0.5">
                    This user has a premium subscription with priority features.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
