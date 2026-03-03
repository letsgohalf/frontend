'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Building2,
  Bed,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Loader2,
  Repeat2,
  ShoppingBasket,
  Car,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import postsApi from '@/lib/api/posts';

// Category configuration with full details
const categoryConfig = [
  {
    id: 'looking-for-roommate',
    slug: 'looking-for-roommate',
    icon: Users,
    label: 'Looking for Roommate',
    shortLabel: 'Roommates',
    description: 'People who have a place and are looking for someone to share it with',
    color: 'peach',
    gradient: 'from-[var(--peach-200)] to-[var(--pink-200)]',
    iconBg: 'bg-[var(--peach-200)]',
    stats: { label: 'Active seekers', trend: '+12%' }
  },
  {
    id: 'looking-for-place',
    slug: 'looking-for-place',
    icon: Building2,
    label: 'Looking for Place',
    shortLabel: 'Places',
    description: 'People who need a place to stay and are open to sharing',
    color: 'lavender',
    gradient: 'from-[var(--lavender-200)] to-[var(--pink-200)]',
    iconBg: 'bg-[var(--lavender-200)]',
    stats: { label: 'Available spaces', trend: '+8%' }
  },
  {
    id: 'have-spare-room',
    slug: 'have-spare-room',
    icon: Bed,
    label: 'Have Spare Room',
    shortLabel: 'Spare Rooms',
    description: 'People who have an extra room available for rent',
    color: 'lime',
    gradient: 'from-[var(--lime-200)] to-[var(--yellow-200)]',
    iconBg: 'bg-[var(--lime-200)]',
    stats: { label: 'Rooms listed', trend: '+15%' }
  },
  {
    id: 'subscription-split',
    slug: 'subscription-split',
    icon: Repeat2,
    label: 'Subscription Splits',
    shortLabel: 'Subscriptions',
    description: 'Split Netflix, Spotify, and other subscriptions with others',
    color: 'violet',
    gradient: 'from-violet-200 to-purple-200',
    iconBg: 'bg-violet-200 dark:bg-violet-500/20',
    stats: { label: 'Active splits', trend: '+20%' }
  },
  {
    id: 'grocery-split',
    slug: 'grocery-split',
    icon: ShoppingBasket,
    label: 'Grocery Splits',
    shortLabel: 'Groceries',
    description: 'Split bulk buys like food, livestock, and household items',
    color: 'green',
    gradient: 'from-green-200 to-emerald-200',
    iconBg: 'bg-green-200 dark:bg-green-500/20',
    stats: { label: 'Active splits', trend: '+10%' }
  },
  {
    id: 'carpool',
    slug: 'carpool',
    icon: Car,
    label: 'Carpool',
    shortLabel: 'Rides',
    description: 'Find or offer rides and share travel costs',
    color: 'sky',
    gradient: 'from-sky-200 to-blue-200',
    iconBg: 'bg-sky-200 dark:bg-sky-500/20',
    stats: { label: 'Rides shared', trend: '+25%' }
  },
];

interface CategoryCount {
  postType: string;
  count: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('categories');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      setIsLoading(true);
      try {
        // Fetch posts for each category to get counts
        const counts: Record<string, number> = {};

        for (const cat of categoryConfig) {
          try {
            const response = await postsApi.getPosts({ postType: cat.id as any, limit: 1 });
            counts[cat.id] = response.meta.total;
          } catch {
            counts[cat.id] = 0;
          }
        }

        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to fetch category counts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryCounts();
  }, []);

  const totalListings = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 px-5 py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Browse Categories
            </h1>
            <p className="text-xs text-neutral-500">{totalListings} total listings</p>
          </div>
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
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Browse Categories
              </h1>
              <p className="text-neutral-500 text-sm">Find exactly what you're looking for</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10">
            <Sparkles className="w-4 h-4 text-[var(--lime-600)]" />
            <span className="text-sm font-medium text-[var(--lime-700)] dark:text-[var(--lime-400)]">
              {totalListings} listings
            </span>
          </div>
        </div>
      </header>

      <div className="content-container px-5 py-6 lg:px-0">
        <div className="max-w-2xl mx-auto lg:max-w-none">
          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass p-5 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--lime-300)] to-[var(--yellow-300)] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-neutral-900" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Growing Community
                </h3>
                <p className="text-sm text-neutral-500">
                  New listings added every day
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {categoryConfig.map((cat) => (
                <div key={cat.id} className="text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {isLoading ? '-' : categoryCounts[cat.id] || 0}
                  </p>
                  <p className="text-xs text-neutral-500">{cat.shortLabel}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category Cards */}
          <div className="space-y-4">
            {categoryConfig.map((category, i) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => router.push(`/categories/${category.slug}`)}
                className="w-full card-glass p-5 text-left hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${category.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-7 h-7 text-neutral-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                        {category.label}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-[var(--teal-500)] group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            `${categoryCounts[category.id] || 0} posts`
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[var(--lime-600)]">
                        <TrendingUp className="w-3 h-3" />
                        <span>{category.stats.trend} this week</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-glass p-5 mt-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[var(--yellow-500)]" />
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                Tips for Finding Matches
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Be specific about your budget and location preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--peach-100)] dark:bg-[var(--peach-500)]/10 text-[var(--peach-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Check verified profiles for added safety</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-[var(--lavender-500)] flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Reach out to multiple listings to increase your chances</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
