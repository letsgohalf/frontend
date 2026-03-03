'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  User,
  Clock,
  FileQuestion,
  LogOut,
} from 'lucide-react';
import interestThreadsApi, {
  InterestThread,
  InterestThreadStatus,
  CloseAction,
} from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';
import { resolveImageUrl } from '@/lib/utils/image';

// Generate consistent color for a user based on their ID
const getUserColor = (userId: string) => {
  const colors = [
    { bg: 'bg-teal-50 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-l-teal-500', dot: 'bg-teal-500' },
    { bg: 'bg-purple-50 dark:bg-purple-400/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500', dot: 'bg-purple-500' },
    { bg: 'bg-lime-50 dark:bg-lime-500/20', text: 'text-lime-700 dark:text-lime-400', border: 'border-l-lime-500', dot: 'bg-lime-500' },
    { bg: 'bg-pink-50 dark:bg-pink-400/20', text: 'text-pink-500 dark:text-pink-400', border: 'border-l-pink-400', dot: 'bg-pink-400' },
    { bg: 'bg-amber-50 dark:bg-amber-400/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500', dot: 'bg-amber-500' },
    { bg: 'bg-orange-50 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500', dot: 'bg-orange-500' },
    { bg: 'bg-cyan-50 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-l-cyan-500', dot: 'bg-cyan-500' },
    { bg: 'bg-rose-50 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-l-rose-500', dot: 'bg-rose-500' },
  ];
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface InterestThreadDetailProps {
  threadId: string;
  onBack?: () => void;
}

const STATUS_CONFIG: Record<InterestThreadStatus, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  pending_screening: {
    label: 'Pending Answers',
    description: 'Waiting for screening questions to be answered',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  open: {
    label: 'Active Conversation',
    description: 'You can chat and decide on this interest',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  matched: {
    label: 'Matched!',
    description: 'You have successfully matched',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  closed: {
    label: 'Closed',
    description: 'This thread has been closed',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  withdrawn: {
    label: 'Withdrawn',
    description: 'Interest has been withdrawn',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
};

export default function InterestThreadDetail({
  threadId,
  onBack,
}: InterestThreadDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [thread, setThread] = useState<InterestThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  const isOwner = user?.id === thread?.postOwnerId;
  const isInterestedUser = user?.id === thread?.interestedUserId;

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await interestThreadsApi.getThread(threadId);
      setThread(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!thread) return;
    try {
      setActionLoading(true);
      const updated = await interestThreadsApi.matchThread(threadId);
      setThread(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark as matched');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!thread) return;
    try {
      setActionLoading(true);
      const updated = await interestThreadsApi.closeThread(threadId, {
        action: 'close',
        reason: closeReason || undefined,
      });
      setThread(updated);
      setShowCloseConfirm(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to close thread');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!thread) return;
    try {
      setActionLoading(true);
      const updated = await interestThreadsApi.withdrawInterest(threadId, closeReason);
      setThread(updated);
      setShowCloseConfirm(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to withdraw interest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoToConversation = () => {
    if (thread?.conversationId) {
      router.push(`/messages/${thread.conversationId}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="p-4">
        <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error || 'Thread not found'}</p>
            <button
              onClick={loadThread}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[thread.status];
  const otherUser = isOwner ? thread.interestedUser : thread.postOwner;
  const canTakeAction = thread.status === 'open' || thread.status === 'pending_screening';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack || (() => router.back())}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Interest Details</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Status banner - for matched threads, participants (owner/interested user) see it as active */}
        {(() => {
          const isParticipant = isOwner || isInterestedUser;
          const showAsActive = thread.status === 'matched' && isParticipant;
          const displayConfig = showAsActive ? STATUS_CONFIG.open : statusConfig;
          const displayStatus = showAsActive ? 'open' : thread.status;
          
          return (
            <div className={`p-4 rounded-xl ${displayConfig.bgColor}`}>
              <div className="flex items-center gap-3">
                {displayStatus === 'matched' && <Sparkles className={`w-6 h-6 ${displayConfig.color}`} />}
                {displayStatus === 'open' && <MessageCircle className={`w-6 h-6 ${displayConfig.color}`} />}
                {displayStatus === 'pending_screening' && <Clock className={`w-6 h-6 ${displayConfig.color}`} />}
                {displayStatus === 'closed' && <XCircle className={`w-6 h-6 ${displayConfig.color}`} />}
                {displayStatus === 'withdrawn' && <AlertCircle className={`w-6 h-6 ${displayConfig.color}`} />}
                <div>
                  <h3 className={`font-semibold ${displayConfig.color}`}>{displayConfig.label}</h3>
                  <p className="text-sm text-gray-600">{displayConfig.description}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* User info */}
        <div className="bg-white rounded-xl p-4 border">
          <h3 className="font-medium text-gray-900 mb-3">
            {isOwner ? 'Interested Person' : 'Post Owner'}
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              {otherUser?.avatar ? (
                <Image
                  src={otherUser.avatar}
                  alt={otherUser.name || 'User'}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xl font-semibold">
                  {otherUser?.name?.charAt(0) || <User className="w-8 h-8" />}
                </div>
              )}
              {otherUser?.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{otherUser?.name || 'Anonymous'}</h4>
              {otherUser?.occupation && (
                <p className="text-sm text-gray-500">{otherUser.occupation}</p>
              )}
              {otherUser?.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-teal-600 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Initial message */}
        {thread.initialMessage && (
          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-medium text-gray-900 mb-2">Introduction Message</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{thread.initialMessage}</p>
          </div>
        )}

        {/* Screening answers — WhatsApp-style reply bubbles */}
        {thread.screeningAnswers && thread.screeningAnswers.length > 0 && (
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-4">
              <FileQuestion className="w-5 h-5 text-teal-500" />
              <h3 className="font-medium text-gray-900">Screening Answers</h3>
            </div>
            <div className="space-y-3">
              {thread.screeningAnswers.map((answer) => {
                const answerUser = thread.interestedUser;
                const userColor = getUserColor(thread.interestedUserId);

                return (
                  <div key={answer.id} className="flex gap-2">
                    <div className="w-8 flex-shrink-0">
                      {answerUser?.avatar ? (
                        <Image
                          src={resolveImageUrl(answerUser.avatar) || ''}
                          alt={answerUser.name || ''}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${userColor.bg} ${userColor.text}`}>
                          {answerUser?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`px-4 py-2 rounded-2xl rounded-bl-md border-l-[3px] ${userColor.bg} ${userColor.border}`}>
                        {/* Quoted question */}
                        <div className="rounded-lg px-3 py-1.5 mb-2 border-l-[3px] bg-lime-50 dark:bg-lime-500/10 border-l-lime-500">
                          <p className="text-xs font-medium text-lime-700 dark:text-lime-400">
                            {answer.question?.question || 'Screening Question'}
                          </p>
                        </div>
                        {/* Answer text */}
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer.answer}</p>
                        {/* Timestamp */}
                        <div className="mt-1">
                          <span className="text-[10px] text-gray-400">
                            {new Date(answer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl p-4 border">
          <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" />
              <div>
                <p className="text-gray-700">Interest expressed</p>
                <p className="text-gray-400">{formatDate(thread.createdAt)}</p>
              </div>
            </div>
            {thread.screeningCompletedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p className="text-gray-700">Screening completed</p>
                  <p className="text-gray-400">{formatDate(thread.screeningCompletedAt)}</p>
                </div>
              </div>
            )}
            {thread.matchedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <div>
                  <p className="text-gray-700">Matched!</p>
                  <p className="text-gray-400">{formatDate(thread.matchedAt)}</p>
                </div>
              </div>
            )}
            {thread.closedAt && !thread.matchedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5" />
                <div>
                  <p className="text-gray-700">
                    {thread.status === 'withdrawn' ? 'Withdrawn' : 'Closed'}
                  </p>
                  <p className="text-gray-400">{formatDate(thread.closedAt)}</p>
                  {thread.closedReason && (
                    <p className="text-gray-500 italic">"{thread.closedReason}"</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canTakeAction && (
          <div className="bg-white rounded-xl p-4 border space-y-3">
            {/* Go to conversation */}
            {thread.conversationId && thread.status === 'open' && (
              <button
                onClick={handleGoToConversation}
                className="w-full py-3 px-4 bg-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Go to Conversation
              </button>
            )}

            {/* Owner actions */}
            {isOwner && thread.status === 'open' && (
              <>
                <button
                  onClick={handleMatch}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Mark as Matched
                </button>
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Close Thread
                </button>
              </>
            )}

            {/* Interested user actions */}
            {isInterestedUser && thread.status === 'open' && (
              <button
                onClick={() => setShowCloseConfirm(true)}
                className="w-full py-3 px-4 border border-red-300 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Withdraw Interest
              </button>
            )}
          </div>
        )}

        {/* View conversation for matched threads */}
        {thread.status === 'matched' && thread.conversationId && (
          <div className="bg-white rounded-xl p-4 border">
            <button
              onClick={handleGoToConversation}
              className="w-full py-3 px-4 bg-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              View Conversation
            </button>
          </div>
        )}

        {/* Repost button for matched posts */}
        {thread.status === 'matched' && isOwner && (
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600 mb-3">
              If this match didn't work out, you can create a new post with the same details.
            </p>
            <button
              onClick={() => router.push(`/posts/${thread.postId}/repost`)}
              className="w-full py-3 px-4 border border-teal-500 text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors"
            >
              Repost This Listing
            </button>
          </div>
        )}
      </div>

      {/* Close confirmation modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCloseConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              {isOwner ? 'Close This Thread?' : 'Withdraw Interest?'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {isOwner
                ? 'This will close the thread. The conversation history will remain accessible for reference.'
                : 'This will withdraw your interest. You can express interest again by creating a new request.'}
            </p>
            <textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Add a reason (optional)"
              className="w-full p-3 border rounded-lg mb-4 resize-none"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 py-2 px-4 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={isOwner ? handleClose : handleWithdraw}
                disabled={actionLoading}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : isOwner ? (
                  'Close Thread'
                ) : (
                  'Withdraw'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
