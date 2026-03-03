'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  MapPin,
  Users,
  Home,
  Crown,
  MoreHorizontal,
  Bookmark,
  Share2,
  Loader2,
  Edit3,
  Trash2,
  Link2,
  Check,
  Sparkles,
  Megaphone,
  Repeat2,
  Car,
  Clock,
  Navigation,
  CreditCard,
  Armchair,
  Zap,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import postsApi from '@/lib/api/posts';
import { cn } from '@/lib/utils';
import interestThreadsApi from '@/lib/api/interest-threads';
import { resolveImageUrl } from '@/lib/utils/image';
import AgentBadge from '@/components/AgentBadge';
import InterestModal from '@/components/interest/InterestModal';
import OfficialBadge from '@/components/OfficialBadge';
import PartnerBadge from '@/components/PartnerBadge';
import PremiumBadge from '@/components/PremiumBadge';
import VerifiedBadge from '@/components/VerifiedBadge';
import ShareImageButton from '@/components/ShareImageButton';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';
import { PLATFORM_NAME, PLATFORM_LOGO } from '@/lib/constants/platform';
import { playSound } from '@/lib/sounds';
import { usePremium } from '@/contexts/PremiumContext';

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    agentTier?: 'licensed_pro' | 'registered_agent' | 'property_owner' | 'house_owner' | null;
    isAgentVerified?: boolean;
    isPartner?: boolean;
    role?: 'user' | 'admin';
    subscriptionTier?: 'free' | 'premium';
  };
  content: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance?: number | null;
  budget: number;
  spotsAvailable: number;
  postType: 'looking-for-roommate' | 'looking-for-place' | 'have-spare-room' | 'announcement' | 'house-alert' | 'subscription-split' | 'grocery-split' | 'carpool-offer' | 'carpool-request';
  subscriptionName?: string;
  subscriptionTotalCost?: number;
  subscriptionCostPerPerson?: number;
  groceryItemName?: string;
  groceryTotalCost?: number;
  groceryCostPerPerson?: number;
  // Carpool fields
  carpoolOrigin?: string;
  carpoolDestination?: string;
  carpoolCarType?: string;
  carpoolSeatsAvailable?: number;
  carpoolCostPerSeat?: number;
  carpoolPaymentMode?: string;
  carpoolDepartureTime?: string;
  carpoolIsScheduled?: boolean;
  carpoolMeetupPoint?: string;
  images?: string[];
  video?: string;
  likesCount?: number;
  commentsCount?: number;
  interestedCount?: number;
  reactions?: {
    likes: number;
    hearts: number;
    homes: number;
  };
  comments?: number;
  createdAt: string;
  isLiked?: boolean;
  isInterested?: boolean;
  isSaved?: boolean;
  status?: 'active' | 'matched' | 'filled' | 'booked' | 'deleted' | 'expired';
  // Promotion fields
  promotionType?: 'none' | 'sponsored' | 'promoted';
  promotedBy?: { id: string; name: string };
  promotedAt?: string;
  // Boost fields
  isBoosted?: boolean;
  boostedAt?: string;
  boostExpiresAt?: string;
}

interface PostCardProps {
  post: Post;
  onInterested?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPromote?: (postId: string, type: 'sponsored' | 'promoted') => void;
  onDemote?: (postId: string) => void;
  isLiked?: boolean;
  isSaved?: boolean;
  isInterested?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return postDate.toLocaleDateString();
};

const postTypeConfig = {
  'looking-for-roommate': {
    label: 'Looking for roommate',
    className: 'badge badge-peach'
  },
  'looking-for-place': {
    label: 'Looking for place',
    className: 'badge badge-lavender'
  },
  'have-spare-room': {
    label: 'Has spare room',
    className: 'badge badge-lime'
  },
  'announcement': {
    label: 'Announcement',
    className: 'badge bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 text-amber-700 dark:text-amber-400'
  },
  'house-alert': {
    label: '🚨 House Alert',
    className: 'badge bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-500/10 dark:to-pink-500/10 text-red-700 dark:text-red-400'
  },
  'subscription-split': {
    label: 'Subscription Split',
    className: 'badge bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-500/10 dark:to-purple-500/10 text-violet-700 dark:text-violet-400'
  },
  'grocery-split': {
    label: 'Grocery Split',
    className: 'badge bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-500/10 dark:to-emerald-500/10 text-green-700 dark:text-green-400'
  },
  'carpool-offer': {
    label: 'Carpool Offer',
    className: 'badge bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-500/10 dark:to-blue-500/10 text-sky-700 dark:text-sky-400'
  },
  'carpool-request': {
    label: 'Looking for Ride',
    className: 'badge bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-500/10 dark:to-yellow-500/10 text-amber-700 dark:text-amber-400'
  },
};

export default function PostCard({
  post,
  onInterested,
  onComment,
  onSave,
  onEdit,
  onDelete,
  onPromote,
  onDemote,
  isLiked: initialIsLiked = false,
  isSaved: initialIsSaved = false,
  isInterested: initialIsInterested = false,
}: PostCardProps) {
  const router = useRouter();
  const { isAuthenticated, promptAuth, user } = useAuth();
  const { premiumEnabled } = usePremium();
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';

  // Get likes count from either format - ensure non-negative values
  const initialLikes = Math.max(0, post.likesCount ?? post.reactions?.likes ?? 0);
  const initialComments = Math.max(0, post.commentsCount ?? post.comments ?? 0);
  const initialInterestedCount = Math.max(0, post.interestedCount ?? 0);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? initialIsLiked);
  const [isInterested, setIsInterested] = useState(post.isInterested ?? initialIsInterested);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? initialIsSaved);
  const [likes, setLikes] = useState(initialLikes);
  const [interestedCount, setInterestedCount] = useState(initialInterestedCount);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);

  // Check if current user is the post author
  const isAuthor = user?.id === post.author.id;

  // Get post URL
  const getPostUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/post/${post.id}`;
    }
    return `/post/${post.id}`;
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPostUrl());
      playSound('pop');
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Share post
  const handleShare = async () => {
    const shareData = {
      title: isAdminPost ? `${PLATFORM_NAME} announcement` : `${post.author.name}'s listing on LetsGoHalf`,
      text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
      url: getPostUrl(),
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShowMenu(false);
      } else {
        // Fallback to copy link
        handleCopyLink();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to share:', err);
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Auth-protected action wrapper
  const requireAuth = useCallback((action: () => Promise<void>, message: string) => {
    if (!isAuthenticated) {
      promptAuth(message);
      return;
    }
    action();
  }, [isAuthenticated, promptAuth]);

  const handleLike = useCallback(async () => {
    requireAuth(async () => {
      if (isLoading) return;
      playSound('pop');
      setIsLoading('like');

      // Optimistic update
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikes(prev => wasLiked ? prev - 1 : prev + 1);

      try {
        const result = await postsApi.toggleLike(post.id);
        setLikes(result.likesCount);
        setIsLiked(result.liked);
      } catch (error) {
        // Revert on error
        setIsLiked(wasLiked);
        setLikes(prev => wasLiked ? prev + 1 : prev - 1);
        console.error('Failed to toggle like:', error);
      } finally {
        setIsLoading(null);
      }
    }, 'Sign in to like posts');
  }, [post.id, isLiked, isLoading, requireAuth]);

  const handleComment = useCallback(() => {
    requireAuth(async () => {
      onComment?.(post.id);
    }, 'Sign in to comment on posts');
  }, [post.id, onComment, requireAuth]);

  const handleInterested = useCallback(async () => {
    requireAuth(async () => {
      if (isInterested) {
        // Already interested - navigate to existing thread
        setIsLoading('interested');
        try {
          const { data } = await interestThreadsApi.getMyThreads(1, 50);
          const existingThread = data.find(t => t.postId === post.id);
          if (existingThread) {
            router.push(`/interest/${existingThread.id}`);
          } else {
            router.push('/my-interests');
          }
        } catch {
          router.push('/my-interests');
        } finally {
          setIsLoading(null);
        }
      } else {
        // Not yet interested - show the modal with how-it-works info
        playSound('swooshUp');
        setShowInterestModal(true);
      }
    }, 'Sign in to express interest and connect with roommates');
  }, [post.id, isInterested, requireAuth, router]);

  const handleInterestSuccess = useCallback((threadId: string) => {
    playSound('success');
    setIsInterested(true);
    setInterestedCount(prev => prev + 1);
    onInterested?.(post.id);
  }, [post.id, onInterested]);

  const handleSave = useCallback(async () => {
    requireAuth(async () => {
      if (isLoading) return;
      playSound('pop');
      setIsLoading('save');

      // Optimistic update
      const wasSaved = isSaved;
      setIsSaved(!wasSaved);

      try {
        const result = await postsApi.toggleSave(post.id);
        setIsSaved(result.saved);
        onSave?.(post.id);
      } catch (error) {
        // Revert on error
        setIsSaved(wasSaved);
        console.error('Failed to toggle save:', error);
      } finally {
        setIsLoading(null);
      }
    }, 'Sign in to save posts for later');
  }, [post.id, isSaved, isLoading, onSave, requireAuth]);

  const typeConfig = postTypeConfig[post.postType];

  const handlePostClick = () => {
    router.push(`/post/${post.id}`);
  };

  const isAdminPost = post.author.role === 'admin';

  const isPromoted = post.promotionType === 'promoted';
  const isSponsored = post.promotionType === 'sponsored';
  const isBoosted = premiumEnabled && !!post.isBoosted && (!post.boostExpiresAt || new Date(post.boostExpiresAt) > new Date());

  return (
    <article 
      className={cn(
        "post-card",
        isAdminPost && "ring-1 ring-amber-200 dark:ring-amber-500/20 bg-gradient-to-b from-amber-50/40 to-transparent dark:from-amber-500/[0.03] dark:to-transparent",
        isPromoted && !isAdminPost && "ring-1 ring-[var(--lime-300)] dark:ring-[var(--lime-500)]/30 bg-gradient-to-b from-[var(--lime-50)]/60 to-transparent dark:from-[var(--lime-500)]/[0.03] dark:to-transparent",
        isSponsored && !isAdminPost && "ring-1 ring-[var(--lavender-200)] dark:ring-[var(--lavender-400)]/30 bg-gradient-to-b from-[var(--lavender-50)]/60 to-transparent dark:from-[var(--lavender-500)]/[0.03] dark:to-transparent",
        isBoosted && !isPromoted && !isSponsored && !isAdminPost && "ring-1 ring-amber-200 dark:ring-amber-500/20 bg-gradient-to-b from-amber-50/40 to-transparent dark:from-amber-500/[0.03] dark:to-transparent"
      )}
    >
      {/* Promotion banner */}
      {isPromoted && !isAdminPost && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--lime-200)] to-[var(--yellow-200)] dark:from-[var(--lime-500)]/20 dark:to-[var(--yellow-500)]/20 text-[var(--lime-700)] dark:text-[var(--lime-400)] text-[11px] font-semibold uppercase tracking-wide">
            <Sparkles className="w-3 h-3" />
            Promoted
          </span>
        </div>
      )}
      {isSponsored && !isAdminPost && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-500)]/10 text-[var(--lavender-600)] dark:text-[var(--lavender-400)] text-[11px] font-semibold uppercase tracking-wide">
            <Megaphone className="w-3 h-3" />
            Sponsored
          </span>
        </div>
      )}
      {isBoosted && !isPromoted && !isSponsored && !isAdminPost && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-500/10 dark:to-yellow-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold uppercase tracking-wide">
            <Zap className="w-3 h-3" />
            Boosted
          </span>
        </div>
      )}
      {/* Official banner for admin posts */}
      {isAdminPost && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold uppercase tracking-wide">
            <Crown className="w-3 h-3" />
            Official Post
          </span>
        </div>
      )}
      {/* Clickable Header */}
      <div className="p-4 pb-0 cursor-pointer" onClick={handlePostClick}>
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex items-center gap-3 transition-opacity",
              !isAdminPost && "cursor-pointer hover:opacity-80"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdminPost) {
                router.push(`/profile/${post.author.id}`);
              }
            }}
          >
            <Avatar className={cn(
              "w-11 h-11 ring-2 shadow-sm",
              isAdminPost
                ? "ring-amber-300 dark:ring-amber-500/40"
                : "ring-white dark:ring-neutral-700"
            )}>
              {isAdminPost ? (
                <>
                  <AvatarImage src={PLATFORM_LOGO} alt={PLATFORM_NAME} />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--teal-400)] to-[var(--lavender-400)] text-white font-bold text-xs">
                    LGH
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src={resolveImageUrl(post.author.avatar)} alt={post.author.name} />
                  <AvatarFallback className="font-semibold text-sm bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-neutral-800">
                    {post.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "font-semibold text-neutral-900 dark:text-neutral-100",
                  !isAdminPost && "hover:underline"
                )}>
                  {isAdminPost ? PLATFORM_NAME : post.author.name.split(' ')[0]}
                </span>
                {isAdminPost && (
                  <OfficialBadge size="sm" />
                )}
                {post.author.isVerified && !isAdminPost && (
                  <VerifiedBadge size="sm" />
                )}
                {post.author.isAgentVerified && post.author.agentTier && !isAdminPost && (
                  <AgentBadge tier={post.author.agentTier} size="sm" />
                )}
                {post.author.isPartner && !isAdminPost && (
                  <PartnerBadge size="sm" />
                )}
                {post.author.subscriptionTier === 'premium' && !isAdminPost && (
                  <PremiumBadge size="sm" />
                )}
              </div>
              <span className="text-sm text-neutral-500">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playSound('click');
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-neutral-400" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-[var(--peach-200)] dark:border-neutral-700 overflow-hidden min-w-[140px]"
                >
                  {isAuthor ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onEdit?.(post.id);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Post
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDelete?.(post.id);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--pink-500)] hover:bg-[var(--pink-50)] dark:hover:bg-[var(--pink-500)]/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <>
                      <ShareImageButton 
                        postId={post.id} 
                        variant="menu-item"
                        onClose={() => setShowMenu(false)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-[var(--lime-500)]" />
                            <span className="text-[var(--lime-600)]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {/* Admin Promotion Options */}
                  {isAdmin && onPromote && onDemote && (
                    <>
                      <div className="border-t border-[var(--peach-100)] dark:border-neutral-700 my-1" />
                      {(!post.promotionType || post.promotionType === 'none') ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(false);
                              onPromote(post.id, 'promoted');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--lime-600)] hover:bg-[var(--lime-50)] dark:hover:bg-[var(--lime-500)]/10 transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                            Promote Post
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(false);
                              onPromote(post.id, 'sponsored');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--lavender-600)] hover:bg-[var(--lavender-50)] dark:hover:bg-[var(--lavender-500)]/10 transition-colors"
                          >
                            <Megaphone className="w-4 h-4" />
                            Mark Sponsored
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onDemote(post.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--pink-500)] hover:bg-[var(--pink-50)] dark:hover:bg-[var(--pink-500)]/10 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                          Remove {post.promotionType === 'promoted' ? 'Promotion' : 'Sponsored'}
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Clickable Content */}
      <div className="p-4 cursor-pointer" onClick={handlePostClick}>
        {/* Hide post type badge for admin posts — the Official Post banner is enough */}
        {!isAdminPost && (
          <span className={typeConfig.className}>
            {typeConfig.label}
          </span>
        )}

        <p className={cn(
          "text-neutral-800 dark:text-neutral-200 text-[15px] leading-relaxed mb-4 whitespace-pre-line",
          !isAdminPost && "mt-3"
        )}>
          {post.content}
        </p>

        {/* Meta badges — hidden for announcements without location/budget */}
        {(post.location || post.budget > 0 || post.postType === 'subscription-split' || post.postType === 'grocery-split' || post.postType === 'carpool-offer' || post.postType === 'carpool-request') && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.postType === 'subscription-split' && post.subscriptionName && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-sm">
            <Repeat2 className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-violet-700 dark:text-violet-400 font-medium">
              {post.subscriptionName}
            </span>
          </div>
          )}
          {post.postType === 'subscription-split' && (post.subscriptionCostPerPerson != null || post.subscriptionTotalCost != null) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-sm">
            <span className="text-neutral-800 dark:text-[var(--lime-400)] font-semibold">
              {post.subscriptionCostPerPerson != null
                ? `${formatCurrency(post.subscriptionCostPerPerson)}/person`
                : `${formatCurrency(post.subscriptionTotalCost!)} total`}
            </span>
          </div>
          )}
          {post.postType === 'grocery-split' && post.groceryItemName && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-500/10 text-sm">
            <span className="text-green-700 dark:text-green-400 font-medium">
              {post.groceryItemName}
            </span>
          </div>
          )}
          {post.postType === 'grocery-split' && (post.groceryCostPerPerson != null || post.groceryTotalCost != null) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-sm">
            <span className="text-neutral-800 dark:text-[var(--lime-400)] font-semibold">
              {post.groceryCostPerPerson != null
                ? `${formatCurrency(post.groceryCostPerPerson)}/person`
                : `${formatCurrency(post.groceryTotalCost!)} total`}
            </span>
          </div>
          )}
          {/* Carpool meta badges */}
          {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolOrigin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-500/10 text-sm">
            <MapPin className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-sky-700 dark:text-sky-400 font-medium">
              From: {post.carpoolOrigin}
            </span>
          </div>
          )}
          {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolDestination && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-sm">
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              To: {post.carpoolDestination}
            </span>
          </div>
          )}
          {post.postType === 'carpool-offer' && post.carpoolCarType && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm">
            <Car className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {post.carpoolCarType}
            </span>
          </div>
          )}
          {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolCostPerSeat != null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-sm">
            <span className="text-neutral-800 dark:text-[var(--lime-400)] font-semibold">
              {formatCurrency(post.carpoolCostPerSeat)}/seat
            </span>
          </div>
          )}
          {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              {post.carpoolIsScheduled && post.carpoolDepartureTime
                ? new Date(post.carpoolDepartureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Leaving now'}
            </span>
          </div>
          )}
          {post.postType === 'carpool-offer' && post.carpoolSeatsAvailable != null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-sm">
            <Armchair className="w-3.5 h-3.5 text-[var(--lavender-400)]" />
            <span className="text-neutral-700 dark:text-neutral-300">
              {post.carpoolSeatsAvailable} seat{post.carpoolSeatsAvailable !== 1 ? 's' : ''}
            </span>
          </div>
          )}
          {post.postType === 'carpool-offer' && post.carpoolPaymentMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm">
            <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {post.carpoolPaymentMode}
            </span>
          </div>
          )}
          {post.location && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 text-sm">
            <MapPin className="w-3.5 h-3.5 text-[var(--teal-500)]" />
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {post.location}
              {(() => {
                // Try API-provided distance first, then compute client-side
                const dist = post.distance ??
                  (user?.homeLatitude != null && user?.homeLongitude != null && post.latitude != null && post.longitude != null
                    ? haversineDistance(user.homeLatitude, user.homeLongitude, post.latitude, post.longitude)
                    : null);
                return dist != null ? ` · ${formatDistance(dist)}` : '';
              })()}
            </span>
          </div>
          )}
          {post.budget > 0 && post.postType !== 'subscription-split' && post.postType !== 'grocery-split' && post.postType !== 'carpool-offer' && post.postType !== 'carpool-request' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-sm">
            <span className="text-neutral-800 dark:text-[var(--lime-400)] font-semibold">
              {formatCurrency(post.budget)}
            </span>
          </div>
          )}
          {post.spotsAvailable > 0 && post.postType !== 'announcement' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-sm">
            <Users className="w-3.5 h-3.5 text-[var(--lavender-400)]" />
            <span className="text-neutral-700 dark:text-neutral-300">
              {post.spotsAvailable} {post.postType === 'subscription-split' ? 'partner' : post.postType === 'grocery-split' ? 'person' : 'spot'}{post.spotsAvailable !== 1 ? 's' : ''}
            </span>
          </div>
          )}
        </div>
        )}

        {/* Video */}
        {post.video && (
          <div className="rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <video
              src={resolveImageUrl(post.video)}
              controls
              className="w-full aspect-video object-contain"
              preload="metadata"
            />
          </div>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={cn(
            "grid gap-2 rounded-2xl overflow-hidden",
            post.images.length === 1 && "grid-cols-1",
            post.images.length === 2 && "grid-cols-2",
            post.images.length >= 3 && "grid-cols-3"
          )}>
            {post.images.slice(0, 3).map((image, i) => (
              <div
                key={i}
                className={cn(
                  "bg-[var(--peach-100)] dark:bg-neutral-800 rounded-xl overflow-hidden",
                  post.images!.length === 1 ? "aspect-video" : "aspect-square"
                )}
              >
                <img
                  src={resolveImageUrl(image)}
                  alt={`Post image ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between text-sm text-neutral-500 border-t border-[var(--peach-100)] dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <span>{likes} reactions</span>
          <span>{initialComments} comments</span>
        </div>
        {interestedCount > 0 && (
          <span className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium">
            {interestedCount} interested
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-3 flex items-center justify-between gap-2 border-t border-[var(--peach-100)] dark:border-neutral-800">
        <div className="flex items-center gap-1 flex-shrink min-w-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            disabled={isLoading === 'like'}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors",
              isLiked
                ? "text-[var(--pink-400)] bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10"
                : "text-neutral-500 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800"
            )}
          >
            {isLoading === 'like' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            )}
            <span className="text-sm font-medium">{likes}</span>
          </motion.button>

          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-neutral-500 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{initialComments}</span>
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isLoading === 'save'}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors",
              isSaved
                ? "text-[var(--yellow-500)] bg-[var(--yellow-100)] dark:bg-[var(--yellow-500)]/10"
                : "text-neutral-500 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800"
            )}
          >
            {isLoading === 'save' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
            )}
          </motion.button>

          <ShareImageButton 
            postId={post.id} 
            className="px-3 py-2 text-neutral-500"
          />
        </div>

        {(() => {
          const isMultiMatch = post.postType === 'carpool-offer' || post.postType === 'carpool-request' || post.postType === 'subscription-split' || post.postType === 'grocery-split';
          const isFullyClosed = post.status === 'filled' || (post.status === 'matched' && !isMultiMatch);
          return isFullyClosed;
        })() && !(user?.id === post.author.id || isAdmin) ? (
          <div className="px-4 py-2 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-900)] text-[var(--teal-700)] dark:text-[var(--teal-300)] text-sm font-medium flex items-center gap-1.5 flex-shrink-0">
            <Check className="w-4 h-4" />
            <span>{post.status === 'filled' ? 'Filled' : 'Matched'}</span>
          </div>
        ) : user?.id !== post.author.id && !isAdmin ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInterested}
            disabled={isLoading === 'interested'}
            className={cn(
              "btn-interested text-sm flex-shrink-0 whitespace-nowrap",
              isInterested && "active"
            )}
          >
            {isLoading === 'interested' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : post.postType === 'carpool-offer' || post.postType === 'carpool-request' ? (
              <Car className="w-4 h-4" />
            ) : (
              <Home className="w-4 h-4" />
            )}
            <span>{isInterested ? 'Interested!' : post.postType === 'carpool-offer' ? 'Join Ride' : post.postType === 'carpool-request' ? 'Offer Ride' : "I'm Interested"}</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/posts/${post.id}/interests`)}
            className="btn-interested text-sm flex-shrink-0 whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            <span>
              {interestedCount > 0
                ? `${interestedCount} Interested`
                : 'View Threads'}
            </span>
          </motion.button>
        )}
      </div>

      {/* Interest Modal */}
      <InterestModal
        postId={post.id}
        postTitle={post.content?.substring(0, 100) || 'This listing'}
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onSuccess={handleInterestSuccess}
      />
    </article>
  );
}
