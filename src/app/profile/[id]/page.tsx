'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  MessageCircle,
  MoreHorizontal,
  Home,
  Heart,
  Users,
  Star,
  Loader2,
  Share2,
  Flag,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import conversationsApi from '@/lib/api/conversations';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/utils/image';
import AgentBadge from '@/components/AgentBadge';
import PartnerBadge from '@/components/PartnerBadge';
import PremiumBadge from '@/components/PremiumBadge';
import VerifiedBadge from '@/components/VerifiedBadge';
import VerificationRequiredModal from '@/components/VerificationRequiredModal';
import PremiumRequiredModal from '@/components/PremiumRequiredModal';

interface PublicProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  preferredLocations?: string[];
  isVerified: boolean;
  isAgentVerified?: boolean;
  agentTier?: 'licensed_pro' | 'registered_agent' | 'property_owner' | 'house_owner' | null;
  isPartner?: boolean;
  subscriptionTier?: 'free' | 'premium';
  createdAt: string;
  phone?: string; // Only visible to admins
  email?: string; // Only visible to admins
  stats: {
    listings: number;
  };
}

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    role?: 'user' | 'admin';
  };
  content: string;
  location: string;
  budget: number;
  spotsAvailable: number;
  postType: 'looking-for-roommate' | 'looking-for-place' | 'have-spare-room' | 'announcement';
  images?: string[];
  likesCount: number;
  commentsCount: number;
  interestedCount: number;
  createdAt: string;
}

const usersApi = {
  getPublicProfile: (id: string): Promise<PublicProfile> => {
    return apiClient.get(`/users/${id}`);
  },
  getAdminProfile: (id: string): Promise<PublicProfile> => {
    return apiClient.get(`/users/admin/${id}`);
  },
  getUserPosts: (id: string, page = 1, limit = 10): Promise<{ data: Post[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    return apiClient.get(`/users/${id}/posts?page=${page}&limit=${limit}`);
  },
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated, promptAuth } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const userId = params.id as string;
  const isOwnProfile = currentUser?.id === userId;

  // Fetch profile (admins get full profile with phone number)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        // If admin, use admin endpoint to get full profile including phone
        const isAdmin = currentUser?.role === 'admin';
        const data = isAdmin 
          ? await usersApi.getAdminProfile(userId)
          : await usersApi.getPublicProfile(userId);
        setProfile(data);
      } catch (err) {
        setError('User not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser?.role]);

  // Fetch user's posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) return;

      setPostsLoading(true);
      try {
        const response = await usersApi.getUserPosts(userId);
        setPosts(response.data);
      } catch {
        // Ignore errors for posts
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  const handleMessage = async () => {
    if (!isAuthenticated) {
      promptAuth('Sign in to send messages');
      return;
    }

    // Proactively block unverified users
    if (!currentUser?.isVerified) {
      setShowVerificationModal(true);
      return;
    }

    setMessageLoading(true);
    try {
      // Get or create conversation with this user
      const conversation = await conversationsApi.getOrCreateWithUser(userId);
      // Navigate to chat with this conversation
      router.push(`/chat?conversationId=${conversation.id}`);
    } catch (error: any) {
      const errorCode = error?.code || error?.response?.data?.code;
      if (errorCode === 'VERIFICATION_REQUIRED') {
        setShowVerificationModal(true);
      } else if (errorCode === 'PREMIUM_REQUIRED') {
        setShowPremiumModal(true);
      } else {
        console.error('Failed to start conversation:', error);
      }
    } finally {
      setMessageLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name}'s Profile - LetsGoHalf`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-6">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error || 'User not found'}</p>
        <button onClick={() => router.back()} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Profile
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
            >
              <MoreHorizontal className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-[var(--peach-200)] dark:border-neutral-700 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      handleShare();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Share Profile</span>
                  </button>
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Flag className="w-4 h-4 text-[var(--pink-500)]" />
                    <span className="text-sm text-[var(--pink-500)]">Report User</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pb-24">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5"
        >
          <div className="card-glass p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="w-24 h-24 ring-4 ring-white dark:ring-neutral-700 shadow-lg mb-4">
                <AvatarImage src={resolveImageUrl(profile.avatar)} alt={profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-neutral-800 text-2xl font-bold">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {profile.name}
                </h2>
                {profile.isVerified && (
                  <VerifiedBadge size="lg" />
                )}
                {profile.isAgentVerified && profile.agentTier && (
                  <AgentBadge tier={profile.agentTier} size="lg" />
                )}
                {profile.isPartner && (
                  <PartnerBadge size="lg" />
                )}
                {profile.subscriptionTier === 'premium' && (
                  <PremiumBadge size="lg" />
                )}
              </div>

              {profile.preferredLocations && profile.preferredLocations.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-neutral-500 mb-3">
                  <MapPin className="w-4 h-4 text-[var(--teal-500)]" />
                  {profile.preferredLocations.join(', ')}
                </div>
              )}

              <span className="badge badge-peach text-xs">
                Member since {memberSince}
              </span>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center leading-relaxed mb-6">
                {profile.bio}
              </p>
            )}

            {/* Tags */}
            {profile.occupation && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="badge badge-lime text-xs flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {profile.occupation}
                </span>
              </div>
            )}

            {/* Admin-only: Contact Info */}
            {currentUser?.role === 'admin' && (profile.phone || profile.email) && (
              <div className="mb-6 p-4 rounded-xl bg-[var(--lavender-50)] dark:bg-[var(--lavender-400)]/10 border border-[var(--lavender-200)] dark:border-[var(--lavender-400)]/20">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[var(--lavender-600)] dark:text-[var(--lavender-400)]" />
                  <span className="text-xs font-medium text-[var(--lavender-600)] dark:text-[var(--lavender-400)]">Admin Only</span>
                </div>
                <div className="space-y-2">
                  {profile.phone && (
                    <a 
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-[var(--teal-600)] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[var(--teal-500)]" />
                      {profile.phone}
                    </a>
                  )}
                  {profile.email && (
                    <a 
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-[var(--teal-600)] transition-colors"
                    >
                      <Mail className="w-4 h-4 text-[var(--teal-500)]" />
                      {profile.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-3">
                {isAuthenticated && (
                  <button
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className={cn("btn-secondary flex items-center justify-center gap-2 disabled:opacity-70", posts.length > 0 ? "" : "flex-1")}
                  >
                    {messageLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    {messageLoading ? 'Opening...' : 'Message'}
                  </button>
                )}
                {posts.length > 0 && (
                  <button
                    onClick={() => router.push(`/post/${posts[0].id}`)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Talk to them in thread
                  </button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <button
                onClick={() => router.push('/profile')}
                className="w-full btn-secondary"
              >
                Edit Your Profile
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-5 mb-6"
        >
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'listings', icon: Home, label: 'Listings', value: profile.stats.listings, color: 'peach' },
              { id: 'interested', icon: Heart, label: 'Interested', value: 0, color: 'pink' },
              { id: 'matches', icon: Users, label: 'Matches', value: 0, color: 'lime' },
              { id: 'reviews', icon: Star, label: 'Reviews', value: 0, color: 'lavender' },
            ].map((stat, i) => (
              <div
                key={stat.id}
                className="flex flex-col items-center p-3 rounded-2xl bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                  stat.color === 'peach' && "bg-[var(--peach-200)]",
                  stat.color === 'pink' && "bg-[var(--pink-200)]",
                  stat.color === 'lime' && "bg-[var(--lime-200)]",
                  stat.color === 'lavender' && "bg-[var(--lavender-200)]"
                )}>
                  <stat.icon className="w-5 h-5 text-neutral-700" />
                </div>
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {stat.value}
                </span>
                <span className="text-xs text-neutral-500">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User's Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-5"
        >
          <h3 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
            Listings ({profile.stats.listings})
          </h3>

          {postsLoading ? (
            <div className="card-glass p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    images: post.images || [],
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="card-glass p-8 text-center">
              <Home className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500">No listings yet</p>
            </div>
          )}
        </motion.div>
      </main>

      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onContactSupport={() => {
          setShowVerificationModal(false);
          router.push('/chat?support=true');
        }}
      />

      <PremiumRequiredModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onViewListings={posts.length > 0 ? () => {
          setShowPremiumModal(false);
          router.push(`/post/${posts[0].id}`);
        } : undefined}
        targetUserId={userId}
        targetUserName={profile?.name}
        onChatUnlocked={() => handleMessage()}
      />
    </div>
  );
}
