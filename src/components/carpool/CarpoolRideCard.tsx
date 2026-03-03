'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  Car,
  CreditCard,
  MapPin,
  ArrowRight,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InterestModal from '@/components/interest/InterestModal';
import { Post, UserInteractions } from '@/lib/api/posts';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/lib/sounds';

interface CarpoolRideCardProps {
  post: Post;
  smartCopy: string;
  isNew: boolean;
  mode: 'find' | 'offer';
  userInteractions: UserInteractions;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDeparture(post: Post): string {
  if (!post.carpoolDepartureTime) return 'Leaving now';
  const dep = new Date(post.carpoolDepartureTime);
  const now = new Date();
  const diffMs = dep.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return 'Left already';
  if (diffMins < 5) return 'Leaving now';
  if (diffMins < 60) return `In ${diffMins}min`;

  return dep.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCost(amount?: number): string {
  if (!amount) return 'Free';
  return `\u20A6${amount.toLocaleString()}`;
}

export default function CarpoolRideCard({
  post,
  smartCopy,
  isNew,
  mode,
  userInteractions,
}: CarpoolRideCardProps) {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [showInterestModal, setShowInterestModal] = useState(false);

  const isInterested = userInteractions.interests.includes(post.id);
  const seatsTotal = post.carpoolSeatsAvailable || 0;
  const seatsTaken = post.interestedCount || 0;
  const seatsLeft = Math.max(0, seatsTotal - seatsTaken);
  const isFull = seatsTotal > 0 && seatsLeft <= 0;

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      promptAuth('Sign in to join this ride');
      return;
    }
    if (isInterested) {
      router.push(`/post/${post.id}`);
      return;
    }
    playSound('swooshUp');
    setShowInterestModal(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: smartCopy, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleCardClick = () => {
    router.push(`/post/${post.id}`);
  };

  const ctaLabel = mode === 'find'
    ? (isInterested ? 'Joined' : 'Join Ride')
    : (isInterested ? 'Offered' : 'Offer Ride');

  return (
    <>
      <motion.article
        initial={isNew ? { opacity: 0, x: -20 } : { opacity: 1 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={handleCardClick}
        className={`relative p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-[var(--peach-200)] dark:border-neutral-700 shadow-sm hover:shadow-md transition-all cursor-pointer ${
          isNew ? 'ring-2 ring-[var(--lime-400)] ring-opacity-60' : ''
        }`}
      >
        {/* New glow effect */}
        {isNew && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 5 }}
            className="absolute inset-0 rounded-2xl ring-2 ring-[var(--lime-400)] pointer-events-none"
          />
        )}

        {/* Header: avatar, name, time */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-neutral-700">
            <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--lime-400)] to-[var(--yellow-400)] text-sm font-semibold">
              {post.author?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {post.author?.name}
              </span>
            </div>
            <span className="text-xs text-neutral-500">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Smart copy */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 leading-relaxed">
          {smartCopy}
        </p>

        {/* Route visualization */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-[var(--teal-500)] flex-shrink-0" />
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {post.carpoolOrigin || 'Origin'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-neutral-300 dark:text-neutral-600">
            <div className="w-6 h-px bg-current" />
            <ArrowRight className="w-3 h-3" />
            <div className="w-6 h-px bg-current" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <MapPin className="w-4 h-4 text-[var(--pink-400)] flex-shrink-0" />
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {post.carpoolDestination || 'Destination'}
            </span>
          </div>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDeparture(post)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {seatsTotal > 0 ? `${seatsLeft} of ${seatsTotal} seats` : 'Seats TBD'}
          </span>
          {post.carpoolCostPerSeat != null && (
            <span className="flex items-center gap-1 font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)]">
              {formatCost(post.carpoolCostPerSeat)}
            </span>
          )}
          {post.carpoolCarType && (
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              {post.carpoolCarType}
            </span>
          )}
          {post.carpoolPaymentMode && (
            <span className="flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              {post.carpoolPaymentMode}
            </span>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--peach-100)] dark:border-neutral-800">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-500 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>

          {isFull ? (
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
              Ride Full
            </span>
          ) : isInterested ? (
            <button
              onClick={handleJoinClick}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-700)] dark:text-[var(--lime-400)]"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {ctaLabel}
            </button>
          ) : (
            <button
              onClick={handleJoinClick}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm"
            >
              {ctaLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.article>

      {/* Interest Modal */}
      <InterestModal
        postId={post.id}
        postTitle={smartCopy}
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
      />
    </>
  );
}
