'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Building2,
  Bed,
  Filter,
  Loader2,
  RefreshCw,
  ChevronDown,
  MapPin,
  SlidersHorizontal,
  Repeat2,
  ShoppingBasket,
  Car,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostCard, { Post as PostCardType } from '@/components/PostCard';
import postsApi, { Post, UserInteractions } from '@/lib/api/posts';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Category configuration
const categoryConfig: Record<string, {
  id: string;
  icon: any;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  iconBg: string;
}> = {
  'looking-for-roommate': {
    id: 'looking-for-roommate',
    icon: Users,
    label: 'Looking for Roommate',
    shortLabel: 'Roommates',
    description: 'People who have a place and are looking for someone to share it with',
    color: 'peach',
    iconBg: 'bg-[var(--peach-200)]',
  },
  'looking-for-place': {
    id: 'looking-for-place',
    icon: Building2,
    label: 'Looking for Place',
    shortLabel: 'Places',
    description: 'People who need a place to stay and are open to sharing',
    color: 'lavender',
    iconBg: 'bg-[var(--lavender-200)]',
  },
  'have-spare-room': {
    id: 'have-spare-room',
    icon: Bed,
    label: 'Have Spare Room',
    shortLabel: 'Spare Rooms',
    description: 'People who have an extra room available for rent',
    color: 'lime',
    iconBg: 'bg-[var(--lime-200)]',
  },
  'subscription-split': {
    id: 'subscription-split',
    icon: Repeat2,
    label: 'Subscription Splits',
    shortLabel: 'Subscriptions',
    description: 'Split Netflix, Spotify, and other subscriptions with others',
    color: 'violet',
    iconBg: 'bg-violet-200 dark:bg-violet-500/20',
  },
  'grocery-split': {
    id: 'grocery-split',
    icon: ShoppingBasket,
    label: 'Grocery Splits',
    shortLabel: 'Groceries',
    description: 'Split bulk buys like food, livestock, and household items',
    color: 'green',
    iconBg: 'bg-green-200 dark:bg-green-500/20',
  },
  'carpool': {
    id: 'carpool',
    icon: Car,
    label: 'Carpool',
    shortLabel: 'Rides',
    description: 'Find or offer rides and share travel costs',
    color: 'sky',
    iconBg: 'bg-sky-200 dark:bg-sky-500/20',
  },
};

// Sort options
const sortOptions = [
  { id: 'newest', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'DESC' as const },
  { id: 'oldest', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'ASC' as const },
  { id: 'budget-low', label: 'Budget: Low to High', sortBy: 'budget', sortOrder: 'ASC' as const },
  { id: 'budget-high', label: 'Budget: High to Low', sortBy: 'budget', sortOrder: 'DESC' as const },
  { id: 'popular', label: 'Most Popular', sortBy: 'likesCount', sortOrder: 'DESC' as const },
];

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const slug = params.slug as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    likes: [],
    saves: [],
    interests: [],
  });
  const [totalPosts, setTotalPosts] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeSort, setActiveSort] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');

  const category = categoryConfig[slug];

  const fetchPosts = useCallback(async (pageNum: number, reset = false) => {
    if (!category) return;

    setIsLoading(true);
    setError(null);

    try {
      const sortOption = sortOptions.find(s => s.id === activeSort) || sortOptions[0];

      // Carpool category needs to fetch both carpool-offer and carpool-request
      const postTypes: string[] = slug === 'carpool'
        ? ['carpool-offer', 'carpool-request']
        : [category.id];

      const responses = await Promise.all(
        postTypes.map(pt =>
          postsApi.getPosts({
            postType: pt as any,
            page: pageNum,
            limit: slug === 'carpool' ? 10 : 10,
            sortBy: sortOption.sortBy as any,
            sortOrder: sortOption.sortOrder,
          })
        )
      );

      // Merge and sort results
      const allData = responses.flatMap(r => r.data);
      const totalCount = responses.reduce((sum, r) => sum + r.meta.total, 0);

      // Sort merged results according to the active sort
      allData.sort((a, b) => {
        const field = sortOption.sortBy as keyof Post;
        const aVal = a[field] as any;
        const bVal = b[field] as any;
        const order = sortOption.sortOrder === 'DESC' ? -1 : 1;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });

      if (reset) {
        setPosts(allData);
      } else {
        setPosts(prev => [...prev, ...allData]);
      }

      setTotalPosts(totalCount);
      setHasMore(allData.length >= 10 && (reset ? allData.length : posts.length + allData.length) < totalCount);

      // Fetch user interactions if authenticated
      if (isAuthenticated && allData.length > 0) {
        try {
          const postIds = allData.map(p => p.id);
          const interactions = await postsApi.getUserInteractions(postIds);
          setUserInteractions(prev => ({
            likes: [...new Set([...prev.likes, ...interactions.likes])],
            saves: [...new Set([...prev.saves, ...interactions.saves])],
            interests: [...new Set([...prev.interests, ...interactions.interests])],
          }));
        } catch {
          // Ignore interaction errors
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [category, slug, activeSort, isAuthenticated]);

  useEffect(() => {
    if (category) {
      setPage(1);
      setPosts([]);
      fetchPosts(1, true);
    }
  }, [category, activeSort]);

  const handleRefresh = () => {
    setPage(1);
    setPosts([]);
    fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handleSortChange = (sortId: string) => {
    setActiveSort(sortId);
    setShowSortDropdown(false);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-6">
        <p className="text-neutral-600 mb-4">Category not found</p>
        <button onClick={() => router.push('/categories')} className="btn-primary">
          Browse Categories
        </button>
      </div>
    );
  }

  const CategoryIcon = category.icon;

  const formattedPosts: PostCardType[] = posts.map(post => ({
    id: post.id,
    author: {
      id: post.author?.id || (post as any).authorId,
      name: post.author?.name || 'Unknown',
      avatar: post.author?.avatar,
      isVerified: post.author?.isVerified || false,
      role: post.author?.role,
    },
    content: post.content,
    location: post.location,
    budget: post.budget,
    spotsAvailable: post.spotsAvailable,
    postType: post.postType,
    images: post.images,
    video: post.video,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    interestedCount: post.interestedCount,
    createdAt: post.createdAt,
    isLiked: userInteractions.likes.includes(post.id),
    isSaved: userInteractions.saves.includes(post.id),
    isInterested: userInteractions.interests.includes(post.id),
  }));

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 px-5 py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {category.label}
            </h1>
            <p className="text-xs text-neutral-500">{totalPosts} posts</p>
          </div>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className={`w-12 h-12 rounded-xl ${category.iconBg} flex items-center justify-center`}>
              <CategoryIcon className="w-6 h-6 text-neutral-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {category.label}
              </h1>
              <p className="text-neutral-500 text-sm">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-sm font-medium text-[var(--lime-700)] dark:text-[var(--lime-400)]">
              {totalPosts} posts
            </span>
          </div>
        </div>
      </header>

      <div className="content-container px-5 py-6 lg:px-0">
        <div className="max-w-2xl mx-auto lg:max-w-none">
          {/* Category Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass p-5 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${category.iconBg} flex items-center justify-center lg:hidden`}>
                <CategoryIcon className="w-7 h-7 text-neutral-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 lg:hidden mb-2">
                  {category.description}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      <Filter className="w-4 h-4" />
                      {sortOptions.find(s => s.id === activeSort)?.label}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", showSortDropdown && "rotate-180")} />
                    </button>

                    {showSortDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowSortDropdown(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
                          {sortOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleSortChange(option.id)}
                              className={cn(
                                "w-full px-4 py-3 text-left text-sm transition-colors",
                                activeSort === option.id
                                  ? "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 text-[var(--teal-700)] dark:text-[var(--teal-400)] font-medium"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Posts List */}
          {error && posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : isLoading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : formattedPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-2xl ${category.iconBg} flex items-center justify-center mx-auto mb-4`}>
                <CategoryIcon className="w-8 h-8 text-neutral-500" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                {slug === 'subscription-split' ? 'No subscription splits listed yet'
                  : slug === 'grocery-split' ? 'No grocery splits listed yet'
                  : slug === 'carpool' ? 'No carpool rides listed yet'
                  : 'No posts in this category yet'}
              </p>
              <p className="text-sm text-neutral-500 mb-4">Be the first to create one!</p>
              <button
                onClick={() => router.push(
                  slug === 'subscription-split' ? '/create?type=subscription-split'
                    : slug === 'grocery-split' ? '/create?type=grocery-split'
                    : slug === 'carpool' ? '/create?type=carpool-offer'
                    : '/create'
                )}
                className="btn-primary"
              >
                {slug === 'subscription-split' ? 'Split a Subscription'
                  : slug === 'grocery-split' ? 'Split Groceries'
                  : slug === 'carpool' ? 'Offer a Ride'
                  : 'Create Post'}
              </button>
            </div>
          ) : (
            <>
              <div className="posts-grid space-y-4">
                {formattedPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="btn-secondary flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
