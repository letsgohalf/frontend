'use client';

import { use, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  MapPin,
  MoreVertical,
  Check,
  CheckCheck,
  X,
  Shield,
  Repeat2,
  ShoppingBasket,
  DollarSign,
  ImageIcon,
  Video,
  QrCode,
  ArrowDown,
  Reply,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react';
import interestThreadsApi, {
  InterestThread,
  ScreeningAnswer,
  ScreeningQuestion,
} from '@/lib/api/interest-threads';
import { chatApi, Message } from '@/lib/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { resolveImageUrl } from '@/lib/utils/image';
import VerificationRequiredModal from '@/components/VerificationRequiredModal';
import PremiumRequiredModal from '@/components/PremiumRequiredModal';
import { cn } from '@/lib/utils';
import { containsPhoneNumber, PHONE_NUMBER_ERROR } from '@/lib/utils/content-filter';
import { PLATFORM_NAME, PLATFORM_LOGO } from '@/lib/constants/platform';

type TimelineItem =
  | { type: 'message'; data: Message; createdAt: string }
  | { type: 'answer'; data: ScreeningAnswer; createdAt: string };

interface PageProps {
  params: Promise<{ threadId: string }>;
}

// Generate consistent color for a user based on their ID
const getUserColor = (userId: string) => {
  const colors = [
    { bg: 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20', text: 'text-[var(--teal-700)] dark:text-[var(--teal-400)]', border: 'border-l-[var(--teal-500)]', dot: 'bg-[var(--teal-500)]' },
    { bg: 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/20', text: 'text-[var(--lavender-600)] dark:text-[var(--lavender-400)]', border: 'border-l-[var(--lavender-500)]', dot: 'bg-[var(--lavender-500)]' },
    { bg: 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/20', text: 'text-[var(--lime-700)] dark:text-[var(--lime-400)]', border: 'border-l-[var(--lime-500)]', dot: 'bg-[var(--lime-500)]' },
    { bg: 'bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/20', text: 'text-[var(--pink-500)] dark:text-[var(--pink-400)]', border: 'border-l-[var(--pink-400)]', dot: 'bg-[var(--pink-400)]' },
    { bg: 'bg-[var(--yellow-100)] dark:bg-[var(--yellow-400)]/20', text: 'text-[var(--yellow-600)] dark:text-[var(--yellow-400)]', border: 'border-l-[var(--yellow-500)]', dot: 'bg-[var(--yellow-500)]' },
    { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500', dot: 'bg-orange-500' },
    { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-l-cyan-500', dot: 'bg-cyan-500' },
    { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-l-rose-500', dot: 'bg-rose-500' },
  ];
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function InterestThreadPage({ params }: PageProps) {
  const { threadId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [thread, setThread] = useState<InterestThread | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(true);
  
  // Match via avatar tap
  const [showMatchConfirm, setShowMatchConfirm] = useState(false);
  const [matching, setMatching] = useState(false);
  
  // Media upload
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Message actions
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [actionMenu, setActionMenu] = useState<{
    messageId: string; x: number; y: number;
    isOwn: boolean; content: string; senderName: string;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<{
    id: string; content: string; senderName: string;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string; originalContent: string;
  } | null>(null);

  // Verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Build a unified timeline merging messages and screening answers
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    messages.forEach((msg) => {
      items.push({ type: 'message', data: msg, createdAt: msg.createdAt });
    });

    if (thread?.screeningAnswers) {
      thread.screeningAnswers.forEach((ans) => {
        items.push({ type: 'answer', data: ans, createdAt: ans.createdAt });
      });
    }

    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return items;
  }, [messages, thread?.screeningAnswers]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/interest/' + threadId);
    }
  }, [authLoading, user, router, threadId]);

  useEffect(() => {
    if (user) loadData();
  }, [user, threadId]);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Poll for new messages
  useEffect(() => {
    if (!thread?.conversationId) return;
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [thread?.conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const threadData = await interestThreadsApi.getThread(threadId);
      setThread(threadData);

      const qs = await interestThreadsApi.getQuestionsForPost(threadData.postId);
      setQuestions(qs);

      if (threadData.screeningAnswers) {
        const existingAnswers: Record<string, string> = {};
        const answered = new Set<string>();
        threadData.screeningAnswers.forEach((a) => {
          existingAnswers[a.questionId] = a.answer;
          answered.add(a.questionId);
        });
        setAnswers(existingAnswers);
        setAnsweredQuestions(answered);
      }

      if (threadData.conversationId) {
        await loadMessages(threadData.conversationId);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId?: string) => {
    const conversationId = convId || thread?.conversationId;
    if (!conversationId) return;
    try {
      const res = await chatApi.getMessages(conversationId, 1, 100);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  // --- Message action handlers ---
  const handleReply = useCallback((msg: Message) => {
    setReplyTo({ id: msg.id, content: msg.content, senderName: msg.sender.name });
    setEditingMessage(null);
    setActionMenu(null);
    inputRef.current?.focus();
  }, []);

  const handleEdit = useCallback((msg: Message) => {
    setEditingMessage({ id: msg.id, originalContent: msg.content });
    setNewMessage(msg.content);
    setReplyTo(null);
    setActionMenu(null);
    inputRef.current?.focus();
  }, []);

  const handleDelete = useCallback(async (msgId: string) => {
    setActionMenu(null);
    if (!confirm('Are you sure you want to delete this message?')) return;
    if (!thread?.conversationId) return;
    try {
      await chatApi.deleteMessage(thread.conversationId, msgId);
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: '', isDeleted: true } : m
      ));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  }, [thread?.conversationId]);

  const cancelEditReply = useCallback(() => {
    setEditingMessage(null);
    setReplyTo(null);
    setNewMessage('');
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    if (msg.isDeleted) return;
    e.preventDefault();
    setActionMenu({
      messageId: msg.id,
      x: e.clientX,
      y: e.clientY,
      isOwn: msg.senderId === user?.id,
      content: msg.content,
      senderName: msg.sender.name,
    });
  }, [user?.id]);

  const handleTouchStart = useCallback((msg: Message) => {
    if (msg.isDeleted) return;
    longPressTimerRef.current = setTimeout(() => {
      setActionMenu({
        messageId: msg.id,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        isOwn: msg.senderId === user?.id,
        content: msg.content,
        senderName: msg.sender.name,
      });
    }, 500);
  }, [user?.id]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const findMessage = useCallback((id: string) => messages.find(m => m.id === id), [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !thread?.conversationId || sending) return;

    const content = newMessage.trim();

    // Client-side phone number check — premium users are exempt
    if (user?.subscriptionTier !== 'premium' && containsPhoneNumber(content)) {
      setShowPremiumModal(true);
      return;
    }

    setNewMessage('');
    setSending(true);

    try {
      if (editingMessage) {
        // Edit mode
        const updated = await chatApi.editMessage(thread.conversationId, editingMessage.id, content);
        setMessages(prev => prev.map(m =>
          m.id === editingMessage.id ? { ...m, content, isEdited: true } : m
        ));
        setEditingMessage(null);
      } else {
        // Send mode (with optional reply)
        const msg = await chatApi.sendMessage(thread.conversationId, content, replyTo?.id);
        setMessages(prev => [...prev, msg]);
        setReplyTo(null);
        // Scroll to own message after sending
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err: any) {
      console.error('Failed to send message', err);
      const code = err?.code || err?.response?.data?.code;
      if (code === 'VERIFICATION_REQUIRED') {
        setShowVerificationModal(true);
      } else if (code === 'PHONE_NUMBER_DETECTED') {
        setShowPremiumModal(true);
      }
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Escape') {
      cancelEditReply();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !thread?.conversationId || uploading) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    try {
      setUploading(true);
      const msg = await chatApi.sendImageMessage(thread.conversationId, file);
      setMessages(prev => [...prev, msg]);
    } catch (err: any) {
      console.error('Failed to send image', err);
      if (err?.code === 'VERIFICATION_REQUIRED' || err?.response?.data?.code === 'VERIFICATION_REQUIRED') {
        setShowVerificationModal(true);
      } else {
        toast.error('Failed to send image');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !thread?.conversationId || uploading) return;
    e.target.value = '';

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Video must be under 25MB');
      return;
    }

    try {
      setUploading(true);
      const msg = await chatApi.sendVideoMessage(thread.conversationId, file);
      setMessages(prev => [...prev, msg]);
    } catch (err: any) {
      console.error('Failed to send video', err);
      if (err?.code === 'VERIFICATION_REQUIRED' || err?.response?.data?.code === 'VERIFICATION_REQUIRED') {
        setShowVerificationModal(true);
      } else {
        toast.error('Failed to send video');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answerText = answers[questionId]?.trim();
    if (!answerText) return;

    // Client-side phone number check — premium users are exempt
    if (user?.subscriptionTier !== 'premium' && containsPhoneNumber(answerText)) {
      setShowPremiumModal(true);
      return;
    }

    try {
      setSubmitting(true);
      await interestThreadsApi.saveAnswer(threadId, questionId, answerText);
      setAnsweredQuestions((prev) => new Set([...prev, questionId]));
      setExpandedQuestion(null);
      // Reload thread so the new answer appears in the timeline
      const updatedThread = await interestThreadsApi.getThread(threadId);
      setThread(updatedThread);
    } catch (err: any) {
      console.error('Failed to save answer', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Tap avatar to match
  const handleAvatarTap = useCallback(() => {
    const canMatch = user?.id === thread?.postOwnerId ||
      (user?.role === 'admin' && thread?.postOwner?.role === 'admin');
    if (!canMatch) return;
    if (thread?.status === 'matched' || thread?.status === 'closed' || thread?.status === 'withdrawn') return;

    setShowMatchConfirm(true);
    if (navigator.vibrate) navigator.vibrate(50);
  }, [user?.id, user?.role, thread?.postOwnerId, thread?.postOwner?.role, thread?.status]);

  const handleMatch = async () => {
    if (!thread) return;

    try {
      setMatching(true);
      await interestThreadsApi.matchThread(threadId);
      setShowMatchConfirm(false);
      await loadData();
    } catch (err: any) {
      console.error('Failed to match', err);
      toast.error(err?.message || 'Failed to match');
    } finally {
      setMatching(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Withdraw your interest?')) return;
    try {
      await interestThreadsApi.withdrawInterest(threadId);
      router.push('/');
    } catch (err) {
      console.error('Failed to withdraw', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peach-50)] dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--peach-50)] dark:bg-neutral-950 p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Not found'}</p>
          <button onClick={() => router.back()} className="text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const owner = thread.postOwner;
  const post = thread.post;
  const isMatched = thread.status === 'matched';
  const isClosed = thread.status === 'closed' || thread.status === 'withdrawn';
  const isOwner = user?.id === thread.postOwnerId || user?.role === 'admin';
  const isMatchedPerson = user?.id === thread.interestedUserId;
  const isAdminThread = owner?.role === 'admin';
  const otherUser = isOwner ? thread.interestedUser : owner;
  // When the "other user" is an admin, show platform identity
  const otherUserDisplayName = (!isOwner && isAdminThread) ? PLATFORM_NAME : (otherUser?.name || 'User');
  const otherUserDisplayAvatar = (!isOwner && isAdminThread) ? PLATFORM_LOGO : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--peach-50)] dark:bg-neutral-950">
      {/* Verification Required Modal */}
      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onContactSupport={() => {
          setShowVerificationModal(false);
          router.push('/messages/support');
        }}
      />

      {/* Premium Required Modal (phone number sharing) */}
      <PremiumRequiredModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Share Contact Details"
        description="Sharing phone numbers and contact details is a Premium feature. Upgrade to share your number directly in chats."
        secondaryLabel="Maybe Later"
      />

      {/* Header - fixed at top */}
      <header className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-[var(--peach-200)] dark:border-neutral-800 z-10 safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {otherUserDisplayAvatar ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
                  <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-6 h-6" />
                </div>
              ) : otherUser?.avatar ? (
                <Image
                  src={resolveImageUrl(otherUser.avatar) || ''}
                  alt={otherUser.name || ''}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] flex items-center justify-center text-neutral-800 font-semibold">
                  {otherUser?.name?.charAt(0) || <User className="w-5 h-5" />}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "font-semibold truncate",
                  (!isOwner && isAdminThread) ? "text-[var(--teal-600)] dark:text-[var(--teal-400)]" : "text-neutral-900 dark:text-neutral-100"
                )}>
                  {otherUserDisplayName}
                </span>
                {(!isOwner && isAdminThread) ? (
                  <Shield className="w-4 h-4 text-[var(--teal-500)]" />
                ) : null}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {post?.location || 'Interest Thread'}
              </p>
            </div>
          </div>

          <button className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800">
            <MoreVertical className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Status banner - only show to non-participants (the matched person sees normal thread) */}
        {isMatched && !isMatchedPerson && !isOwner && (
          <div className="px-4 py-2 bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 flex items-center gap-2 border-t border-[var(--lime-200)] dark:border-[var(--lime-500)]/20">
            <Sparkles className="w-4 h-4 text-[var(--lime-600)] dark:text-[var(--lime-400)]" />
            <span className="text-sm font-medium text-[var(--lime-600)] dark:text-[var(--lime-400)]">This post has been matched.</span>
          </div>
        )}

        {/* Move-In Agreement CTA — visible to matched participants */}
        {isMatched && (isMatchedPerson || isOwner) && (
          <Link href={`/my-interests/${thread.id}/move-in-agreement`}
            className="block px-4 py-3 bg-gradient-to-r from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-500)]/5 dark:to-[var(--lime-500)]/5 border-t border-[var(--teal-200)] dark:border-[var(--teal-500)]/20 hover:from-[var(--teal-100)] hover:to-[var(--lime-100)] dark:hover:from-[var(--teal-500)]/10 dark:hover:to-[var(--lime-500)]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--teal-500)] to-[var(--lime-500)] flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--teal-700)] dark:text-[var(--teal-400)]">
                  {isMatchedPerson ? 'Complete Move-In Agreement' : 'Review Move-In Agreement'}
                </span>
                <p className="text-[11px] text-[var(--teal-600)]/70 dark:text-[var(--teal-400)]/50">
                  {isMatchedPerson ? 'Fill in your details to finalize the arrangement' : 'View tenant details and approve'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--teal-500)] rotate-[-90deg] flex-shrink-0" />
            </div>
          </Link>
        )}

        {isClosed && !isMatched && (
          <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-500">Thread closed</span>
          </div>
        )}

        {/* Hint for owner */}
        {isOwner && !isMatched && !isClosed && (
          <div className="px-4 py-2 bg-[var(--lavender-50)] dark:bg-[var(--lavender-400)]/5 border-t border-[var(--lavender-100)] dark:border-[var(--lavender-400)]/10">
            <span className="text-xs text-[var(--lavender-600)] dark:text-[var(--lavender-400)]">
              💡 Tap their avatar to match with this person
            </span>
          </div>
        )}
      </header>

      {/* Messages Area - scrollable */}
      <div className="flex-1 relative overflow-hidden">
      <div
        ref={messagesContainerRef}
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          
          {/* Post info card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-[var(--peach-200)] dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[var(--teal-500)]" />
              <span className="text-neutral-700 dark:text-neutral-300">{post?.location || 'Subscription Split'}</span>
              {post?.budget && post.budget > 0 && (
                <span className="ml-auto font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                  ₦{post.budget.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Subscription details card */}
          {post?.postType === 'subscription-split' && (post as any)?.subscriptionName && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-violet-200 dark:border-violet-500/20">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Repeat2 className="w-4 h-4 text-violet-500" />
                <span className="font-medium text-violet-700 dark:text-violet-400">{(post as any).subscriptionName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                {(post as any)?.subscriptionCostPerPerson != null && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[var(--lime-500)]" />
                    <span className="font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                      ₦{(post as any).subscriptionCostPerPerson.toLocaleString()}/person
                    </span>
                  </div>
                )}
                <span className="text-neutral-500 text-xs">
                  Handler: {owner?.name?.split(' ')[0] || 'Post Owner'}
                </span>
              </div>
              {(post as any)?.subscriptionTotalCost != null && (
                <p className="text-xs text-neutral-400 mt-1">
                  Total: ₦{(post as any).subscriptionTotalCost.toLocaleString()}/month
                </p>
              )}
            </div>
          )}

          {/* Grocery details card */}
          {post?.postType === 'grocery-split' && (post as any)?.groceryItemName && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-green-200 dark:border-green-500/20">
              <div className="flex items-center gap-2 text-sm mb-2">
                <ShoppingBasket className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">{(post as any).groceryItemName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                {(post as any)?.groceryCostPerPerson != null && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[var(--lime-500)]" />
                    <span className="font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                      ₦{(post as any).groceryCostPerPerson.toLocaleString()}/person
                    </span>
                  </div>
                )}
                <span className="text-neutral-500 text-xs">
                  Handler: {owner?.name?.split(' ')[0] || 'Post Owner'}
                </span>
              </div>
              {(post as any)?.groceryTotalCost != null && (
                <p className="text-xs text-neutral-400 mt-1">
                  Total: ₦{(post as any).groceryTotalCost.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Carpool Meetup QR Code */}
          {isMatched && (post?.postType === 'carpool-offer' || post?.postType === 'carpool-request') && (() => {
            const myToken = isOwner ? thread.meetupTokenOwner : thread.meetupTokenInterested;
            const theyConfirmedMe = isOwner
              ? !!thread.meetupConfirmedByInterestedAt
              : !!thread.meetupConfirmedByOwnerAt;
            const iConfirmedThem = isOwner
              ? !!thread.meetupConfirmedByOwnerAt
              : !!thread.meetupConfirmedByInterestedAt;

            if (!myToken) return null;

            const qrUrl = `https://letsgohalf.com/verify-meetup/${myToken}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=1a1a1a`;

            return (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-[var(--teal-200)] dark:border-[var(--teal-500)]/20">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-[var(--teal-500)]" />
                  <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    Your Meetup QR Code
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  Show this to {otherUserDisplayName} so they can scan it to verify it&apos;s you
                </p>
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-xl p-2">
                    <img
                      src={qrImageUrl}
                      alt="Your meetup QR code"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn(
                      "w-4 h-4",
                      theyConfirmedMe ? "text-[var(--lime-500)]" : "text-neutral-300 dark:text-neutral-600"
                    )} />
                    <span className={cn(
                      theyConfirmedMe
                        ? "text-[var(--lime-600)] dark:text-[var(--lime-400)]"
                        : "text-neutral-400 dark:text-neutral-500"
                    )}>
                      {theyConfirmedMe
                        ? `${otherUserDisplayName} verified you`
                        : `Waiting for ${otherUserDisplayName} to scan your QR`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={cn(
                      "w-4 h-4",
                      iConfirmedThem ? "text-[var(--lime-500)]" : "text-neutral-300 dark:text-neutral-600"
                    )} />
                    <span className={cn(
                      iConfirmedThem
                        ? "text-[var(--lime-600)] dark:text-[var(--lime-400)]"
                        : "text-neutral-400 dark:text-neutral-500"
                    )}>
                      {iConfirmedThem
                        ? `You verified ${otherUserDisplayName}`
                        : `Scan ${otherUserDisplayName}'s QR to verify them`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Questions section - collapsible, only for the interested user */}
          {questions.length > 0 && !isClosed && !isOwner && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--peach-200)] dark:border-neutral-800 overflow-hidden">
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Quick Questions ({answeredQuestions.size}/{questions.length})
                </span>
                {showQuestions ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
              </button>

              {showQuestions && (
                <div className="border-t border-[var(--peach-100)] dark:border-neutral-800">
                  {questions.map((q) => {
                    const isAnswered = answeredQuestions.has(q.id);
                    const isExpanded = expandedQuestion === q.id;
                    const answer = answers[q.id] || '';

                    return (
                      <div key={q.id} className="border-b border-[var(--peach-100)] dark:border-neutral-800 last:border-b-0">
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                            isAnswered ? "bg-[var(--lime-500)] text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400"
                          )}>
                            {isAnswered ? <Check className="w-3 h-3" /> : <span className="text-xs">?</span>}
                          </div>
                          <span className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">{q.question}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3">
                            <textarea
                              value={answer}
                              onChange={(e) => handleAnswerQuestion(q.id, e.target.value)}
                              placeholder="Your answer..."
                              className="w-full p-3 bg-[var(--peach-50)] dark:bg-neutral-800 rounded-xl resize-none text-sm border-0 focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100"
                              rows={2}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleSubmitAnswer(q.id)}
                                disabled={!answer.trim() || submitting}
                                className="px-3 py-1.5 bg-[var(--teal-500)] text-white rounded-full text-xs font-medium disabled:opacity-50"
                              >
                                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Unified timeline: messages + screening answers */}
          {timeline.map((item, idx) => {
            if (item.type === 'message') {
              const msg = item.data;
              const isMe = msg.senderId === user?.id;
              const isAdminMsg = msg.sender?.role === 'admin';
              // For avatar grouping, check if previous timeline item is a message from the same sender
              const prevItem = timeline[idx - 1];
              const prevSameSender = prevItem?.type === 'message' && prevItem.data.senderId === msg.senderId;
              const showAvatar = !isMe && !prevSameSender;
              const showName = !isMe && showAvatar;
              const userColor = getUserColor(msg.senderId);

              return (
                <div
                  key={`msg-${msg.id}`}
                  className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  onTouchStart={() => handleTouchStart(msg)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  {!isMe && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        isAdminMsg ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center ring-2 ring-white dark:ring-neutral-800">
                            <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-5 h-5" />
                          </div>
                        ) : (
                          <div
                            onClick={handleAvatarTap}
                            className={cn(
                              "w-8 h-8 rounded-full ring-2 ring-white dark:ring-neutral-800 overflow-hidden",
                              isOwner && !isMatched && !isClosed && "cursor-pointer active:scale-95 transition-transform"
                            )}
                          >
                            {msg.sender.avatar ? (
                              <Image
                                src={resolveImageUrl(msg.sender.avatar) || ''}
                                alt={msg.sender.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={cn(
                                "w-full h-full flex items-center justify-center text-xs font-bold",
                                userColor.bg, userColor.text
                              )}>
                                {msg.sender.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="max-w-[75%]">
                    {showName && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        {isAdminMsg ? (
                          <>
                            <Shield className="w-3 h-3 text-[var(--teal-500)]" />
                            <p className="text-sm font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                              {PLATFORM_NAME}
                            </p>
                          </>
                        ) : (
                          <>
                            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", userColor.dot)} />
                            <p className={cn("text-sm font-semibold", userColor.text)}>
                              {msg.sender.name.split(' ')[0]}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl",
                      msg.isDeleted
                        ? "px-4 py-2 bg-neutral-100 dark:bg-neutral-800/50"
                        : msg.messageType === 'video' || msg.messageType === 'image' ? "overflow-hidden" : "px-4 py-2",
                      !msg.isDeleted && (isMe
                        ? "bg-[var(--teal-500)] text-white rounded-br-md"
                        : cn("rounded-bl-md border-l-[3px]", userColor.bg, userColor.border))
                    )}>
                      {/* Reply preview in bubble */}
                      {msg.replyTo && !msg.isDeleted && (
                        <div className="flex gap-2 mb-2 pb-2 border-b border-black/10 dark:border-white/10">
                          <div className="w-1 rounded-full bg-[var(--teal-400)] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                              {msg.replyTo.sender?.name || 'Unknown'}
                            </p>
                            <p className={cn(
                              "text-xs truncate",
                              isMe ? "text-white/70" : "text-neutral-600 dark:text-neutral-400"
                            )}>
                              {msg.replyTo.content}
                            </p>
                          </div>
                        </div>
                      )}
                      {msg.isDeleted ? (
                        <p className="text-sm italic text-neutral-400 dark:text-neutral-500">
                          🚫 This message was deleted
                        </p>
                      ) : msg.messageType === 'video' && msg.attachmentUrl ? (
                        <video
                          src={msg.attachmentUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="rounded-xl max-w-full"
                        />
                      ) : msg.messageType === 'image' && msg.attachmentUrl ? (
                        <img
                          src={msg.attachmentUrl}
                          alt="Shared image"
                          loading="lazy"
                          className="max-w-full rounded-xl cursor-pointer"
                          onClick={() => window.open(msg.attachmentUrl, '_blank')}
                        />
                      ) : (
                        <p className={cn(
                          "text-sm whitespace-pre-wrap",
                          isMe ? "text-white" : "text-neutral-900 dark:text-neutral-100"
                        )}>{msg.content}</p>
                      )}
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        msg.messageType === 'video' || msg.messageType === 'image' ? "px-3 pb-2" : "",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        {msg.isEdited && !msg.isDeleted && (
                          <span className={cn("text-[10px] italic mr-1", isMe ? "text-white/60" : "text-neutral-400")}>
                            (edited)
                          </span>
                        )}
                        <span className={cn("text-[10px]", isMe ? "text-white/70" : "text-neutral-400")}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMe && !msg.isDeleted && (
                          msg.isRead
                            ? <CheckCheck className="w-3 h-3 text-white/70" />
                            : <Check className="w-3 h-3 text-white/70" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Screening answer bubble — always from the interested user
            const ans = item.data;
            const answerSenderId = thread?.interestedUserId || '';
            const isMe = answerSenderId === user?.id;
            const answerUser = thread?.interestedUser;
            const userColor = getUserColor(answerSenderId);

            return (
              <div
                key={`ans-${ans.id}`}
                className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
              >
                {!isMe && (
                  <div className="w-8 flex-shrink-0">
                    {answerUser?.avatar ? (
                      <Image
                        src={resolveImageUrl(answerUser.avatar) || ''}
                        alt={answerUser.name || ''}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800"
                      />
                    ) : (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        userColor.bg, userColor.text
                      )}>
                        {answerUser?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                )}

                <div className="max-w-[75%]">
                  <div className={cn(
                    "px-4 py-2 rounded-2xl",
                    isMe
                      ? "bg-[var(--teal-500)] text-white rounded-br-md"
                      : cn("rounded-bl-md border-l-[3px]", userColor.bg, userColor.border)
                  )}>
                    {/* WhatsApp-style quoted question */}
                    <div className={cn(
                      "rounded-lg px-3 py-1.5 mb-2 border-l-[3px]",
                      isMe
                        ? "bg-white/15 border-l-white/40"
                        : "bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/10 border-l-[var(--lime-500)]"
                    )}>
                      <p className={cn(
                        "text-xs font-medium",
                        isMe ? "text-white/80" : "text-[var(--lime-700)] dark:text-[var(--lime-400)]"
                      )}>
                        {ans.question?.question || 'Screening Question'}
                      </p>
                    </div>
                    <p className={cn(
                      "text-sm whitespace-pre-wrap",
                      isMe ? "text-white" : "text-neutral-900 dark:text-neutral-100"
                    )}>{ans.answer}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      isMe ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn("text-[10px]", isMe ? "text-white/70" : "text-neutral-400")}>
                        {formatTime(ans.createdAt)}
                      </span>
                      {isMe && <Check className="w-3 h-3 text-white/70" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 shadow-md flex items-center justify-center text-neutral-500 hover:text-[var(--teal-500)] transition-colors z-10"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
      </div>

      {/* Message Input - fixed at bottom */}
      {!isClosed && (
        !user?.isVerified ? (
          <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-t border-[var(--peach-200)] dark:border-neutral-800 safe-area-bottom">
            <div className="max-w-2xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Verification required</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Verify your identity to send messages</p>
                </div>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-full hover:bg-amber-600 transition-colors flex-shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-t border-[var(--peach-200)] dark:border-neutral-800 safe-area-bottom">
            {/* Reply / Edit preview bar */}
            {(replyTo || editingMessage) && (
              <div className="border-b border-[var(--peach-100)] dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
                  <div className="w-1 h-10 rounded-full bg-[var(--teal-400)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingMessage ? (
                      <>
                        <p className="text-xs font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                          Editing message
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {editingMessage.originalContent}
                        </p>
                      </>
                    ) : replyTo ? (
                      <>
                        <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                          Replying to {replyTo.senderName}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {replyTo.content}
                        </p>
                      </>
                    ) : null}
                  </div>
                  <button
                    onClick={cancelEditReply}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
            <div className="max-w-2xl mx-auto flex items-end gap-2 px-3 py-2 sm:px-4 sm:py-3">
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading || sending}
                className="p-2.5 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors flex-shrink-0 disabled:opacity-50"
                title="Send image"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-neutral-400" /> : <ImageIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading || sending}
                className="p-2.5 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors flex-shrink-0 disabled:opacity-50"
                title="Send video"
              >
                <Video className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              </button>
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 bg-[var(--peach-50)] dark:bg-neutral-800 rounded-2xl resize-none text-sm border-0 focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 max-h-24"
                rows={1}
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || uploading}
                className={cn(
                  "p-2.5 sm:p-3 text-white rounded-full disabled:opacity-50 transition-colors flex-shrink-0",
                  editingMessage
                    ? "bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] hover:from-[var(--teal-500)] hover:to-[var(--lime-500)]"
                    : "bg-[var(--teal-500)] hover:bg-[var(--teal-600)]"
                )}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )
      )}

      {/* Action Menu */}
      {actionMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setActionMenu(null)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden min-w-[180px]"
            style={{
              left: Math.min(actionMenu.x, typeof window !== 'undefined' ? window.innerWidth - 200 : 200),
              top: Math.min(actionMenu.y, typeof window !== 'undefined' ? window.innerHeight - 200 : 200),
              transform: 'translate(-50%, -50%)',
            }}
          >
            <button
              onClick={() => {
                const msg = findMessage(actionMenu.messageId);
                if (msg) handleReply(msg);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors text-left"
            >
              <Reply className="w-4 h-4 text-[var(--teal-500)]" />
              <span className="text-sm text-neutral-800 dark:text-neutral-200">Reply</span>
            </button>
            {actionMenu.isOwn && (
              <>
                <button
                  onClick={() => {
                    const msg = findMessage(actionMenu.messageId);
                    if (msg) handleEdit(msg);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors text-left"
                >
                  <Pencil className="w-4 h-4 text-[var(--lime-600)]" />
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(actionMenu.messageId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">Delete</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Match confirmation modal */}
      {showMatchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[var(--lime-600)] dark:text-[var(--lime-400)]" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Match with {otherUserDisplayName.split(' ')[0]}?
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Once you match, this thread will be closed and no one else can join. 
                You'll still be able to see the conversation history.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMatchConfirm(false)}
                  className="flex-1 py-3 px-4 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMatch}
                  disabled={matching}
                  className="flex-1 py-3 px-4 bg-[var(--lime-500)] text-white rounded-xl font-medium hover:bg-[var(--lime-600)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {matching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Match
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
