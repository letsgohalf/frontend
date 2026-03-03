'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MapPin,
  Users,
  Home,
  MoreHorizontal,
  Bookmark,
  Loader2,
  Send,
  Calendar,
  DollarSign,
  ChevronRight,
  Trash2,
  X,
  MessageSquare,
  Crown,
  Repeat2,
  ShoppingBasket,
  Reply,
  CornerDownRight,
  Check,
  Car,
  Clock,
  Navigation,
  CreditCard,
  Armchair,
  Info,
  Pencil,
  Star,
  Zap,
  Eye,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import postsApi from '@/lib/api/posts';
import type { Comment, InterestedUser } from '@/lib/api/posts';
import interestThreadsApi from '@/lib/api/interest-threads';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/utils/image';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';
import AgentBadge from '@/components/AgentBadge';
import OfficialBadge from '@/components/OfficialBadge';
import PartnerBadge from '@/components/PartnerBadge';
import PremiumBadge from '@/components/PremiumBadge';
import VerifiedBadge from '@/components/VerifiedBadge';
import ShareImageButton from '@/components/ShareImageButton';
import paymentsApi from '@/lib/api/payments';
import { usePremium } from '@/contexts/PremiumContext';
import { useToast } from '@/contexts/ToastContext';
import InterestModal from '@/components/interest/InterestModal';
import { PLATFORM_NAME, PLATFORM_LOGO } from '@/lib/constants/platform';

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    isAgentVerified?: boolean;
    agentTier?: 'licensed_pro' | 'registered_agent' | 'property_owner' | 'house_owner' | null;
    isPartner?: boolean;
    role?: 'user' | 'admin';
    subscriptionTier?: 'free' | 'premium';
  };
  content: string;
  location: string;
  latitude?: number;
  longitude?: number;
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
  status?: 'active' | 'matched' | 'filled' | 'booked' | 'deleted' | 'expired';
  // Boost fields
  isBoosted?: boolean;
  boostedAt?: string;
  boostExpiresAt?: string;
  viewsCount?: number;
  createdAt: string;
  isLiked?: boolean;
  isInterested?: boolean;
  isSaved?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
};

const postTypeConfig = {
  'looking-for-roommate': {
    label: 'Looking for roommate',
    className: 'badge badge-peach',
    description: 'This person is looking for a roommate to share their space with.'
  },
  'looking-for-place': {
    label: 'Looking for place',
    className: 'badge badge-lavender',
    description: 'This person is looking for a place to rent or share.'
  },
  'have-spare-room': {
    label: 'Has spare room',
    className: 'badge badge-lime',
    description: 'This person has a spare room available for rent.'
  },
  'announcement': {
    label: 'Announcement',
    className: 'badge bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 text-amber-700 dark:text-amber-400',
    description: 'An official announcement from the LetsGoHalf team.'
  },
  'house-alert': {
    label: '🚨 House Alert',
    className: 'badge bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-500/10 dark:to-pink-500/10 text-red-700 dark:text-red-400',
    description: 'A featured housing listing from LetsGoHalf.'
  },
  'subscription-split': {
    label: 'Subscription Split',
    className: 'badge bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-500/10 dark:to-purple-500/10 text-violet-700 dark:text-violet-400',
    description: 'Split a subscription service with others.'
  },
  'grocery-split': {
    label: 'Grocery Split',
    className: 'badge bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-500/10 dark:to-emerald-500/10 text-green-700 dark:text-green-400',
    description: 'Split a bulk purchase with others.'
  },
  'carpool-offer': {
    label: 'Carpool Offer',
    className: 'badge bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-500/10 dark:to-blue-500/10 text-sky-700 dark:text-sky-400',
    description: 'This person is offering a ride and looking for passengers to share costs.'
  },
  'carpool-request': {
    label: 'Looking for Ride',
    className: 'badge bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-500/10 dark:to-yellow-500/10 text-amber-700 dark:text-amber-400',
    description: 'This person is looking for a ride and willing to share costs.'
  },
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, promptAuth, user } = useAuth();
  const { premiumEnabled } = usePremium();
  const toast = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [likes, setLikes] = useState(0);
  const [interestedCount, setInterestedCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showInterestedUsers, setShowInterestedUsers] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [interestedUsersLoading, setInterestedUsersLoading] = useState(false);
  const [userThreadMap, setUserThreadMap] = useState<Record<string, string>>({});
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [boostingPost, setBoostingPost] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [freeBoostAvailable, setFreeBoostAvailable] = useState(false);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      if (!params.id) return;

      setIsLoading(true);
      try {
        const data = await postsApi.getPost(params.id as string);
        const formattedPost: Post = {
          id: data.id,
          author: { ...data.author, role: data.author.role },
          content: data.content,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          budget: data.budget,
          spotsAvailable: data.spotsAvailable,
          postType: data.postType,
          images: data.images,
          video: data.video,
          likesCount: data.likesCount,
          commentsCount: data.commentsCount,
          interestedCount: data.interestedCount,
          subscriptionName: data.subscriptionName,
          subscriptionTotalCost: data.subscriptionTotalCost,
          subscriptionCostPerPerson: data.subscriptionCostPerPerson,
          groceryItemName: data.groceryItemName,
          groceryTotalCost: data.groceryTotalCost,
          groceryCostPerPerson: data.groceryCostPerPerson,
          carpoolOrigin: data.carpoolOrigin,
          carpoolDestination: data.carpoolDestination,
          carpoolCarType: data.carpoolCarType,
          carpoolSeatsAvailable: data.carpoolSeatsAvailable,
          carpoolCostPerSeat: data.carpoolCostPerSeat,
          carpoolPaymentMode: data.carpoolPaymentMode,
          carpoolDepartureTime: data.carpoolDepartureTime,
          carpoolIsScheduled: data.carpoolIsScheduled,
          carpoolMeetupPoint: data.carpoolMeetupPoint,
          status: data.status,
          isBoosted: data.isBoosted,
          boostedAt: data.boostedAt,
          boostExpiresAt: data.boostExpiresAt,
          viewsCount: data.viewsCount,
          createdAt: data.createdAt,
        };
        setPost(formattedPost);
        setLikes(Math.max(0, data.likesCount ?? 0));
        setInterestedCount(Math.max(0, data.interestedCount ?? 0));

        // Fetch user interactions
        if (isAuthenticated) {
          try {
            const interactions = await postsApi.getUserInteractions([data.id]);
            setIsLiked(interactions.likes.includes(data.id));
            setIsSaved(interactions.saves.includes(data.id));
            setIsInterested(interactions.interests.includes(data.id));
          } catch {
            // Ignore
          }
        }
      } catch (err) {
        setError('Post not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.id, isAuthenticated]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!params.id) return;

      setCommentsLoading(true);
      try {
        const response = await postsApi.getComments(params.id as string);
        setComments(response.data);
      } catch {
        // Comments failed to load
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [params.id]);

  const requireAuth = useCallback((action: () => Promise<void>, message: string) => {
    if (!isAuthenticated) {
      promptAuth(message);
      return;
    }
    action();
  }, [isAuthenticated, promptAuth]);

  const handleLike = useCallback(async () => {
    requireAuth(async () => {
      if (actionLoading || !post) return;
      setActionLoading('like');

      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikes(prev => wasLiked ? prev - 1 : prev + 1);

      try {
        const result = await postsApi.toggleLike(post.id);
        setLikes(result.likesCount);
        setIsLiked(result.liked);
      } catch {
        setIsLiked(wasLiked);
        setLikes(prev => wasLiked ? prev + 1 : prev - 1);
      } finally {
        setActionLoading(null);
      }
    }, 'Sign in to like posts');
  }, [post, isLiked, actionLoading, requireAuth]);

  const handleSave = useCallback(async () => {
    requireAuth(async () => {
      if (actionLoading || !post) return;
      setActionLoading('save');

      const wasSaved = isSaved;
      setIsSaved(!wasSaved);

      try {
        const result = await postsApi.toggleSave(post.id);
        setIsSaved(result.saved);
      } catch {
        setIsSaved(wasSaved);
      } finally {
        setActionLoading(null);
      }
    }, 'Sign in to save posts');
  }, [post, isSaved, actionLoading, requireAuth]);

  const handleInterested = useCallback(async () => {
    requireAuth(async () => {
      if (actionLoading || !post) return;

      if (isInterested) {
        // Already interested - navigate to existing thread
        setActionLoading('interested');
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
          setActionLoading(null);
        }
      } else {
        // Not yet interested - show the modal
        setShowInterestModal(true);
      }
    }, 'Sign in to express interest');
  }, [post, isInterested, actionLoading, requireAuth, router]);

  const handleInterestSuccess = useCallback((threadId: string) => {
    setIsInterested(true);
    setInterestedCount(prev => prev + 1);
  }, []);

  const handleSubmitComment = useCallback(() => {
    requireAuth(async () => {
      if (!comment.trim() || !post || commentSubmitting) return;

      setCommentSubmitting(true);
      try {
        const newComment = await postsApi.addComment(post.id, comment.trim(), replyingTo?.id);
        setComments(prev => [newComment, ...prev]);
        setComment('');
        setReplyingTo(null);
        // Update comment count on post
        setPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : prev);
      } catch (err: any) {
        if (err?.response?.data?.code === 'PHONE_NUMBER_DETECTED') {
          toast.error(err.response.data.message || 'Phone numbers are not allowed in comments.');
        } else {
          console.error('Failed to add comment:', err);
        }
      } finally {
        setCommentSubmitting(false);
      }
    }, 'Sign in to comment');
  }, [comment, post, commentSubmitting, replyingTo, requireAuth]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (deletingCommentId) return;

    setDeletingCommentId(commentId);
    try {
      await postsApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeletingCommentId(null);
    }
  }, [deletingCommentId]);

  const handleEditComment = useCallback(async () => {
    if (!editingCommentId || !editingContent.trim() || editingSaving) return;

    setEditingSaving(true);
    try {
      const updated = await postsApi.editComment(editingCommentId, editingContent.trim());
      setComments(prev => prev.map(c => c.id === editingCommentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c));
      setEditingCommentId(null);
      setEditingContent('');
    } catch (err: any) {
      if (err?.response?.data?.code === 'PHONE_NUMBER_DETECTED') {
        toast.error(err.response.data.message || 'Phone numbers are not allowed in comments.');
      } else {
        console.error('Failed to edit comment:', err);
      }
    } finally {
      setEditingSaving(false);
    }
  }, [editingCommentId, editingContent, editingSaving]);

  // Check if user can delete a comment (is comment author, post author, or admin)
  const canDeleteComment = useCallback((commentAuthorId: string) => {
    if (!user || !post) return false;
    return user.id === commentAuthorId || user.id === post.author.id || user.role === 'admin';
  }, [user, post]);

  // Check if current user is the post author
  const isPostAuthor = user?.id === post?.author?.id;
  const isAdmin = user?.role === 'admin';

  const handleDeletePost = useCallback(async () => {
    if (!post || !isAdmin) return;
    if (!confirm('Are you sure you want to delete this post? The author will be notified.')) return;
    try {
      await postsApi.deletePost(post.id);
      router.push('/');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }, [post, isAdmin, router]);

  // Fetch interested users
  const handleShowInterestedUsers = useCallback(async () => {
    if (!post || !isPostAuthor) return;

    setShowInterestedUsers(true);
    setInterestedUsersLoading(true);

    try {
      const [usersResponse, threadsResponse] = await Promise.all([
        postsApi.getInterestedUsers(post.id),
        interestThreadsApi.getThreadsForPost(post.id, 1, 100),
      ]);
      setInterestedUsers(usersResponse.data);

      // Build a map of userId -> threadId for navigation
      const threadMap: Record<string, string> = {};
      for (const thread of threadsResponse.data) {
        threadMap[thread.interestedUserId] = thread.id;
      }
      setUserThreadMap(threadMap);
    } catch (err) {
      console.error('Failed to fetch interested users:', err);
    } finally {
      setInterestedUsersLoading(false);
    }
  }, [post, isPostAuthor]);

  // Handle boost post
  const handleBoostPost = useCallback(async () => {
    if (!post || !isPostAuthor) return;

    const isPremium = user?.subscriptionTier === 'premium';

    if (isPremium && freeBoostAvailable) {
      // Use free boost
      setBoostingPost(true);
      try {
        await paymentsApi.applyFreeBoost(post.id);
        toast.success('Free post boost applied!');
        setPost(prev => prev ? { ...prev, isBoosted: true, boostExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } : null);
        setFreeBoostAvailable(false);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to apply free boost');
      } finally {
        setBoostingPost(false);
      }
    } else {
      // Paid boost via Paystack
      setBoostingPost(true);
      try {
        const result = await paymentsApi.initiatePayment('post_boost', post.id);
        window.open(result.authorizationUrl, '_blank');
        // Poll for verification
        const pollInterval = setInterval(async () => {
          try {
            const verification = await paymentsApi.verifyPayment(result.reference);
            if (verification.status === 'success') {
              clearInterval(pollInterval);
              toast.success('Post boosted successfully!');
              setPost(prev => prev ? { ...prev, isBoosted: true, boostExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() } : null);
            }
          } catch { /* keep polling */ }
        }, 5000);
        setTimeout(() => clearInterval(pollInterval), 300000);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to initiate boost payment');
      } finally {
        setBoostingPost(false);
      }
    }
  }, [post, isPostAuthor, user, freeBoostAvailable]);

  // Fetch post viewers (premium only)
  const handleShowViewers = useCallback(async () => {
    if (!post || !isPostAuthor) return;
    setShowViewers(true);
    setViewersLoading(true);
    try {
      const response = await postsApi.getPostViewers(post.id);
      setViewers(response.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load viewers';
      toast.error(msg);
      setShowViewers(false);
    } finally {
      setViewersLoading(false);
    }
  }, [post, isPostAuthor]);

  // Check free boost status for post author
  useEffect(() => {
    if (isPostAuthor && user?.subscriptionTier === 'premium') {
      paymentsApi.getFreeBoostStatus().then(status => {
        setFreeBoostAvailable(status.available);
      }).catch(() => {});
    }
  }, [isPostAuthor, user]);

  const isBoosted = premiumEnabled && !!post?.isBoosted && (!post?.boostExpiresAt || new Date(post.boostExpiresAt) > new Date());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-6">
        <p className="text-neutral-600 mb-4">{error || 'Post not found'}</p>
        <button 
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }} 
          className="btn-primary touch-manipulation"
        >
          Go Back
        </button>
      </div>
    );
  }

  const typeConfig = postTypeConfig[post.postType];
  // Use actual fetched comments length, fallback to post.commentsCount if comments haven't loaded yet
  // Ensure non-negative value
  const totalComments = Math.max(0, commentsLoading ? (post.commentsCount ?? 0) : comments.length);

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Post Details
          </h1>
          <button className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pb-32">
        {/* Author Section */}
        <div className={cn(
          "p-5 backdrop-blur-sm",
          post.author.role === 'admin'
            ? "bg-gradient-to-b from-amber-50/60 to-white/80 dark:from-amber-500/[0.05] dark:to-neutral-900/80"
            : "bg-white/80 dark:bg-neutral-900/80"
        )}>
          {/* Official banner for admin posts */}
          {post.author.role === 'admin' && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold uppercase tracking-wide">
                <Crown className="w-3 h-3" />
                Official Post
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className={cn(
                "w-14 h-14 ring-2 shadow-md",
                post.author.role === 'admin'
                  ? "ring-amber-300 dark:ring-amber-500/40"
                  : "ring-white dark:ring-neutral-700"
              )}>
                {post.author.role === 'admin' ? (
                  <>
                    <AvatarImage src={PLATFORM_LOGO} alt={PLATFORM_NAME} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--teal-400)] to-[var(--lavender-400)] text-white font-bold text-sm">
                      LGH
                    </AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src={resolveImageUrl(post.author.avatar)} alt={post.author.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-neutral-800 font-semibold">
                      {post.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                    {post.author.role === 'admin' ? PLATFORM_NAME : post.author.name.split(' ')[0]}
                  </span>
                  {post.author.role === 'admin' && (
                    <OfficialBadge size="md" />
                  )}
                  {post.author.isVerified && post.author.role !== 'admin' && (
                    <VerifiedBadge size="md" />
                  )}
                  {post.author.isAgentVerified && post.author.agentTier && post.author.role !== 'admin' && (
                    <AgentBadge tier={post.author.agentTier} size="md" />
                  )}
                  {post.author.isPartner && post.author.role !== 'admin' && (
                    <PartnerBadge size="md" />
                  )}
                  {post.author.subscriptionTier === 'premium' && post.author.role !== 'admin' && (
                    <PremiumBadge size="md" />
                  )}
                </div>
                <span className="text-sm text-neutral-500">
                  Posted {formatTimeAgo(post.createdAt)}
                </span>
              </div>
            </div>
            {user?.id !== post.author.id && post.author.role !== 'admin' && (
              <button
                onClick={() => router.push(`/profile/${post.author.id}`)}
                className="btn-secondary text-sm py-2 px-4"
              >
                View Profile
              </button>
            )}
          </div>
        </div>

        {/* Video */}
        {post.video && (
          <div className="px-5 py-4">
            <div className="rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <video
                src={resolveImageUrl(post.video)}
                controls
                className="w-full aspect-video object-contain"
                preload="metadata"
              />
            </div>
          </div>
        )}

        {/* Images Gallery */}
        {post.images && post.images.length > 0 && (
          <div className="px-5 py-4">
            <div className="rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img
                src={resolveImageUrl(post.images[selectedImageIndex])}
                alt="Post image"
                className="w-full aspect-video object-cover"
              />
            </div>
            {post.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {post.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={cn(
                      "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                      selectedImageIndex === i
                        ? "border-[var(--teal-500)] ring-2 ring-[var(--teal-500)]/20"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Type Badge & Content */}
        <div className="px-5 py-4">
          {/* Hide post type badge for admin posts — the Official Post banner is enough */}
          {post.author.role !== 'admin' && (
            <>
              <span className={cn(typeConfig.className, "text-sm")}>
                {typeConfig.label}
              </span>
              <p className="text-neutral-500 text-xs mt-1 mb-4">
                {typeConfig.description}
              </p>
            </>
          )}

          <p className="text-neutral-800 dark:text-neutral-200 text-base leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Details Cards */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-3">
            {post.postType === 'subscription-split' && post.subscriptionName && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/10 dark:border dark:border-violet-500/30 flex items-center justify-center">
                <Repeat2 className="w-6 h-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Service</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.subscriptionName}</p>
              </div>
            </div>
            )}

            {post.postType === 'subscription-split' && (post.subscriptionCostPerPerson != null || post.subscriptionTotalCost != null) && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 dark:border dark:border-[var(--lime-500)]/30 flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--lime-600)]">₦</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Cost Per Person</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {post.subscriptionCostPerPerson != null
                    ? `${formatCurrency(post.subscriptionCostPerPerson)}/month`
                    : `${formatCurrency(Math.ceil(post.subscriptionTotalCost! / Math.max(post.spotsAvailable + 1, 2)))}/month`}
                </p>
                {post.subscriptionTotalCost != null && (
                  <p className="text-xs text-neutral-400 mt-0.5">Total: {formatCurrency(post.subscriptionTotalCost)}/month</p>
                )}
              </div>
            </div>
            )}

            {post.postType === 'grocery-split' && post.groceryItemName && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/10 dark:border dark:border-green-500/30 flex items-center justify-center">
                <ShoppingBasket className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Item</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.groceryItemName}</p>
              </div>
            </div>
            )}

            {post.postType === 'grocery-split' && (post.groceryCostPerPerson != null || post.groceryTotalCost != null) && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 dark:border dark:border-[var(--lime-500)]/30 flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--lime-600)]">₦</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Cost Per Person</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {post.groceryCostPerPerson != null
                    ? formatCurrency(post.groceryCostPerPerson)
                    : formatCurrency(Math.ceil(post.groceryTotalCost! / Math.max(post.spotsAvailable + 1, 2)))}
                </p>
                {post.groceryTotalCost != null && (
                  <p className="text-xs text-neutral-400 mt-0.5">Total: {formatCurrency(post.groceryTotalCost)}</p>
                )}
              </div>
            </div>
            )}

            {/* Carpool detail cards */}
            {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolOrigin && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-500/10 dark:border dark:border-sky-500/30 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">From</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.carpoolOrigin}</p>
              </div>
            </div>
            )}

            {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolDestination && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/30 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">To</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.carpoolDestination}</p>
              </div>
            </div>
            )}

            {post.postType === 'carpool-offer' && post.carpoolCarType && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 dark:border dark:border-neutral-700 flex items-center justify-center">
                <Car className="w-6 h-6 text-neutral-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Car</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.carpoolCarType}</p>
              </div>
            </div>
            )}

            {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolCostPerSeat != null && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 dark:border dark:border-[var(--lime-500)]/30 flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--lime-600)]">₦</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">{post.postType === 'carpool-offer' ? 'Cost Per Seat' : 'Willing to Pay'}</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(post.carpoolCostPerSeat)}</p>
              </div>
            </div>
            )}

            {post.postType === 'carpool-offer' && post.carpoolSeatsAvailable != null && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 dark:border dark:border-[var(--lavender-400)]/30 flex items-center justify-center">
                <Armchair className="w-6 h-6 text-[var(--lavender-500)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Available Seats</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.carpoolSeatsAvailable} seat{post.carpoolSeatsAvailable !== 1 ? 's' : ''}</p>
              </div>
            </div>
            )}

            {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 dark:border dark:border-amber-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Departure</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {post.carpoolIsScheduled && post.carpoolDepartureTime
                    ? new Date(post.carpoolDepartureTime).toLocaleString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Leaving now'}
                </p>
              </div>
            </div>
            )}

            {post.postType === 'carpool-offer' && post.carpoolPaymentMode && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 dark:border dark:border-neutral-700 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-neutral-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Payment</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">{post.carpoolPaymentMode}</p>
              </div>
            </div>
            )}

            {(post.postType === 'carpool-offer' || post.postType === 'carpool-request') && post.carpoolMeetupPoint && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 dark:border dark:border-neutral-700 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[var(--teal-500)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Meetup Point</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{post.carpoolMeetupPoint}</p>
              </div>
            </div>
            )}

            {post.location && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 dark:border dark:border-neutral-700 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[var(--teal-500)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Location</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {post.location}
                </p>
                {(() => {
                  const dist =
                    user?.homeLatitude != null && user?.homeLongitude != null && post.latitude != null && post.longitude != null
                      ? haversineDistance(user.homeLatitude, user.homeLongitude, post.latitude, post.longitude)
                      : null;
                  return dist != null ? (
                    <p className="text-xs text-[var(--teal-600)] dark:text-[var(--teal-400)] mt-0.5">
                      📍 {formatDistance(dist)}
                    </p>
                  ) : null;
                })()}
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </div>
            )}

            {post.budget > 0 && post.postType !== 'subscription-split' && post.postType !== 'grocery-split' && post.postType !== 'carpool-offer' && post.postType !== 'carpool-request' && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 dark:border dark:border-[var(--lime-500)]/30 flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--lime-600)]">₦</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Budget / Rent</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(post.budget)}</p>
              </div>
            </div>
            )}

            {post.spotsAvailable > 0 && post.postType !== 'announcement' && (
            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 dark:border dark:border-[var(--lavender-400)]/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-[var(--lavender-500)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Available Spots</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {post.spotsAvailable} {post.postType === 'subscription-split' ? 'partner' : post.postType === 'grocery-split' ? 'person' : 'spot'}{post.spotsAvailable !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            )}

            <div className="card-glass p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 dark:border dark:border-[var(--pink-400)]/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[var(--pink-400)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500">Posted</p>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formatDate(post.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-4 border-t border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-neutral-600 dark:text-neutral-400">
                <strong className="text-neutral-900 dark:text-neutral-100">{likes}</strong> reactions
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">
                <strong className="text-neutral-900 dark:text-neutral-100">{totalComments}</strong> comments
              </span>
            </div>
            {interestedCount > 0 && (
              isPostAuthor ? (
                <button
                  onClick={handleShowInterestedUsers}
                  className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium hover:underline flex items-center gap-1"
                >
                  <Users className="w-4 h-4" />
                  {interestedCount} interested
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium">
                  {interestedCount} interested
                </span>
              )
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-5 py-4 border-t border-[var(--peach-200)] dark:border-neutral-800">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Comments ({totalComments})
          </h3>

          {/* Nudge to use interest thread instead of comments */}
          {!isPostAuthor && !isAdmin && post.postType !== 'announcement' && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/5 border border-[var(--teal-200)] dark:border-[var(--teal-500)]/15">
              <Info className="w-4 h-4 text-[var(--teal-500)] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[var(--teal-700)] dark:text-[var(--teal-400)] leading-relaxed">
                Want to connect with the poster? Tap{' '}
                <strong>
                  {post.postType === 'carpool-offer'
                    ? '"Join Ride"'
                    : post.postType === 'carpool-request'
                      ? '"Offer Ride"'
                      : '"I\'m Interested"'}
                </strong>{' '}
                below to start a private thread instead of chatting here.
              </p>
            </div>
          )}

          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-6">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Thread comments: parent comments first, their replies underneath
                const topLevel = comments.filter(c => !c.parentId);
                const replyMap = new Map<string, typeof comments>();
                for (const r of comments.filter(c => c.parentId)) {
                  const arr = replyMap.get(r.parentId!) || [];
                  arr.push(r);
                  replyMap.set(r.parentId!, arr);
                }
                // Sort replies oldest-first so conversation reads naturally
                for (const [, arr] of replyMap) {
                  arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                }
                const threaded: typeof comments = [];
                for (const parent of topLevel) {
                  threaded.push(parent);
                  const childReplies = replyMap.get(parent.id);
                  if (childReplies) threaded.push(...childReplies);
                }
                // Orphan replies whose parent isn't in this page
                for (const r of comments.filter(c => c.parentId)) {
                  if (!threaded.includes(r)) threaded.push(r);
                }
                return threaded;
              })().map((c) => {
                const parentComment = c.parentId ? comments.find(p => p.id === c.parentId) : null;
                return (
                  <div key={c.id} className={cn("flex gap-3", c.parentId && "ml-10")}>
                    <Link href={`/profile/${c.author.id}`} className="flex-shrink-0">
                      <Avatar className={cn("hover:ring-2 hover:ring-[var(--teal-400)] transition-all cursor-pointer", c.parentId ? "w-8 h-8" : "w-10 h-10")}>
                        <AvatarImage src={resolveImageUrl(c.author.avatar)} alt={c.author.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-sm">
                          {c.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      {parentComment && (
                        <div className="flex items-center gap-1 mb-1 ml-2 text-xs text-neutral-400">
                          <CornerDownRight className="w-3 h-3" />
                          <span>replying to <span className="font-medium text-neutral-500 dark:text-neutral-400">{parentComment.author.name.split(' ')[0]}</span></span>
                        </div>
                      )}
                      <div className="bg-[var(--peach-50)] dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/profile/${c.author.id}`}
                              className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 hover:text-[var(--teal-600)] dark:hover:text-[var(--teal-400)] transition-colors"
                            >
                              {c.author.name.split(' ')[0]}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1">
                            {user?.id === c.authorId && editingCommentId !== c.id && (
                              <button
                                onClick={() => { setEditingCommentId(c.id); setEditingContent(c.content); }}
                                className="p-1 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
                              </button>
                            )}
                            {canDeleteComment(c.author.id) && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                disabled={deletingCommentId === c.id}
                                className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                              >
                                {deletingCommentId === c.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-red-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        {editingCommentId === c.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 rounded-xl px-3 py-2 border border-[var(--peach-200)] dark:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => { setEditingCommentId(null); setEditingContent(''); }}
                                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 px-3 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleEditComment}
                                disabled={editingSaving || !editingContent.trim()}
                                className="text-xs font-medium text-white bg-[var(--teal-500)] hover:bg-[var(--teal-600)] disabled:opacity-50 px-3 py-1 rounded-lg flex items-center gap-1"
                              >
                                {editingSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            {c.content}
                            {c.updatedAt && c.updatedAt !== c.createdAt && (
                              <span className="text-xs text-neutral-400 ml-1">(edited)</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-neutral-500">
                        <span>{formatTimeAgo(c.createdAt)}</span>
                        {isAuthenticated && (
                          <button
                            onClick={() => setReplyingTo(c)}
                            className="flex items-center gap-1 hover:text-[var(--teal-500)] transition-colors"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Owner Premium Actions */}
        {premiumEnabled && isPostAuthor && post && (
          <div className="px-5 py-4">
            <div className="card-glass p-5 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Post Owner Actions
              </h3>

              {/* View count + See who viewed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Eye className="w-4 h-4" />
                  <span>{post.viewsCount || 0} views</span>
                </div>
                {user?.subscriptionTier === 'premium' ? (
                  <button
                    onClick={handleShowViewers}
                    className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline"
                  >
                    See who viewed →
                  </button>
                ) : (
                  <Link
                    href="/premium"
                    className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Premium: See viewers
                  </Link>
                )}
              </div>

              {/* Boost button */}
              {isBoosted ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Boosted until {new Date(post.boostExpiresAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleBoostPost}
                  disabled={boostingPost}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900 font-semibold transition-all hover:from-amber-500 hover:to-yellow-600 disabled:opacity-50"
                >
                  {boostingPost ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {user?.subscriptionTier === 'premium' && freeBoostAvailable
                        ? 'Boost Post (Free - Premium)'
                        : 'Boost Post — ₦5,000 for 7 days'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Interested Users Modal */}
      {showInterestedUsers && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setShowInterestedUsers(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 w-full sm:w-[480px] max-h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-900 px-5 py-4 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                People Interested ({interestedCount})
              </h2>
              <button
                onClick={() => setShowInterestedUsers(false)}
                className="w-8 h-8 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-72px)]">
              {interestedUsersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
                </div>
              ) : interestedUsers.length === 0 ? (
                <div className="text-center py-12 px-5">
                  <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500">No one has expressed interest yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                  {interestedUsers.map((interest) => (
                    <div
                      key={interest.id}
                      className="px-5 py-4 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar
                          className="w-12 h-12 ring-2 ring-white dark:ring-neutral-700 shadow-sm cursor-pointer"
                          onClick={() => router.push(`/profile/${interest.user.id}`)}
                        >
                          <AvatarImage src={resolveImageUrl(interest.user.avatar)} alt={interest.user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-neutral-800 font-semibold">
                            {interest.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => router.push(`/profile/${interest.user.id}`)}
                              className="font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer hover:underline"
                            >
                              {interest.user.name.split(' ')[0]}
                            </span>
                          </div>
                          {interest.user.occupation && (
                            <p className="text-sm text-neutral-500 truncate">
                              {interest.user.occupation}
                            </p>
                          )}
                          {interest.user.bio && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                              {interest.user.bio}
                            </p>
                          )}
                          <p className="text-xs text-neutral-400 mt-1">
                            Interested {formatTimeAgo(interest.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          {userThreadMap[interest.user.id] && (
                            <button
                              onClick={() => {
                                setShowInterestedUsers(false);
                                router.push(`/interest/${userThreadMap[interest.user.id]}`);
                              }}
                              className="p-2 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-[var(--lavender-500)] dark:text-[var(--lavender-400)] hover:bg-[var(--lavender-200)] dark:hover:bg-[var(--lavender-400)]/20 transition-colors"
                              title="View thread"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                          )}
                          {/* <button
                            onClick={() => {
                              setShowInterestedUsers(false);
                              router.push(`/chat?userId=${interest.user.id}`);
                            }}
                            className="p-2 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:bg-[var(--teal-200)] dark:hover:bg-[var(--teal-500)]/20 transition-colors"
                            title="Start conversation"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-[var(--peach-200)] dark:border-neutral-800 px-4 pt-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
        <div className="max-w-2xl mx-auto">
          {/* Replying to indicator */}
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                <Reply className="w-3.5 h-3.5" />
                <span>Replying to <span className="font-semibold">{replyingTo.author.name.split(' ')[0]}</span></span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-0.5 rounded-full hover:bg-[var(--teal-100)] dark:hover:bg-[var(--teal-500)]/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[var(--teal-500)]" />
              </button>
            </div>
          )}

          {/* Comment Input */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-[var(--peach-50)] dark:bg-neutral-800 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder={replyingTo ? `Reply to ${replyingTo.author.name.split(' ')[0]}...` : "Write a comment..."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(); }}
                className="flex-1 bg-transparent outline-none text-base text-neutral-900 dark:text-neutral-100"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!comment.trim() || commentSubmitting}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  comment.trim() && !commentSubmitting
                    ? "text-[var(--teal-500)] hover:bg-[var(--teal-100)] dark:hover:bg-[var(--teal-500)]/10"
                    : "text-neutral-400"
                )}
              >
                {commentSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                disabled={actionLoading === 'like'}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-colors",
                  isLiked
                    ? "text-[var(--pink-400)] bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10"
                    : "text-neutral-600 dark:text-neutral-400 bg-[var(--peach-100)] dark:bg-neutral-800"
                )}
              >
                {actionLoading === 'like' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                )}
                <span className="text-sm font-medium">{likes}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={actionLoading === 'save'}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-colors",
                  isSaved
                    ? "text-[var(--yellow-500)] bg-[var(--yellow-100)] dark:bg-[var(--yellow-500)]/10"
                    : "text-neutral-600 dark:text-neutral-400 bg-[var(--peach-100)] dark:bg-neutral-800"
                )}
              >
                {actionLoading === 'save' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                )}
              </motion.button>

              <ShareImageButton postId={post.id} />

              {(isPostAuthor || isAdmin) && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => router.push(`/post/${post.id}/edit`)}
                  className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400"
                >
                  <Pencil className="w-5 h-5" />
                </motion.button>
              )}

              {isAdmin && !isPostAuthor && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDeletePost}
                  className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {post.status === 'filled' && !(isPostAuthor || isAdmin) ? (
              <div className="px-5 py-2.5 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-900)] text-[var(--teal-700)] dark:text-[var(--teal-300)] text-sm font-semibold flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Filled</span>
              </div>
            ) : post.status === 'matched' && !(isPostAuthor || isAdmin) && post.postType !== 'carpool-offer' && post.postType !== 'carpool-request' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInterested}
                disabled={actionLoading === 'interested'}
                className="px-5 py-2.5 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-900)] text-[var(--teal-700)] dark:text-[var(--teal-300)] text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                {actionLoading === 'interested' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                <span>Matched</span>
              </motion.button>
            ) : user?.id !== post.author.id && !isAdmin ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInterested}
                disabled={actionLoading === 'interested'}
                className={cn(
                  "btn-interested",
                  isInterested && "active"
                )}
              >
                {actionLoading === 'interested' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : post.postType === 'carpool-offer' || post.postType === 'carpool-request' ? (
                  <Car className="w-5 h-5" />
                ) : (
                  <Home className="w-5 h-5" />
                )}
                <span className="font-semibold">{isInterested ? 'Interested!' : post.postType === 'carpool-offer' ? 'Join Ride' : post.postType === 'carpool-request' ? 'Offer Ride' : "I'm Interested"}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/posts/${post.id}/interests`)}
                className="btn-interested"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {interestedCount > 0
                    ? `Talk to ${interestedCount} Interested`
                    : 'View Threads'}
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Viewers Modal */}
      {showViewers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-500" />
                Who Viewed Your Post
              </h3>
              <button
                onClick={() => setShowViewers(false)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
              {viewersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
                </div>
              ) : viewers.length === 0 ? (
                <p className="text-center text-neutral-500 py-8">No viewers yet</p>
              ) : (
                viewers.map(v => (
                  <Link
                    key={v.id}
                    href={`/profile/${v.viewer.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={resolveImageUrl(v.viewer.avatar)} alt={v.viewer.name} />
                      <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-neutral-800 font-semibold text-sm">
                        {v.viewer.name?.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">
                          {v.viewer.name}
                        </span>
                        {v.viewer.subscriptionTier === 'premium' && <PremiumBadge size="sm" />}
                      </div>
                      <span className="text-xs text-neutral-500">
                        Viewed {v.viewCount}x · Last {new Date(v.lastViewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Interest Modal */}
      {post && (
        <InterestModal
          postId={post.id}
          postTitle={post.content?.substring(0, 100) || 'This listing'}
          isOpen={showInterestModal}
          onClose={() => setShowInterestModal(false)}
          onSuccess={handleInterestSuccess}
        />
      )}
    </div>
  );
}
