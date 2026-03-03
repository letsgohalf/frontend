'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Camera,
  Phone,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  X,
  ChevronRight,
  Home,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───

interface EngagementUser {
  id?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isIdVerified?: boolean;
  isVerified?: boolean;
  preferredLocations?: string[];
  homeLocationName?: string;
  homeLatitude?: number;
  homeLongitude?: number;
}

export interface EngagementCardData {
  id: string;
  type: 'profile-nudge' | 'activity';
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  dismissible: boolean;
}

// ─── Build engagement cards based on user state ───

export function getEngagementCards(user: EngagementUser | null, isAuthenticated: boolean): EngagementCardData[] {
  const cards: EngagementCardData[] = [];

  if (!isAuthenticated || !user) {
    // Show sign-up nudge for logged-out users
    cards.push({
      id: 'sign-up',
      type: 'activity',
      icon: Sparkles,
      iconColor: 'text-[var(--teal-500)]',
      iconBg: 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10',
      borderColor: 'border-[var(--teal-200)] dark:border-[var(--teal-500)]/20',
      title: 'Join the community',
      description: 'Create an account to express interest, save posts, and chat with potential roommates.',
      actionLabel: 'Sign Up',
      actionHref: '/register',
      dismissible: true,
    });
    return cards;
  }

  // ─── Profile completion nudges ───

  if (!user.avatar) {
    cards.push({
      id: 'add-photo',
      type: 'profile-nudge',
      icon: Camera,
      iconColor: 'text-[var(--pink-400)]',
      iconBg: 'bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10',
      borderColor: 'border-[var(--pink-200)] dark:border-[var(--pink-400)]/20',
      title: 'Add a profile photo',
      description: 'People are 3x more likely to respond to listings with a photo. Make a great first impression!',
      actionLabel: 'Add Photo',
      actionHref: '/settings',
      dismissible: true,
    });
  }

  if (!user.isPhoneVerified) {
    cards.push({
      id: 'verify-phone',
      type: 'profile-nudge',
      icon: Phone,
      iconColor: 'text-[var(--teal-500)]',
      iconBg: 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10',
      borderColor: 'border-[var(--teal-200)] dark:border-[var(--teal-500)]/20',
      title: 'Verify your phone number',
      description: 'Get the verified badge and unlock full messaging. Verified users get more responses.',
      actionLabel: 'Verify Now',
      actionHref: '/settings',
      dismissible: true,
    });
  }

  if (!user.bio || !user.occupation) {
    cards.push({
      id: 'complete-profile',
      type: 'profile-nudge',
      icon: User,
      iconColor: 'text-[var(--lavender-500)]',
      iconBg: 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10',
      borderColor: 'border-[var(--lavender-200)] dark:border-[var(--lavender-400)]/20',
      title: 'Complete your profile',
      description: 'Add your bio and occupation so roommates can learn about you. It helps build trust!',
      actionLabel: 'Edit Profile',
      actionHref: '/profile',
      dismissible: true,
    });
  }

  if (!user.homeLocationName && !user.homeLatitude) {
    cards.push({
      id: 'set-location',
      type: 'profile-nudge',
      icon: MapPin,
      iconColor: 'text-[var(--lime-600)]',
      iconBg: 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10',
      borderColor: 'border-[var(--lime-200)] dark:border-[var(--lime-500)]/20',
      title: 'Set your home location',
      description: 'We\'ll show you listings nearby and calculate distances so you can find the perfect spot.',
      actionLabel: 'Set Location',
      actionHref: '/settings',
      dismissible: true,
    });
  }

  if (!user.isIdVerified && user.isPhoneVerified) {
    cards.push({
      id: 'id-verify',
      type: 'profile-nudge',
      icon: ShieldCheck,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-500/10',
      borderColor: 'border-amber-200 dark:border-amber-500/20',
      title: 'Get fully verified',
      description: 'Upload your ID to earn the gold badge. Verified users get 5x more interest on their posts.',
      actionLabel: 'Verify ID',
      actionHref: '/settings',
      dismissible: true,
    });
  }

  // ─── Activity prompts ───

  cards.push({
    id: 'explore-trending',
    type: 'activity',
    icon: TrendingUp,
    iconColor: 'text-[var(--pink-400)]',
    iconBg: 'bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10',
    borderColor: 'border-[var(--pink-200)] dark:border-[var(--pink-400)]/20',
    title: 'Trending near you',
    description: 'Check out popular listings in your area. New posts are added every day!',
    actionLabel: 'Explore',
    actionHref: '/explore',
    dismissible: true,
  });

  if (user.preferredLocations && user.preferredLocations.length > 0) {
    cards.push({
      id: 'new-in-area',
      type: 'activity',
      icon: Bell,
      iconColor: 'text-[var(--teal-500)]',
      iconBg: 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10',
      borderColor: 'border-[var(--teal-200)] dark:border-[var(--teal-500)]/20',
      title: `New in ${user.preferredLocations[0]}`,
      description: `Fresh listings have been posted in ${user.preferredLocations[0]}. Don't miss out!`,
      actionLabel: 'See Posts',
      actionHref: `/explore?location=${encodeURIComponent(user.preferredLocations[0])}`,
      dismissible: true,
    });
  }

  cards.push({
    id: 'create-post',
    type: 'activity',
    icon: Home,
    iconColor: 'text-[var(--lime-600)]',
    iconBg: 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10',
    borderColor: 'border-[var(--lime-200)] dark:border-[var(--lime-500)]/20',
    title: 'Looking for a roommate?',
    description: 'Post your listing and let the right people find you. It only takes a minute!',
    actionLabel: 'Create Post',
    actionHref: '/create',
    dismissible: true,
  });

  return cards;
}

// ─── Single engagement card component ───

export function EngagementCard({ card, onDismiss }: { card: EngagementCardData; onDismiss?: (id: string) => void }) {
  const router = useRouter();
  const Icon = card.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      className={cn(
        "post-card p-4 border-l-4",
        card.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", card.iconBg)}>
          <Icon className={cn("w-5 h-5", card.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{card.title}</h4>
            {card.dismissible && onDismiss && (
              <button
                onClick={() => onDismiss(card.id)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{card.description}</p>
          <button
            onClick={() => router.push(card.actionHref)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:underline"
          >
            {card.actionLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hook to manage engagement cards with dismissal persistence ───

export function useEngagementCards(user: EngagementUser | null, isAuthenticated: boolean) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load dismissed cards from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lgh-dismissed-cards');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep dismissals from the last 7 days
        const now = Date.now();
        const valid = Object.entries(parsed)
          .filter(([_, ts]) => now - (ts as number) < 7 * 24 * 60 * 60 * 1000)
          .map(([id]) => id);
        setDismissed(new Set(valid));
      }
    } catch {
      // Ignore
    }
  }, []);

  const allCards = useMemo(() => getEngagementCards(user, isAuthenticated), [user, isAuthenticated]);

  const visibleCards = useMemo(
    () => allCards.filter((c) => !dismissed.has(c.id)),
    [allCards, dismissed]
  );

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);

      // Persist to localStorage
      try {
        const stored = localStorage.getItem('lgh-dismissed-cards');
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[id] = Date.now();
        localStorage.setItem('lgh-dismissed-cards', JSON.stringify(parsed));
      } catch {
        // Ignore
      }

      return next;
    });
  };

  return { cards: visibleCards, dismiss };
}
