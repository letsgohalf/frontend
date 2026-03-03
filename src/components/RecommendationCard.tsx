'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, X, Home, Users, Bed } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InterestModal from '@/components/interest/InterestModal';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/utils/image';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/api/posts';

interface RecommendationCardProps {
  post: Post;
  matchReason?: string;
  onInterested: (postId: string) => void;
  onDismiss?: (postId: string) => void;
}

const DISMISSED_KEY = 'lgh-dismissed-recommendations';
const DISMISS_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const formatBudget = (amount: number) => {
  if (amount >= 1000000) return `\u20A6${(amount / 1000000).toFixed(1)}M/yr`;
  if (amount >= 1000) return `\u20A6${(amount / 1000).toFixed(0)}K/yr`;
  return `\u20A6${amount}/yr`;
};

const postTypeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  'looking-for-roommate': { label: 'Looking for Roommate', icon: Users },
  'looking-for-place': { label: 'Looking for Place', icon: Bed },
  'have-spare-room': { label: 'Spare Room Available', icon: Home },
  'grocery-split': { label: 'Grocery Split', icon: Home },
};

export default function RecommendationCard({
  post,
  matchReason,
  onInterested,
  onDismiss,
}: RecommendationCardProps) {
  const { isAuthenticated, promptAuth } = useAuth();
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const typeConfig = postTypeConfig[post.postType] || postTypeConfig['have-spare-room'];
  const TypeIcon = typeConfig.icon;
  const authorName = post.author?.name || 'Someone';
  const firstName = authorName.split(' ')[0];

  const handleInterested = () => {
    if (!isAuthenticated) {
      promptAuth('Sign in to express interest');
      return;
    }
    setShowInterestModal(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Persist dismissal
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[post.id] = Date.now();
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore
    }
    onDismiss?.(post.id);
  };

  const handleInterestSuccess = (threadId: string) => {
    setShowInterestModal(false);
    onInterested(post.id);
  };

  if (isDismissed) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        className="post-card border border-[var(--lime-200)] dark:border-[var(--lime-500)]/20 overflow-hidden"
      >
        {/* Header badge */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[var(--lime-600)] dark:text-[var(--lime-400)]" />
            </div>
            <span className="text-xs font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)] uppercase tracking-wide">
              Recommended for you
            </span>
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>

        <div className="h-px bg-[var(--peach-100)] dark:bg-neutral-700 mx-4" />

        {/* Author and content */}
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-11 h-11 ring-2 ring-white dark:ring-neutral-700 flex-shrink-0">
              <AvatarImage src={resolveImageUrl(post.author?.avatar)} alt={authorName} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--lime-400)] to-[var(--teal-400)] text-white font-semibold text-sm">
                {authorName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-900 dark:text-neutral-100">
                <span className="font-semibold">{firstName}</span>
                {' '}
                {post.postType === 'looking-for-roommate' && 'is looking for a roommate partner'}
                {post.postType === 'looking-for-place' && 'is searching for a place'}
                {post.postType === 'have-spare-room' && 'has a space available'}
                {post.location && (
                  <> in <span className="font-semibold">{post.location}</span></>
                )}
              </p>
              {post.content && (
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="px-4 pb-3 flex flex-wrap items-center gap-3">
          {post.location && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
              <MapPin className="w-3.5 h-3.5" />
              {post.location}
            </span>
          )}
          {post.budget > 0 && (
            <span className="text-xs font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)]">
              {formatBudget(post.budget)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <TypeIcon className="w-3.5 h-3.5" />
            {typeConfig.label}
          </span>
        </div>

        {/* Match reason */}
        {matchReason && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/5 border border-[var(--lime-100)] dark:border-[var(--lime-500)]/10">
            <p className="text-xs text-[var(--lime-700)] dark:text-[var(--lime-400)]">
              {matchReason}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-4">
          <button
            onClick={handleInterested}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
              "bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)]",
              "text-white hover:opacity-90 active:scale-[0.98]",
            )}
          >
            I'm Interested
          </button>
        </div>
      </motion.div>

      {/* Interest Modal */}
      <InterestModal
        postId={post.id}
        postTitle={post.content.substring(0, 60)}
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onSuccess={handleInterestSuccess}
      />
    </>
  );
}

// Hook to manage dismissed recommendations with localStorage persistence
export function useDismissedRecommendations() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const valid = Object.entries(parsed)
          .filter(([_, ts]) => now - (ts as number) < DISMISS_EXPIRY)
          .map(([id]) => id);
        setDismissed(new Set(valid));
      }
    } catch {
      // Ignore
    }
  }, []);

  return dismissed;
}
