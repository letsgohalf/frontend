'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  ChevronRight,
  X,
  Home,
  Building2,
  Bed,
  Filter,
  TrendingUp,
  Sparkles,
  Loader2,
  Eye,
  Heart,
  Flame,
  ArrowUpDown,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostCard, { Post as PostCardType } from '@/components/PostCard';
import postsApi, { Post, PostsQuery, UserInteractions } from '@/lib/api/posts';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import AreaInsights from '@/components/AreaInsights';
import SharedHeader from '@/components/SharedHeader';
import { usePremium } from '@/contexts/PremiumContext';

// ─── Post type tabs ───
const searchTabs = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'looking-for-roommate', label: 'Roommates', icon: Users },
  { id: 'looking-for-place', label: 'Places', icon: Building2 },
  { id: 'have-spare-room', label: 'Rooms', icon: Bed },
];

// ─── Sort options ───
const sortOptions = [
  { id: 'createdAt', label: 'Newest', icon: Sparkles },
  { id: 'likesCount', label: 'Most Liked', icon: Heart },
  { id: 'viewsCount', label: 'Most Viewed', icon: Eye },
  { id: 'interestedCount', label: 'Most Wanted', icon: Flame },
];

// ─── Budget ranges ───
const budgetRanges = [
  { id: '1', label: '₦100k - 200k', min: 100000, max: 200000 },
  { id: '2', label: '₦200k - 400k', min: 200000, max: 400000 },
  { id: '3', label: '₦400k - 600k', min: 400000, max: 600000 },
  { id: '4', label: '₦600k+', min: 600000, max: undefined },
];

// ─── Popular areas (used for quick-select in location search) ───
const popularAreas = [
  'Lekki', 'Victoria Island', 'Ikeja', 'Yaba', 'Surulere',
  'Ajah', 'Ikoyi', 'Gbagada', 'Magodo', 'Maryland',
];

// ─── Format currency ───
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

// ─── Web Header ───
function WebHeader({
  searchType,
  setSearchType,
  sortBy,
  setSortBy,
}: {
  searchType: string;
  setSearchType: (t: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}) {
  return (
    <header className="header-web">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Explore</h1>
          <p className="text-neutral-500 mt-1">Find your perfect roommate or place</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Post type tabs */}
        <div className="tabs-pill inline-flex">
          {searchTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchType(tab.id)}
              className={`tab-item flex items-center gap-2 ${searchType === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-neutral-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-transparent border border-[var(--peach-200)] dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-700 dark:text-neutral-300 outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Header ───
function MobileHeader({
  searchType,
  setSearchType,
}: {
  searchType: string;
  setSearchType: (t: string) => void;
}) {
  return (
    <header className="header-mobile px-5 pt-4 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-neutral-500 mb-1">Discover</p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Explore</h1>
        </div>
      </div>

      {/* Search Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
        {searchTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchType(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              searchType === tab.id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─── Right Sidebar ───
function RightSidebar({
  trendingPosts,
  trendingLoading,
}: {
  trendingPosts: Post[];
  trendingLoading: boolean;
}) {
  const router = useRouter();

  return (
    <aside className="right-sidebar">
      {/* Community Insights */}
      <div className="mb-6">
        <AreaInsights />
      </div>

      {/* Quick Tips */}
      <div className="card-glass p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--yellow-500)]" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Quick Tips</h3>
        </div>
        <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>Be specific about your location preferences</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--peach-100)] dark:bg-[var(--peach-500)]/10 text-[var(--peach-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Set a realistic budget range for better matches</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-[var(--lavender-500)] flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Check profiles thoroughly before connecting</span>
          </li>
        </ul>
      </div>

      {/* Trending Posts */}
      <div className="card-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--pink-400)]" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Trending Now</h3>
        </div>
        {trendingLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : trendingPosts.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">No trending posts yet</p>
        ) : (
          <div className="space-y-3">
            {trendingPosts.slice(0, 5).map((post, i) => (
              <button
                key={post.id}
                onClick={() => router.push(`/post/${post.id}`)}
                className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-500)] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2">
                    {post.content.slice(0, 80)}{post.content.length > 80 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    {post.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {post.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likesCount ?? 0}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Main Page ───
export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const { premiumEnabled } = usePremium();

  const [activeTab, setActiveTab] = useState('search');
  const [searchType, setSearchType] = useState('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({ likes: [], saves: [], interests: [] });
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Build query from current filters
  const buildQuery = useCallback((): PostsQuery => {
    const query: PostsQuery = {
      page,
      limit: 10,
      sortBy: sortBy as PostsQuery['sortBy'],
      sortOrder: 'DESC',
    };

    if (searchType !== 'all') {
      query.postType = searchType as Post['postType'];
    }

    if (selectedLocation) {
      query.location = selectedLocation;
    }

    if (selectedBudget) {
      const range = budgetRanges.find((b) => b.id === selectedBudget);
      if (range) {
        query.budgetMin = range.min;
        if (range.max) query.budgetMax = range.max;
      }
    }

    if (searchQuery.trim()) {
      query.search = searchQuery.trim();
    }

    // Add viewer location for distance calc if available
    if (user?.homeLatitude && user?.homeLongitude) {
      query.viewerLat = user.homeLatitude;
      query.viewerLng = user.homeLongitude;
    }

    if (verifiedOnly) {
      query.verifiedOnly = 'true';
    }

    // Pass viewer identity and platform for premium filter enforcement
    if (user?.id) {
      query.viewerId = user.id;
    }
    query.platform = 'web';

    return query;
  }, [page, sortBy, searchType, selectedLocation, selectedBudget, searchQuery, user, verifiedOnly]);

  // Fetch posts
  const fetchPosts = useCallback(async (resetPage = false) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const query = { ...buildQuery(), page: currentPage };
      const result = await postsApi.getPosts(query);
      setPosts(result.data);
      setTotalPages(result.meta.totalPages);
      setHasSearched(true);

      // Fetch interactions if logged in
      if (isAuthenticated && result.data.length > 0) {
        try {
          const postIds = result.data.map((p) => p.id);
          const interactions = await postsApi.getUserInteractions(postIds);
          setUserInteractions(interactions);
        } catch {
          // Ignore interaction fetch errors
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page, isAuthenticated]);

  // Fetch trending posts (most liked)
  const fetchTrending = useCallback(async () => {
    setTrendingLoading(true);
    try {
      const result = await postsApi.getPosts({
        limit: 5,
        sortBy: 'likesCount',
        sortOrder: 'DESC',
      });
      setTrendingPosts(result.data);
    } catch {
      // Ignore
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
    fetchTrending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change (except page)
  useEffect(() => {
    fetchPosts(true);
  }, [searchType, sortBy, selectedLocation, selectedBudget]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when page changes (but not on first load)
  useEffect(() => {
    if (hasSearched && page > 1) {
      fetchPosts();
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search handler
  const handleSearch = () => {
    fetchPosts(true);
  };

  // Format posts for PostCard
  const formattedPosts: PostCardType[] = posts.map((post) => ({
    id: post.id,
    author: {
      id: post.author?.id || '',
      name: post.author?.name || 'Unknown',
      avatar: post.author?.avatar,
      isVerified: post.author?.isVerified || false,
      role: post.author?.role,
      subscriptionTier: post.author?.subscriptionTier,
    },
    content: post.content,
    location: post.location,
    latitude: post.latitude,
    longitude: post.longitude,
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
    isBoosted: post.isBoosted,
    boostedAt: post.boostedAt,
    boostExpiresAt: post.boostExpiresAt,
  }));

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <SharedHeader>
        {/* Mobile Header */}
        <MobileHeader searchType={searchType} setSearchType={setSearchType} />

        {/* Web Header */}
        <WebHeader
          searchType={searchType}
          setSearchType={setSearchType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </SharedHeader>

      <div className="content-container">
        <div className="three-column-layout">
          {/* Main Content */}
          <div className="main-feed">
            {/* Search & Filters Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 lg:px-0 mb-6"
            >
              <div className="card-glass p-5">
                {/* Location Search */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-neutral-500 mb-2 block">
                    Where are you looking?
                  </label>
                  <div className="search-input">
                    <button
                      onClick={() => setShowSearchSheet(true)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <MapPin className="w-5 h-5 text-[var(--teal-500)]" />
                      <span className={selectedLocation ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-400'}>
                        {selectedLocation || 'Search locations...'}
                      </span>
                    </button>
                    {selectedLocation && (
                      <button
                        onClick={() => setSelectedLocation(null)}
                        className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <X className="w-4 h-4 text-neutral-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile sort */}
                <div className="mb-5 lg:hidden">
                  <label className="text-sm font-medium text-neutral-500 mb-3 block">Sort By</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`filter-chip py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${sortBy === opt.id ? 'selected' : ''}`}
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Filters (premium feature): Budget Range + Verified Only */}
                {premiumEnabled && <div className="mb-5">
                  <label className="text-sm font-medium text-neutral-500 mb-3 block">Advanced Filters</label>

                  {/* Budget Range */}
                  <div className="mb-3">
                    <p className="text-xs text-neutral-400 mb-2">Budget Range</p>
                    <div className="grid grid-cols-2 gap-2">
                      {budgetRanges.map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setSelectedBudget(range.id === selectedBudget ? null : range.id)}
                          className={`filter-chip py-3 px-4 rounded-xl ${selectedBudget === range.id ? 'selected' : ''}`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verified Users Only */}
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-full filter-chip py-3 px-4 rounded-xl flex items-center justify-between gap-2 ${verifiedOnly ? 'selected' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Verified Users Only
                    </span>
                    <div className={`w-9 h-5 rounded-full transition-colors ${verifiedOnly ? 'bg-[var(--teal-500)]' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${verifiedOnly ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                </div>}

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Search
                </button>

                {/* Active filters summary */}
                {(selectedLocation || selectedBudget || searchType !== 'all') && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedLocation && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 text-[var(--teal-700)] dark:text-[var(--teal-400)] text-xs font-medium">
                        <MapPin className="w-3 h-3" />
                        {selectedLocation}
                        <button onClick={() => setSelectedLocation(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {selectedBudget && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-700)] dark:text-[var(--lime-400)] text-xs font-medium">
                        {budgetRanges.find((b) => b.id === selectedBudget)?.label}
                        <button onClick={() => setSelectedBudget(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {searchType !== 'all' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-[var(--lavender-500)] text-xs font-medium">
                        {searchTabs.find((t) => t.id === searchType)?.label}
                        <button onClick={() => setSearchType('all')}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Results */}
            <div className="px-5 lg:px-0 mb-6">
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {loading ? 'Searching...' : hasSearched ? `Results` : 'Latest Listings'}
                </h3>
                {!loading && hasSearched && (
                  <span className="text-sm text-neutral-500">
                    Page {page} of {totalPages}
                  </span>
                )}
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)] mb-3" />
                  <p className="text-sm text-neutral-500">Finding listings for you...</p>
                </div>
              ) : formattedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">No listings found</h4>
                  <p className="text-sm text-neutral-500 mb-4">Try adjusting your filters or search in a different area.</p>
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setSelectedBudget(null);
                      setSearchType('all');
                      setSearchQuery('');
                    }}
                    className="btn-secondary text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {formattedPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-neutral-500">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <RightSidebar trendingPosts={trendingPosts} trendingLoading={trendingLoading} />
        </div>
      </div>

      {/* Location Search Sheet Modal */}
      <AnimatePresence>
        {showSearchSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchSheet(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Search Location</h3>
                  <button
                    onClick={() => setShowSearchSheet(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>

                <div className="search-input mb-6">
                  <Search className="w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    className="flex-1 bg-transparent outline-none text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setSelectedLocation(searchQuery.trim());
                        setShowSearchSheet(false);
                        setSearchQuery('');
                      }
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                    </button>
                  )}
                </div>

                {/* Use typed query if present, otherwise show popular areas */}
                {searchQuery.trim() ? (
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-3">Press Enter to search for &quot;{searchQuery}&quot;</p>
                    {/* Show matching popular areas */}
                    {popularAreas
                      .filter((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((area) => (
                        <button
                          key={area}
                          onClick={() => {
                            setSelectedLocation(area);
                            setShowSearchSheet(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800 transition-colors"
                        >
                          <MapPin className="w-5 h-5 text-[var(--teal-500)]" />
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">{area}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-neutral-500 mb-3">Popular areas</p>
                    <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                      {popularAreas.map((area) => (
                        <button
                          key={area}
                          onClick={() => {
                            setSelectedLocation(area);
                            setShowSearchSheet(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800 transition-colors"
                        >
                          <MapPin className="w-5 h-5 text-[var(--teal-500)]" />
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">{area}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
