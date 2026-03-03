'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Filter,
  MapPin,
  Bed,
  Users,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  ChevronRight,
  Loader2,
  RefreshCw,
  TrendingUp,
  Home,
  Heart,
  Repeat2,
  PenLine,
  Building2,
  Handshake,
  X,
  Car,
  Navigation,
  ShoppingBasket,
} from 'lucide-react';
import Link from 'next/link';
import PostCard, { Post as PostCardType } from '@/components/PostCard';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import postsApi, { Post, PostsQuery, UserInteractions } from '@/lib/api/posts';
import usersApi from '@/lib/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EngagementCard, useEngagementCards } from '@/components/EngagementCards';
import RecommendationCard, { useDismissedRecommendations } from '@/components/RecommendationCard';
import AreaInsights from '@/components/AreaInsights';
import SharedHeader from '@/components/SharedHeader';
import { playSound } from '@/lib/sounds';

// Category data
const categories = [
  { id: 'roommate', icon: Users, label: 'Roommate', color: 'peach', postType: 'looking-for-roommate' },
  { id: 'place', icon: Bed, label: 'Place', color: 'pink', postType: 'looking-for-place' },
  { id: 'spare', icon: MapPin, label: 'Spare Room', color: 'lavender', postType: 'have-spare-room' },
  { id: 'subscription', icon: Repeat2, label: 'Subscriptions', color: 'violet', postType: 'subscription-split' },
  { id: 'carpool', icon: Car, label: 'Carpool', color: 'sky', postType: 'carpool' },
  { id: 'featured', icon: Sparkles, label: 'Featured', color: 'lime', postType: null },
];

// Filter tabs
const filterTabs = [
  { id: 'all', label: 'All', sortBy: 'createdAt' },
  { id: 'nearby', label: 'Nearby', sortBy: 'createdAt' },
  { id: 'popular', label: 'Popular', sortBy: 'likesCount' },
  { id: 'new', label: 'New', sortBy: 'createdAt' },
];

// Avatar data for stack
const recentUsers = [
  { id: '1', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: '2', name: 'Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: '3', name: 'Adaeze', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop' },
  { id: '4', name: 'Ada', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
];

// Trending topics for right sidebar
const trendingTopics = [
  { id: '1', title: 'Roommates', posts: '245 listings' },
  { id: '2', title: 'Subscriptions', posts: '189 listings' },
  { id: '3', title: 'Carpooling', posts: '156 listings' },
  { id: '4', title: 'Groceries', posts: '98 listings' },
];

// Mobile Header
const MobileHeader = () => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="header-mobile">
      <div className="greeting">
        <Link href="/profile" className="block">
          <Avatar className="w-11 h-11 ring-2 ring-white shadow-md cursor-pointer hover:ring-[var(--teal-400)] transition-all">
            <AvatarImage src={user?.avatar || "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop"} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] font-semibold">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="greeting-text">
          <span className="greeting-label">{getGreeting()}</span>
          <span className="greeting-name">{user?.name?.split(' ')[0] || 'there'}!</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-105"
        >
          {theme === 'daylight' ? (
            <Moon className="w-5 h-5 text-neutral-600" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>
        <button
          onClick={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm relative transition-all hover:scale-105"
        >
          <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--teal-500)] rounded-full border-2 border-white dark:border-neutral-800" />
        </button>
      </div>
    </header>
  );
};

// Web Header
const WebHeader = () => {
  const router = useRouter();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="header-web">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-neutral-500">Find your perfect match
        to split bills or cost</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm relative transition-all hover:scale-105"
        >
          <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[var(--teal-500)] rounded-full border-2 border-white dark:border-neutral-800" />
        </button>
      </div>
    </header>
  );
};

// Popular search suggestions with filter values
const searchSuggestions = [
  { label: 'Under $500', type: 'budget', budgetMax: 500 },
  { label: 'Under $1,000', type: 'budget', budgetMax: 1000 },
  { label: '$1,000 - $2,000', type: 'budget', budgetMin: 1000, budgetMax: 2000 },
  { label: 'Above $2,000', type: 'budget', budgetMin: 2000 },
  { label: 'Looking for roommate', type: 'postType', postType: 'looking-for-roommate' as const },
  { label: 'Looking for place', type: 'postType', postType: 'looking-for-place' as const },
  { label: 'Spare room available', type: 'postType', postType: 'have-spare-room' as const },
  { label: 'Subscriptions', type: 'postType', postType: 'subscription-split' as const },
  { label: 'Carpool', type: 'postType', postType: 'carpool-offer' as const },
];

// Filter state type
interface FilterState {
  search?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  postType?: Post['postType'];
}

// Format currency helper
const formatBudget = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

// Search Bar with live results and filters
const SearchBar = ({ onSearch, onFilterChange }: { 
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.length >= 2) {
      setIsSearching(true);
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await postsApi.getPosts({ search: query, limit: 5 });
          setSearchResults(response.data || []);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSearch = () => {
    onSearch(query);
    setShowDropdown(false);
  };

  const handleSuggestionClick = (suggestion: typeof searchSuggestions[0]) => {
    // Handle different suggestion types
    const newFilters: FilterState = {};
    
    if (suggestion.type === 'location' && 'value' in suggestion && suggestion.value) {
      newFilters.location = suggestion.value as string;
      setQuery(suggestion.value as string);
    } else if (suggestion.type === 'budget') {
      if ('budgetMin' in suggestion && suggestion.budgetMin) newFilters.budgetMin = suggestion.budgetMin;
      if ('budgetMax' in suggestion && suggestion.budgetMax) newFilters.budgetMax = suggestion.budgetMax;
      setQuery('');
    } else if (suggestion.type === 'postType' && 'postType' in suggestion && suggestion.postType) {
      newFilters.postType = suggestion.postType;
      setQuery('');
    }
    
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
    onFilterChange({ ...activeFilters, ...newFilters });
    setShowDropdown(false);
  };

  const handleResultClick = (postId: string) => {
    setShowDropdown(false);
    router.push(`/post/${postId}`);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setQuery('');
    onFilterChange({});
    onSearch('');
  };

  const activeFilterCount = Object.keys(activeFilters).filter(k => activeFilters[k as keyof FilterState] !== undefined).length;

  const filteredSuggestions = query.length > 0
    ? searchSuggestions.filter(s => 
        s.label.toLowerCase().includes(query.toLowerCase())
      )
    : searchSuggestions;

  return (
    <div className="px-5 lg:px-0 mb-6 relative">
      <div className={`search-input transition-all ${isFocused ? 'ring-2 ring-[var(--lime-400)]' : ''}`}>
        <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Try: Roommate, $500 budget, Subscription split..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding to allow click on results
            setTimeout(() => setShowDropdown(false), 250);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-neutral-100"
        />
        {isSearching && (
          <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
        )}
        {query && !isSearching && (
          <button
            onClick={() => {
              setQuery('');
              onSearch('');
              setSearchResults([]);
            }}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <span className="text-neutral-400 text-sm">✕</span>
          </button>
        )}
        <button
          onClick={handleSearch}
          className="p-2 rounded-lg bg-gradient-to-r from-[var(--lime-300)] to-[var(--yellow-300)] shadow-sm hover:shadow-md transition-shadow"
        >
          <Filter className="w-4 h-4 text-neutral-900" />
        </button>
      </div>

      {/* Floating Dropdown */}
      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-5 right-5 lg:left-0 lg:right-0 top-full mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-[var(--peach-200)] dark:border-neutral-700 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
        >
          {/* Live Search Results */}
          {query.length >= 2 && (
            <div className="border-b border-[var(--peach-100)] dark:border-neutral-700">
              <div className="px-4 py-2 bg-[var(--peach-50)] dark:bg-neutral-700/50">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {isSearching ? 'Searching...' : `Results for "${query}"`}
                </p>
              </div>
              
              {isSearching ? (
                <div className="p-4 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-700">
                  {searchResults.map((post) => (
                    <button
                      key={post.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleResultClick(post.id);
                      }}
                      className="w-full p-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700/50 transition-colors text-left flex gap-3 touch-manipulation"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2">
                          {post.content.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {post.location && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {post.location}
                            </span>
                          )}
                          {post.budget > 0 && (
                            <span className="text-xs text-[var(--lime-600)] dark:text-[var(--lime-400)] font-medium">
                              {formatBudget(post.budget)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No listings found for "{query}"
                  </p>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  className="w-full p-3 text-center text-sm font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700/50 transition-colors touch-manipulation"
                >
                  See all results for "{query}" →
                </button>
              )}
            </div>
          )}

          {/* Suggestions by Category */}
          <div className="p-3">
            {/* Budget */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 px-2">💰 Budget</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {searchSuggestions.filter(s => s.type === 'budget').map((suggestion, index) => (
                <button
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 touch-manipulation bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/20 text-[var(--lime-600)] dark:text-[var(--lime-300)]"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>

            {/* Post Type */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 px-2">🏠 Listing Type</p>
            <div className="flex flex-wrap gap-2">
              {searchSuggestions.filter(s => s.type === 'postType').map((suggestion, index) => (
                <button
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 touch-manipulation bg-[var(--lavender-100)] dark:bg-[var(--lavender-500)]/20 text-[var(--lavender-600)] dark:text-[var(--lavender-300)]"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="px-5 py-3 bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/10 border-t border-[var(--peach-100)] dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  <span className="font-medium">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</span> active
                </p>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearFilters();
                  }}
                  className="text-xs text-[var(--pink-500)] font-medium hover:underline touch-manipulation"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
          
          {/* Quick tip */}
          {activeFilterCount === 0 && (
            <div className="px-5 py-3 bg-[var(--peach-50)] dark:bg-neutral-700/50 border-t border-[var(--peach-100)] dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                💡 <span className="font-medium">Tip:</span> Click any filter to narrow down results
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Spotlight overlay menu items
const spotlightItems = [
  {
    label: 'Make a Post',
    description: 'Create a general post to find roommates, list your space, or share an announcement with the community.',
    icon: PenLine,
    route: '/create',
    color: 'text-neutral-700 dark:text-neutral-300',
    bg: 'bg-[var(--peach-100)] dark:bg-neutral-800',
    border: 'border-neutral-200 dark:border-neutral-700',
  },
  {
    label: 'House for Rent/Sale',
    description: 'List your apartment or flat for rent or sale. Reach thousands of people actively searching.',
    icon: Building2,
    route: '/create?type=house-listing',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/20',
  },
  {
    label: 'I Need a Roommate',
    description: 'Find a compatible roommate to share your space with. Set your budget, location, and preferences.',
    icon: Users,
    route: '/create?type=looking-for-roommate',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
  },
  {
    label: 'Split a Subscription',
    description: 'Share Netflix, Spotify, YouTube Premium and more. Save money by splitting costs with verified users.',
    icon: Repeat2,
    route: '/create?type=subscription-split',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-violet-100 dark:bg-violet-500/10',
    border: 'border-purple-200 dark:border-purple-500/20',
  },
  {
    label: 'Split Groceries',
    description: 'Buy food, livestock, or bulk items together. Split the cost and save more with people near you.',
    icon: ShoppingBasket,
    route: '/create?type=grocery-split',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-500/10',
    border: 'border-green-200 dark:border-green-500/20',
  },
  {
    label: 'Offer a Ride',
    description: 'Share your car ride with others going the same way. Set your route, seats, and price per seat.',
    icon: Car,
    route: '/carpool/offer',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-500/10',
    border: 'border-sky-200 dark:border-sky-500/20',
  },
  {
    label: 'Find a Ride',
    description: "Need a ride? Find drivers heading your way and share the cost of the trip.",
    icon: Navigation,
    route: '/carpool/find',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
  {
    label: 'Become a Partner',
    description: 'Know people with spaces or services to share? Bring them to LetsGoHalf and earn commissions on every successful match.',
    icon: Handshake,
    route: '/become-partner',
    color: 'text-[var(--teal-600)] dark:text-[var(--teal-400)]',
    bg: 'bg-teal-100 dark:bg-teal-500/10',
    border: 'border-teal-200 dark:border-teal-500/20',
  },
];

// Spotlight Overlay
const SpotlightOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();

  const handleItemClick = (route: string) => {
    onClose();
    if (!isAuthenticated && route !== '/become-partner') {
      promptAuth('Sign in to create a post and find your perfect match');
      return;
    }
    router.push(route);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain flex items-start justify-center pt-[5vh] px-4 pb-8"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">What would you like to do?</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Cards — 2-column grid */}
            <div className="grid grid-cols-2 gap-3">
              {spotlightItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={() => handleItemClick(item.route)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-neutral-900 border ${item.border} hover:shadow-lg transition-all text-center group`}
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-0.5">
                      {item.label}
                    </h3>
                    <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hero Card
const HeroCard = () => {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [showSpotlight, setShowSpotlight] = useState(false);

  const handleGetStarted = () => {
    playSound('click');
    if (!isAuthenticated) {
      promptAuth('Sign in to create a post and find your perfect match');
      return;
    }
    router.push('/create');
  };

  return (
  <>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="mx-5 lg:mx-0 mb-6"
  >
    <div className="card-featured relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 dark:bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/15 dark:bg-white/5" />

      <div className="relative z-10">
        <span className="badge badge-new mb-3">New</span>

        <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Find your perfect match<br />
          to split bills or cost
        </h2>

        <p className="text-sm text-neutral-700 dark:text-neutral-200 mb-4 max-w-[70%]">
          Join thousands of people sharing spaces and splitting costs
        </p>

        <div className="flex items-center justify-between">
          <div className="avatar-stack">
            {recentUsers.map((user) => (
              <Avatar key={user.id} className="w-10 h-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            ))}
            <div className="avatar-count">+8k</div>
          </div>

          <button
            onClick={handleGetStarted}
            className="btn-primary py-3 px-5 text-sm flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </motion.div>

  <SpotlightOverlay isOpen={showSpotlight} onClose={() => setShowSpotlight(false)} />
  </>
  );
};

// Swipe Discovery Cards
const SwipeDiscoveryCards = () => (
  <div id="discover-section" className="px-5 lg:px-0 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
        Discover
      </h3>
      <span className="text-xs text-neutral-500">Swipe to explore</span>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {/* Available Listings Card */}
      <Link href="/listings">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] p-4 h-36 hover:scale-[1.02] transition-transform cursor-pointer group"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">Available Listings</h4>
              <p className="text-[11px] text-white/80">Places looking for you</p>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      </Link>

      {/* Roommates Needed Card */}
      <Link href="/roommates">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--lavender-400)] to-[var(--pink-400)] p-4 h-36 hover:scale-[1.02] transition-transform cursor-pointer group"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            
            <div>
              <h4 className="font-bold text-white text-sm mb-0.5">Roommates Needed</h4>
              <p className="text-[11px] text-white/80">People looking for places</p>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      </Link>
    </div>

    {/* Swipe hint */}
    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-neutral-400">
      <Heart className="w-3.5 h-3.5" />
      <span>Swipe right to express interest</span>
    </div>
  </div>
);

// Category Cards
const CategorySection = ({ onCategorySelect, selectedCategory }: { onCategorySelect: (postType: string | null) => void; selectedCategory: string | null }) => {
  const router = useRouter();

  return (
    <div className="px-5 lg:px-0 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Browse Categories
        </h3>
        <button
          onClick={() => router.push('/categories')}
          className="text-sm text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => {
              if (cat.postType) {
                router.push(`/categories/${cat.postType}`);
              } else {
                onCategorySelect(cat.postType);
              }
            }}
            className={`category-card hover-lift ${selectedCategory === cat.postType ? 'ring-2 ring-[var(--teal-500)]' : ''}`}
          >
            <div className={`category-icon ${cat.color}`}>
              <cat.icon className="w-6 h-6 text-neutral-700" />
            </div>
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {cat.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Filter Tabs
const FilterTabs = ({ activeFilter, setActiveFilter }: { activeFilter: string; setActiveFilter: (f: string) => void }) => (
  <div className="px-5 lg:px-0 mb-5">
    <div className="tabs-pill">
      {filterTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveFilter(tab.id)}
          className={`tab-item ${activeFilter === tab.id ? 'active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

// Feed Section
const FeedSection = ({
  posts,
  totalPosts,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  error,
  onRefresh,
  userInteractions,
  onEditPost,
  onDeletePost,
  onPromotePost,
  onDemotePost,
  engagementCards,
  onDismissCard,
}: {
  posts: Post[];
  totalPosts: number;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  error: string | null;
  onRefresh: () => void;
  userInteractions: UserInteractions;
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onPromotePost?: (postId: string, type: 'sponsored' | 'promoted') => void;
  onDemotePost?: (postId: string) => void;
  engagementCards?: import('@/components/EngagementCards').EngagementCardData[];
  onDismissCard?: (id: string) => void;
}) => {
  const formattedPosts: PostCardType[] = posts.map(post => ({
    id: post.id,
    author: {
      id: post.author?.id || (post as any).authorId,
      name: post.author?.name || 'Unknown',
      avatar: post.author?.avatar,
      isVerified: post.author?.isVerified || false,
      agentTier: post.author?.agentTier,
      isAgentVerified: post.author?.isAgentVerified,
      role: post.author?.role,
      subscriptionTier: post.author?.subscriptionTier,
    },
    content: post.content,
    location: post.location,
    latitude: post.latitude,
    longitude: post.longitude,
    distance: post.distance,
    budget: post.budget,
    spotsAvailable: post.spotsAvailable,
    postType: post.postType,
    // Subscription/grocery fields
    subscriptionName: post.subscriptionName,
    subscriptionTotalCost: post.subscriptionTotalCost,
    subscriptionCostPerPerson: post.subscriptionCostPerPerson,
    groceryItemName: post.groceryItemName,
    groceryTotalCost: post.groceryTotalCost,
    groceryCostPerPerson: post.groceryCostPerPerson,
    // Carpool fields
    carpoolOrigin: post.carpoolOrigin,
    carpoolDestination: post.carpoolDestination,
    carpoolCarType: post.carpoolCarType,
    carpoolSeatsAvailable: post.carpoolSeatsAvailable,
    carpoolCostPerSeat: post.carpoolCostPerSeat,
    carpoolPaymentMode: post.carpoolPaymentMode,
    carpoolDepartureTime: post.carpoolDepartureTime,
    carpoolIsScheduled: post.carpoolIsScheduled,
    carpoolMeetupPoint: post.carpoolMeetupPoint,
    images: post.images,
    video: post.video,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    interestedCount: post.interestedCount,
    status: post.status,
    createdAt: post.createdAt,
    isLiked: userInteractions.likes.includes(post.id),
    isSaved: userInteractions.saves.includes(post.id),
    isInterested: userInteractions.interests.includes(post.id),
    // Promotion fields
    promotionType: post.promotionType,
    promotedBy: post.promotedBy,
    promotedAt: post.promotedAt,
    // Boost fields
    isBoosted: post.isBoosted,
    boostedAt: post.boostedAt,
    boostExpiresAt: post.boostExpiresAt,
  }));

  if (error && posts.length === 0) {
    return (
      <div className="px-5 lg:px-0 py-10 text-center">
        <p className="text-neutral-500 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="btn-secondary flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 lg:px-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Latest Posts
        </h3>
        <span className="text-sm text-neutral-500">
          {totalPosts} listing{totalPosts !== 1 ? 's' : ''}
        </span>
      </div>

      {isLoading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-(--teal-500)" />
        </div>
      ) : formattedPosts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-neutral-500">No posts found</p>
        </div>
      ) : (
        <div className="posts-grid">
          {formattedPosts.map((post, i) => {
            // Show an engagement card after every 3rd post
            const cardIndex = Math.floor(i / 3);
            const showCard = i > 0 && i % 3 === 0 && engagementCards && engagementCards[cardIndex - 1];
            const card = showCard ? engagementCards![cardIndex - 1] : null;

            return (
              <div key={post.id}>
                {card && (
                  <div className="mb-4">
                    <EngagementCard card={card} onDismiss={onDismissCard} />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <PostCard
                    post={post}
                    onEdit={onEditPost}
                    onDelete={onDeletePost}
                    onPromote={onPromotePost}
                    onDemote={onDemotePost}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {isLoadingMore && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
        </div>
      )}

      {!isLoading && !isLoadingMore && hasMore && formattedPosts.length > 0 && onLoadMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={onLoadMore}
            className="btn-secondary flex items-center gap-2 px-6 py-3 text-sm"
          >
            Load More Posts
          </button>
        </div>
      )}

      {!hasMore && formattedPosts.length > 0 && (
        <p className="text-center text-sm text-neutral-400 py-6">
          You&apos;ve seen all posts
        </p>
      )}
    </div>
  );
};

// Right Sidebar Content (Web only)
const RightSidebar = () => {
  const [stats, setStats] = useState<{ activeUsers: number; activeListings: number; matches: number } | null>(null);

  useEffect(() => {
    usersApi.getCommunityStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div className="right-sidebar">
      {/* Trending Locations */}
      <div className="card-glass p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--pink-400)]" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Trending Topics
          </h3>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((topic) => (
            <button
              key={topic.id}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {topic.title}
              </span>
              <span className="text-sm text-neutral-500">{topic.posts}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Community Insights */}
      <div className="mb-6">
        <AreaInsights />
      </div>

      {/* Quick Stats */}
      <div className="card-glass p-5">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Community Stats
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Active Users</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {stats ? formatNumber(stats.activeUsers) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Successful Matches</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {stats ? formatNumber(stats.matches) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Active Listings</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {stats ? formatNumber(stats.activeListings) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
export default function FeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    likes: [],
    saves: [],
    interests: [],
  });

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Post[]>([]);

  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Capture referral code from URL (?ref=LGH-XXXX) and persist in localStorage (30-day expiry)
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref?.trim()) {
      try {
        localStorage.setItem('partner-referral-code', JSON.stringify({
          code: ref.trim(),
          timestamp: Date.now(),
        }));
      } catch {}
    }
  }, [searchParams]);
  const { cards: engagementCards, dismiss: dismissCard } = useEngagementCards(user, isAuthenticated);
  const dismissedRecs = useDismissedRecommendations();

  // Build query params (shared between fetchPosts and loadMore)
  const buildQuery = useCallback((page: number): PostsQuery => {
    const query: PostsQuery = {
      page,
      limit: 20,
      sortOrder: 'DESC',
    };

    if (user?.homeLatitude != null && user?.homeLongitude != null) {
      query.viewerLat = user.homeLatitude;
      query.viewerLng = user.homeLongitude;
    }

    if (user?.isVerified || user?.role === 'admin') {
      query.viewerIsVerified = 'true';
    }

    if (user?.id) {
      query.viewerId = user.id;
    }

    if (user?.role === 'admin') {
      query.viewerIsAdmin = 'true';
    }

    query.platform = 'web';

    if (selectedCategory) {
      query.postType = selectedCategory as Post['postType'];
    }

    if (searchQuery) {
      query.search = searchQuery;
    }

    if (filters.location) {
      query.location = filters.location;
    }
    if (filters.budgetMin !== undefined) {
      query.budgetMin = filters.budgetMin;
    }
    if (filters.budgetMax !== undefined) {
      query.budgetMax = filters.budgetMax;
    }
    if (filters.postType) {
      query.postType = filters.postType;
    }

    const filterConfig = filterTabs.find(f => f.id === activeFilter);
    if (filterConfig) {
      query.sortBy = filterConfig.sortBy as PostsQuery['sortBy'];
    }

    return query;
  }, [selectedCategory, searchQuery, activeFilter, filters, user?.homeLatitude, user?.homeLongitude, user?.isVerified]);

  // Fetch first page of posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setHasMore(true);

    try {
      const query = buildQuery(1);
      const response = await postsApi.getPosts(query);
      setPosts(response.data);
      setTotalPosts(response.meta.total);
      setHasMore(response.meta.page < response.meta.totalPages);

      if (isAuthenticated && response.data.length > 0) {
        try {
          const interactions = await postsApi.getUserInteractions(
            response.data.map(p => p.id)
          );
          setUserInteractions(interactions);
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load posts. Please try again.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery, isAuthenticated]);

  // Load more posts (next page)
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const query = buildQuery(nextPage);
      const response = await postsApi.getPosts(query);

      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = response.data.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      setCurrentPage(nextPage);
      setHasMore(response.meta.page < response.meta.totalPages);

      if (isAuthenticated && response.data.length > 0) {
        try {
          const interactions = await postsApi.getUserInteractions(
            response.data.map(p => p.id)
          );
          setUserInteractions(prev => ({
            likes: [...prev.likes, ...interactions.likes],
            saves: [...prev.saves, ...interactions.saves],
            interests: [...prev.interests, ...interactions.interests],
          }));
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildQuery, currentPage, hasMore, isLoadingMore, isAuthenticated]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch recommendations when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    postsApi.getRecommendations(1, 5)
      .then(res => setRecommendations(res.data || []))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleCategorySelect = (postType: string | null) => {
    setSelectedCategory(selectedCategory === postType ? null : postType);
  };

  // Handle edit post
  const handleEditPost = (postId: string) => {
    router.push(`/post/${postId}/edit`);
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    const confirmed = await confirm({
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await postsApi.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete post:', err);
      showToast('Failed to delete post', 'error');
    }
  };

  // Handle promote post (admin only)
  const handlePromotePost = async (postId: string, type: 'sponsored' | 'promoted') => {
    try {
      const updatedPost = await postsApi.promotePost(postId, type);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedPost } : p));
      showToast(
        type === 'promoted' ? 'Post promoted! It will appear at the top.' : 'Post marked as sponsored!',
        'success'
      );
    } catch (err: any) {
      console.error('Failed to promote post:', err);
      showToast(err.message || 'Failed to promote post', 'error');
    }
  };

  // Handle demote post (admin only)
  const handleDemotePost = async (postId: string) => {
    try {
      await postsApi.demotePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, promotionType: 'none', promotedBy: undefined, promotedAt: undefined } : p));
      showToast('Promotion removed', 'success');
    } catch (err: any) {
      console.error('Failed to demote post:', err);
      showToast(err.message || 'Failed to remove promotion', 'error');
    }
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <SharedHeader>
        {/* Mobile Header - Hidden on desktop */}
        <MobileHeader />

        {/* Web Header - Hidden on mobile */}
        <WebHeader />
      </SharedHeader>

      <div className="content-container">
        <div className="three-column-layout">
          {/* Main Feed */}
          <div className="main-feed safe-bottom">
            <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />
            <HeroCard />
            <SwipeDiscoveryCards />
            <CategorySection onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
            <FilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

            {/* Preferred locations nudge */}
            {isAuthenticated && user && !user.preferredLocations?.length && (
              <div className="px-5 lg:px-0 mb-4">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--peach-100)] dark:bg-neutral-800/60 border border-[var(--peach-200)] dark:border-neutral-700 hover:border-[var(--teal-300)] dark:hover:border-[var(--teal-500)]/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Set your preferred areas</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Get better recommendations by adding where you're looking</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                </Link>
              </div>
            )}

            {/* Recommendations Section */}
            {isAuthenticated && recommendations.filter(r => !dismissedRecs.has(r.id)).length > 0 && (
              <div className="px-5 lg:px-0 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--lime-500)]" />
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      Recommended for You
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {recommendations
                    .filter(r => !dismissedRecs.has(r.id))
                    .slice(0, 3)
                    .map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        post={rec}
                        matchReason="Based on your preferences and listings"
                        onInterested={(postId) => {
                          setRecommendations(prev => prev.filter(r => r.id !== postId));
                        }}
                        onDismiss={(postId) => {
                          setRecommendations(prev => prev.filter(r => r.id !== postId));
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            <FeedSection
              posts={posts}
              totalPosts={totalPosts}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={loadMorePosts}
              error={error}
              onRefresh={fetchPosts}
              userInteractions={userInteractions}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onPromotePost={handlePromotePost}
              onDemotePost={handleDemotePost}
              engagementCards={engagementCards}
              onDismissCard={dismissCard}
            />
          </div>

          {/* Right Sidebar - XL screens only */}
          <RightSidebar />
        </div>
      </div>
    </AppLayout>
  );
}
