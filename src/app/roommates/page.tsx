'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Loader2,
  Users,
  Filter,
  MapPin,
  Wallet,
  X,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  List,
  LayoutGrid,
} from 'lucide-react';
import { SwipeableStack } from '@/components/SwipeablePostCard';
import PostCard, { Post as PostCardType } from '@/components/PostCard';
import postsApi, { Post, UserInteractions } from '@/lib/api/posts';
import interestThreadsApi from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

// ─── Budget ranges ───
const budgetRanges = [
  { id: 'any', label: 'Any Budget', min: undefined, max: undefined },
  { id: '1', label: '₦100k - 200k', min: 100000, max: 200000 },
  { id: '2', label: '₦200k - 400k', min: 200000, max: 400000 },
  { id: '3', label: '₦400k - 600k', min: 400000, max: 600000 },
  { id: '4', label: '₦600k+', min: 600000, max: undefined },
];

// ─── Popular areas ───
const popularAreas = [
  'Lekki', 'Victoria Island', 'Ikeja', 'Yaba', 'Surulere',
  'Ajah', 'Ikoyi', 'Gbagada', 'Magodo', 'Maryland',
];

export default function RoommatesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');
  const [showFilters, setShowFilters] = useState(false);
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    likes: [],
    saves: [],
    interests: [],
  });

  // Filters
  const [location, setLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState('any');
  const [showEmptyState, setShowEmptyState] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setShowEmptyState(false);
    try {
      const selectedBudget = budgetRanges.find(b => b.id === budgetRange);
      const response = await postsApi.getPosts({
        postType: 'looking-for-place',
        location: location || undefined,
        budgetMin: selectedBudget?.min,
        budgetMax: selectedBudget?.max,
        limit: 50,
        status: 'active',
      });
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch roommates:', err);
      showToast('Failed to load roommates', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [location, budgetRange, showToast]);

  const fetchInteractions = useCallback(async (postIds: string[]) => {
    if (!isAuthenticated || postIds.length === 0) return;
    try {
      const interactions = await postsApi.getUserInteractions(postIds);
      setUserInteractions(interactions);
    } catch (err) {
      console.error('Failed to fetch interactions:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch interactions when posts change
  useEffect(() => {
    if (posts.length > 0 && isAuthenticated) {
      fetchInteractions(posts.map(p => p.id));
    }
  }, [posts, isAuthenticated, fetchInteractions]);

  const handleSwipeLeft = (post: Post) => {
    // Skip - just move to next
    console.log('Skipped:', post.id);
  };

  const handleSwipeRight = async (post: Post) => {
    // Interested - create thread and navigate
    if (!isAuthenticated) {
      showToast('Sign in to express interest', 'error');
      return;
    }
    
    // Don't express interest in your own posts
    if (post.author?.id === user?.id) {
      showToast("That's your own post!", 'info');
      return;
    }
    
    try {
      const { thread } = await interestThreadsApi.expressInterest(post.id, {});
      setUserInteractions(prev => ({
        ...prev,
        interests: [...prev.interests, post.id],
      }));
      showToast('Interest expressed! 💚', 'success');
      // Navigate to the interest thread
      router.push(`/interest/${thread.id}`);
    } catch (err: any) {
      if (err?.message?.includes('verify')) {
        showToast('Please verify your identity first', 'error');
        router.push('/verification');
      } else {
        showToast(err?.message || 'Failed to express interest', 'error');
      }
    }
  };

  const handleEmpty = () => {
    setShowEmptyState(true);
  };

  const handleRefresh = () => {
    fetchPosts();
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchPosts();
  };

  const clearFilters = () => {
    setLocation('');
    setBudgetRange('any');
    setShowFilters(false);
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--lavender-500)]" />
                Roommates Needed
              </h1>
              <p className="text-xs text-neutral-500">
                {posts.length} {posts.length === 1 ? 'person' : 'people'} looking for a place
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
              <button
                onClick={() => setViewMode('swipe')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'swipe' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm' 
                    : 'text-neutral-500'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm' 
                    : 'text-neutral-500'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                (location || budgetRange !== 'any')
                  ? 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-500)]/20 text-[var(--lavender-600)]'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[var(--lavender-500)] animate-spin mb-4" />
            <p className="text-neutral-500">Finding roommates...</p>
          </div>
        ) : posts.length === 0 || showEmptyState ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-[var(--lavender-100)] dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-[var(--lavender-400)]" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {showEmptyState ? "You've seen them all!" : 'No roommates found'}
            </h2>
            <p className="text-neutral-500 mb-6">
              {showEmptyState
                ? 'Check back later for new roommates'
                : 'Try adjusting your filters or check back later'}
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[var(--lavender-400)] to-[var(--pink-400)] text-white font-semibold flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        ) : viewMode === 'swipe' ? (
          <SwipeableStack
            posts={posts}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onEmpty={handleEmpty}
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post as PostCardType}
                isLiked={userInteractions.likes.includes(post.id)}
                isSaved={userInteractions.saves.includes(post.id)}
                isInterested={userInteractions.interests.includes(post.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Filter Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Filters
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--lavender-500)] font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter area or neighborhood"
                    className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {popularAreas.slice(0, 6).map((area) => (
                      <button
                        key={area}
                        onClick={() => setLocation(area)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                          location === area
                            ? 'bg-[var(--lavender-400)] text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    <Wallet className="w-4 h-4 inline mr-2" />
                    Budget Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {budgetRanges.map((range) => (
                      <button
                        key={range.id}
                        onClick={() => setBudgetRange(range.id)}
                        className={cn(
                          'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                          budgetRange === range.id
                            ? 'bg-[var(--lavender-400)] text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-neutral-900 p-5 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={applyFilters}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--lavender-400)] to-[var(--pink-400)] text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
