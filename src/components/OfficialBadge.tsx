'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import BadgeShape from './BadgeShape';
import Image from 'next/image';

interface OfficialBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { badge: 'w-4 h-4', check: 'w-2.5 h-2.5', stroke: 2.5, logoBox: 'w-3 h-3 rounded', logoImg: 7 },
  md: { badge: 'w-5 h-5', check: 'w-3 h-3', stroke: 2.5, logoBox: 'w-[15px] h-[15px] rounded', logoImg: 9 },
  lg: { badge: 'w-6 h-6', check: 'w-3.5 h-3.5', stroke: 3, logoBox: 'w-[18px] h-[18px] rounded-[3px]', logoImg: 11 },
};

export default function OfficialBadge({ size = 'md', className }: OfficialBadgeProps) {
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
          'inline-flex items-center gap-0.5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-1 rounded-full',
          className
        )}
        aria-label="Official post"
      >
        {/* Rosette check badge */}
        <BadgeShape
          className={config.badge}
          bgClassName="bg-gradient-to-br from-lime-400 to-yellow-400 hover:from-lime-500 hover:to-yellow-500"
        >
          <Check className={cn('text-white', config.check)} strokeWidth={config.stroke} />
        </BadgeShape>
        {/* LetsGoHalf logo in dark square */}
        <span className={cn('inline-flex items-center justify-center bg-neutral-900 flex-shrink-0', config.logoBox)}>
          <Image
            src="/logo/letsgohalf-icon-logo-white-trimmed.png"
            alt="LetsGoHalf"
            width={config.logoImg}
            height={config.logoImg}
            className="object-contain"
          />
        </span>
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
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-yellow-400 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center">
                    <Image
                      src="/logo/letsgohalf-icon-logo-white-trimmed.png"
                      alt="LetsGoHalf"
                      width={14}
                      height={14}
                      className="object-contain"
                    />
                  </div>
                </div>
                <p className="text-[13px] text-neutral-700 dark:text-neutral-300 leading-snug">
                  This is an <strong className="text-neutral-900 dark:text-neutral-100">official post</strong> from the LetsGoHalf team.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
