'use client';

import { useRouter } from 'next/navigation';
import { Megaphone, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { AdvertItem } from '@/lib/constants/adverts';

interface MarqueeBannerProps {
  items: AdvertItem[];
  speed?: 'slow' | 'normal' | 'fast';
  variant?: 'gradient' | 'subtle';
  dismissible?: boolean;
}

export default function MarqueeBanner({
  items,
  speed = 'normal',
  variant = 'gradient',
  dismissible = false,
}: MarqueeBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !items.length) return null;

  // Repeat items enough times so one "set" is wider than the viewport,
  // then duplicate that set for a seamless infinite loop.
  const repeatCount = Math.max(2, Math.ceil(8 / items.length));
  const oneSet = Array.from({ length: repeatCount }, () => items).flat();
  const duplicatedItems = [...oneSet, ...oneSet];

  const speedClass = speed === 'slow' ? 'marquee-slow' : speed === 'fast' ? 'marquee-fast' : '';

  const bgClass =
    variant === 'gradient'
      ? 'bg-gradient-to-r from-[var(--lime-100)] via-[var(--peach-100)] to-[var(--lavender-100)] dark:from-[var(--lime-600)]/20 dark:via-[var(--peach-200)]/10 dark:to-[var(--lavender-400)]/15'
      : 'bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm';

  const textClass =
    variant === 'gradient'
      ? 'text-neutral-700 dark:text-neutral-200'
      : 'text-neutral-600 dark:text-neutral-300';

  const separatorClass =
    variant === 'gradient'
      ? 'bg-neutral-400 dark:bg-neutral-500'
      : 'bg-neutral-300 dark:bg-neutral-600';

  return (
    <div
      className={`marquee-container ${speedClass} ${bgClass} border-b border-neutral-200/50 dark:border-neutral-700/50`}
      aria-label="Announcements"
      role="marquee"
    >
      <div className="flex items-center h-10 lg:h-11">
        {/* Leading icon */}
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] dark:from-[var(--lime-600)] dark:to-[var(--yellow-500)]">
          <Megaphone className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-100" />
        </div>

        {/* Scrolling content */}
        <div className="flex-1 overflow-hidden">
          <div className="marquee-track">
            {duplicatedItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center">
                {index > 0 && (
                  <div className={`marquee-separator ${separatorClass}`} />
                )}
                <button
                  className={`marquee-item ${textClass}`}
                  onClick={() => item.link && router.push(item.link)}
                >
                  <Sparkles className="w-3 h-3 text-[var(--lime-500)] flex-shrink-0" />
                  <span>{item.text}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 flex items-center justify-center w-8 h-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            aria-label="Dismiss announcements"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
