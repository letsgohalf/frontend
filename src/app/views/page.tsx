'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, UserPlus, Loader2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileViewsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
        </div>
      </AppLayout>
    );
  }

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
          Profile Views
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
              Profile Views
            </h1>
            <p className="text-neutral-500 mt-1">See who&apos;s viewed your profile</p>
          </div>
        </div>
      </header>

      <div className="content-container">
        <div className="three-column-layout">
          <div className="main-feed pb-24 lg:pb-8">
            {/* Empty State */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-5 lg:mx-0"
            >
              <div className="card-glass p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--lavender-100)] dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-[var(--lavender-500)]" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  No profile views yet
                </h3>
                <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                  When someone views your profile, they&apos;ll appear here. Complete your profile to attract more views!
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Complete Your Profile
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
