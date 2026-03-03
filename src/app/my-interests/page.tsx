'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Sparkles,
  Home,
} from 'lucide-react';
import interestThreadsApi, {
  InterestThread,
  InterestThreadStatus,
} from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_CONFIG: Record<InterestThreadStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  pending_screening: {
    label: 'Answer Questions',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  open: {
    label: 'In Progress',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  matched: {
    label: 'Matched!',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  closed: {
    label: 'Closed',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
};

export default function MyInterestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [threads, setThreads] = useState<InterestThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/my-interests');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user, page]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await interestThreadsApi.getMyThreads(page, 20);
      setThreads(response.data);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your interests');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (thread: InterestThread) => {
    if (thread.status === 'pending_screening') {
      // Go to complete screening
      router.push(`/my-interests/${thread.id}/screening`);
    } else if (thread.conversationId && (thread.status === 'open' || thread.status === 'matched')) {
      // For open or matched threads with a conversation, go to the full thread view with embedded chat
      router.push(`/interest/${thread.id}`);
    } else {
      router.push(`/my-interests/${thread.id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">My Interests</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {loading && threads.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadThreads}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No interests yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              When you express interest in a listing, it will appear here.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
            >
              Browse Listings
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => {
              // For matched threads, show as "In Progress" to the interested user (they're a participant)
              const displayStatus = thread.status === 'matched' ? 'open' : thread.status;
              const config = STATUS_CONFIG[displayStatus];
              const post = thread.post;
              const owner = thread.postOwner;

              return (
                <button
                  key={thread.id}
                  onClick={() => handleThreadClick(thread)}
                  className="w-full p-4 bg-white border rounded-xl hover:border-teal-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    {/* Post image or owner avatar */}
                    <div className="relative flex-shrink-0">
                      {post?.images?.[0] ? (
                        <Image
                          src={post.images[0]}
                          alt={post.location || 'Listing'}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : owner?.avatar ? (
                        <Image
                          src={owner.avatar}
                          alt={owner.name || 'User'}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                          <Home className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {post?.location || 'Listing'}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {owner?.name || 'Unknown'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDate(thread.lastActivityAt || thread.createdAt)}
                        </span>
                      </div>

                      {/* Post preview */}
                      {post?.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {post.content}
                        </p>
                      )}

                      {/* Status badge */}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
