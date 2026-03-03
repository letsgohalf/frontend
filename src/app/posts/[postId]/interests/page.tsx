'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { InterestThreadsList } from '@/components/interest';
import interestThreadsApi from '@/lib/api/interest-threads';
import postsApi, { Post } from '@/lib/api/posts';
import { useAuth } from '@/contexts/AuthContext';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default function PostInterestsPage({ params }: PageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showPastThreads, setShowPastThreads] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/posts/' + postId + '/interests');
    }
  }, [authLoading, user, router, postId]);

  useEffect(() => {
    if (user) {
      loadPost();
    }
  }, [user, postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await postsApi.getPost(postId);
      setPost(data);
      setShowPastThreads(data.showPastThreads || false);

      // Check if user is the owner or an admin
      if (data.authorId !== user?.id && user?.role !== 'admin') {
        router.replace(`/posts/${postId}`);
      }
    } catch (err) {
      console.error('Failed to load post', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await interestThreadsApi.updatePostSettings(postId, showPastThreads);
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleThreadSelect = (threadId: string) => {
    // Go directly to the thread page with embedded chat
    router.push(`/interest/${threadId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peach-50)] dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--peach-50)] dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div>
              <h1 className="font-semibold text-neutral-900 dark:text-neutral-100">Interested Users</h1>
              {post?.location && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{post.location}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
          >
            <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Post status banner */}
        {post && (post.status === 'matched' || post.status === 'booked') && (
          <div className="mb-4 p-4 bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 rounded-xl border border-[var(--lime-200)] dark:border-[var(--lime-500)]/20">
            <p className="text-sm text-[var(--lime-600)] dark:text-[var(--lime-400)]">
              🎉 This post has been matched! The listing is no longer accepting new interests.
            </p>
          </div>
        )}

        <InterestThreadsList postId={postId} onThreadSelect={handleThreadSelect} />
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettings(false)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full border border-[var(--peach-200)] dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Interest Thread Settings</h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={showPastThreads}
                  onChange={(e) => setShowPastThreads(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[var(--teal-500)] rounded focus:ring-[var(--teal-500)]"
                />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">Show past Q&A to new users</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    When enabled, new interested users can see the screening answers from
                    previous closed/matched threads (but not the conversations).
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 px-4 border border-[var(--peach-200)] dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-[var(--teal-500)] text-white rounded-lg hover:bg-[var(--teal-600)] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
