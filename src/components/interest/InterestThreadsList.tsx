'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Users,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import interestThreadsApi, {
  InterestThread,
  InterestThreadStatus,
} from '@/lib/api/interest-threads';

interface InterestThreadsListProps {
  postId: string;
  onThreadSelect?: (threadId: string) => void;
}

const STATUS_CONFIG: Record<InterestThreadStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  pending_screening: {
    label: 'Pending Answers',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
  },
  open: {
    label: 'Active',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-[var(--teal-600)] dark:text-[var(--teal-400)]',
    bgColor: 'bg-[var(--teal-100)]/50 dark:bg-[var(--teal-500)]/10',
  },
  matched: {
    label: 'Matched',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-500/10',
  },
  closed: {
    label: 'Closed',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-neutral-500 dark:text-neutral-400',
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
  },
};

export default function InterestThreadsList({
  postId,
  onThreadSelect,
}: InterestThreadsListProps) {
  const router = useRouter();
  const [threads, setThreads] = useState<InterestThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadThreads();
  }, [postId, page]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await interestThreadsApi.getThreadsForPost(postId, page, 20);
      setThreads(response.data);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load interested users');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (thread: InterestThread) => {
    if (onThreadSelect) {
      onThreadSelect(thread.id);
    } else {
      // Always go to the unified thread page with embedded chat
      router.push(`/interest/${thread.id}`);
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

  if (loading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadThreads}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
        <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-1">No interest yet</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          When someone expresses interest in your post, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
          Interested ({threads.length})
        </h3>
      </div>

      {/* Thread list */}
      <div className="space-y-2">
        {threads.map((thread) => {
          const config = STATUS_CONFIG[thread.status];
          const user = thread.interestedUser;

          return (
            <button
              key={thread.id}
              onClick={() => handleThreadClick(thread)}
              className="w-full p-4 bg-white/80 dark:bg-neutral-900/80 border border-[var(--peach-200)] dark:border-neutral-800 rounded-xl hover:border-[var(--teal-300)] dark:hover:border-[var(--teal-500)]/50 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {user?.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name || 'User'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--teal-600)] flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {user?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--teal-500)] rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {user?.name || 'Anonymous'}
                      </h4>
                      {user?.occupation && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                          {user.occupation}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                      {formatDate(thread.lastActivityAt || thread.createdAt)}
                    </span>
                  </div>

                  {/* Initial message preview */}
                  {thread.initialMessage && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                      &ldquo;{thread.initialMessage}&rdquo;
                    </p>
                  )}

                  {/* Screening answers preview */}
                  {thread.screeningAnswers && thread.screeningAnswers.length > 0 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {thread.screeningAnswers.length} screening answer{thread.screeningAnswers.length !== 1 ? 's' : ''}
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
                    <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-[var(--peach-200)] dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-[var(--peach-200)] dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
