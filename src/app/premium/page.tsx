'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Star,
  TrendingUp,
  Award,
  Eye,
  Sliders,
  Zap,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import paymentsApi from '@/lib/api/payments';
import type { SubscriptionStatus } from '@/lib/api/payments';
import { usePremium } from '@/contexts/PremiumContext';
import AppLayout from '@/components/AppLayout';

const PREMIUM_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Priority Interest Placement',
    description: "Your interest appears at the top of every poster's list, so you get seen first.",
  },
  {
    icon: Award,
    title: 'Premium Badge',
    description: "A badge on your profile that shows posters you're a serious, committed user.",
  },
  {
    icon: Eye,
    title: 'See Who Viewed Your Posts',
    description: 'Know exactly who looked at your listings — not just the view count.',
  },
  {
    icon: Sliders,
    title: 'Advanced Filters',
    description: 'Filter posts by budget range, verified users only, and distance radius.',
  },
  {
    icon: Zap,
    title: '1 Free Post Boost / Month',
    description: 'Get one free post boost every month to push your listing higher in the feed.',
  },
  {
    icon: MessageCircle,
    title: 'Direct Messaging',
    description: 'Message anyone directly from their profile without needing to express interest first.',
  },
  {
    icon: Phone,
    title: 'Share Contact Details',
    description: 'Share phone numbers and contact info directly in chats and threads.',
  },
];

const ONE_TIME_BOOSTS = [
  {
    title: 'Interest Boost',
    description: 'Boost your interest to the top for one specific post',
    price: '₦1,000',
    unit: 'per post',
    icon: TrendingUp,
  },
  {
    title: 'Post Boost',
    description: 'Push your listing higher in the feed for 7 days',
    price: '₦5,000',
    unit: 'per post',
    icon: Zap,
  },
];

export default function PremiumPage() {
  const router = useRouter();
  const { user, isAuthenticated, promptAuth, refreshUser } = useAuth();
  const { showToast } = useToast();

  const { premiumEnabled, isLoading: premiumLoading } = usePremium();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState('premium');

  const isPremium = user?.subscriptionTier === 'premium';

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscription();
    } else {
      setLoadingStatus(false);
    }
  }, [isAuthenticated]);

  const loadSubscription = async () => {
    try {
      const status = await paymentsApi.getMySubscription();
      setSubscriptionStatus(status);
    } catch {
      // Silently fail
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      promptAuth('Sign in to subscribe to Premium');
      return;
    }

    try {
      setLoading(true);
      const result = await paymentsApi.initiatePayment('premium_subscription');
      window.open(result.authorizationUrl, '_blank');
      showToast('Payment page opened in a new tab. Complete payment there.', 'success');

      const pollInterval = setInterval(async () => {
        try {
          const verification = await paymentsApi.verifyPayment(result.reference);
          if (verification.status === 'success') {
            clearInterval(pollInterval);
            showToast('Welcome to Premium!', 'success');
            if (refreshUser) await refreshUser();
            loadSubscription();
          }
        } catch {
          // Keep polling
        }
      }, 5000);

      setTimeout(() => clearInterval(pollInterval), 300000);
    } catch (err: any) {
      const message = err?.message || 'Failed to initiate payment';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Mobile Header */}
      <header className="header-mobile px-5 pt-4 pb-2 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </button>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Premium
        </h1>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {isPremium ? "You're Premium" : 'Go Premium'}
            </h1>
            <p className="text-neutral-500 mt-1">
              {isPremium
                ? 'You have access to all premium features'
                : 'Get priority access, premium badge, and more'}
            </p>
          </div>
        </div>
      </header>

      <div className="content-container">
        <div className="three-column-layout">
          <div className="main-feed pb-24 lg:pb-8">

            {/* Hero — mobile only (web header already shows this) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 px-5 lg:hidden"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-200 dark:shadow-amber-500/20 mb-5">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                {isPremium ? "You're Premium" : 'Go Premium'}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                {isPremium
                  ? 'You have access to all premium features'
                  : 'Get priority access, premium badge, and more'}
              </p>
            </motion.div>

            {/* Active subscription card */}
            {isPremium && subscriptionStatus?.subscription && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 lg:mx-0 mb-6 card-glass p-5 border border-lime-200 dark:border-lime-500/20 bg-lime-50/50 dark:bg-lime-500/5"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-lime-600" />
                  <div>
                    <p className="font-semibold text-lime-700 dark:text-lime-400">Active Premium</p>
                    <p className="text-sm text-lime-600 dark:text-lime-300/80">
                      Your premium subscription is active. Enjoy all the features!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pricing card */}
            {!isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-5 lg:mx-0 mb-8 card-glass p-8 text-center"
              >
                <p className="text-sm text-neutral-500 mb-1">Monthly</p>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">₦</span>
                  <span className="text-5xl font-bold text-neutral-900 dark:text-neutral-100">5,000</span>
                  <span className="text-neutral-500">/month</span>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={loading || !premiumEnabled}
                  className="mt-6 inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-900 font-semibold text-lg shadow-lg shadow-amber-200/50 dark:shadow-amber-500/20 hover:from-amber-500 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : !premiumEnabled ? (
                    'Coming Soon'
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Subscribe Now
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Features */}
            <div className="px-5 lg:px-0 mb-8">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                {isPremium ? 'Your Premium Features' : 'What You Get'}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {PREMIUM_FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="card-glass p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-[15px]">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* One-Time Boosts */}
            <div className="px-5 lg:px-0 mb-8">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                One-Time Boosts
              </h2>
              <p className="text-sm text-neutral-500 mb-4">
                Don't need premium? Pay per use instead.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {ONE_TIME_BOOSTS.map((boost, i) => (
                  <motion.div
                    key={boost.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="card-glass p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <boost.icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-[15px]">
                          {boost.title}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-0.5 leading-relaxed">
                          {boost.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">{boost.price}</p>
                        <p className="text-xs text-neutral-500">{boost.unit}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
