'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Search, Loader2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import postsApi, { Post } from '@/lib/api/posts';

export default function SavedPostsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await postsApi.getSavedPosts(1, 50);
      setSavedPosts(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved posts');
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedPosts();
    }
  }, [isAuthenticated, fetchSavedPosts]);

  const handleUnsave = useCallback((postId: string) => {
    // Remove from local state when unsaved
    setSavedPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  if (authLoading || isLoading) {
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
          Saved Posts
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
              Saved Posts
            </h1>
            <p className="text-neutral-500 mt-1">Posts you&apos;ve bookmarked</p>
          </div>
        </div>
      </header>

      <div className="content-container">
        <div className="three-column-layout">
          <div className="main-feed pb-24 lg:pb-8">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 lg:mx-0"
              >
                <div className="card-glass p-8 text-center">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={fetchSavedPosts}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            ) : savedPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 lg:mx-0"
              >
                <div className="card-glass p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--lime-100)] dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-8 h-8 text-[var(--lime-500)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    No saved posts
                  </h3>
                  <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                    Save posts you&apos;re interested in by tapping the bookmark icon. They&apos;ll appear here.
                  </p>
                  <button
                    onClick={() => router.push('/explore')}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Explore Listings
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4 mx-5 lg:mx-0">
                {savedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isSaved={true}
                    onSave={handleUnsave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
