'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Smile,
  ArrowLeft,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  MicOff,
  MapPin,
  Home,
  Star,
  MessageSquare,
  Loader2,
  Reply,
  Pencil,
  Trash2,
  X,
  User,
  BellOff,
  Ban,
  Eraser,
  Square,
  Play,
  Pause,
  AlertTriangle,
  Shield,
  ChevronRight,
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/AppLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { chatApi, Conversation, Message } from '@/lib/api/chat';
import { ChatMessage, MessageEditedEvent, MessageDeletedEvent } from '@/lib/socket';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import VerificationRequiredModal from '@/components/VerificationRequiredModal';
import PremiumRequiredModal from '@/components/PremiumRequiredModal';
import { PLATFORM_NAME, PLATFORM_LOGO } from '@/lib/constants/platform';

// Unverified User Warning Banner
const UnverifiedWarningBanner = ({ name }: { name: string }) => {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-[var(--yellow-100)] dark:bg-yellow-500/10 border-b border-[var(--yellow-300)] dark:border-yellow-500/20"
    >
      <div className="flex items-start gap-3 px-5 py-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-200 dark:bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {name} hasn&apos;t verified their identity
          </p>
          <p className="text-xs text-yellow-700/80 dark:text-yellow-400/70 mt-0.5 leading-relaxed">
            Be cautious when sharing personal details or making arrangements with unverified users. Ask them to verify for added trust.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-yellow-200 dark:hover:bg-yellow-500/20 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
        </button>
      </div>
    </motion.div>
  );
};

// Chat filter options
const chatFilters = ['All', 'Unread', 'Interested', 'Archived'];

// Conversation List Item Component
const ConversationItem = ({
  convo,
  onClick,
  isSelected = false,
  index,
  isOnline = false,
}: {
  convo: Conversation;
  onClick: () => void;
  isSelected?: boolean;
  index: number;
  isOnline?: boolean;
}) => {
  const isAdminConvo = convo.participant?.role === 'admin';
  const displayName = isAdminConvo ? `${PLATFORM_NAME} Support` : (convo.participant?.name?.split(' ')[0] || 'Unknown');
  const displayAvatar = isAdminConvo ? PLATFORM_LOGO : (convo.participant?.avatar || '');

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <motion.button
      key={convo.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-2xl backdrop-blur-sm transition-all",
        isSelected
          ? "bg-gradient-to-r from-[var(--lime-100)] to-[var(--yellow-100)] dark:from-[var(--lime-500)]/20 dark:to-[var(--yellow-500)]/20"
          : "bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-800"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isAdminConvo ? (
          <div className="w-14 h-14 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] ring-2 ring-white dark:ring-neutral-700 shadow-sm flex items-center justify-center">
            <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-8 h-8 lg:w-7 lg:h-7" />
          </div>
        ) : (
          <Avatar className="w-14 h-14 lg:w-12 lg:h-12 ring-2 ring-white dark:ring-neutral-700 shadow-sm">
            <AvatarImage src={convo.participant?.avatar || ''} alt={convo.participant?.name || ''} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)]">
              {convo.participant?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </AvatarFallback>
          </Avatar>
        )}
        {isOnline && !isAdminConvo && (
          <span className="absolute bottom-0 right-0 w-4 h-4 lg:w-3 lg:h-3 bg-[var(--lime-500)] rounded-full border-2 border-white dark:border-neutral-800" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-semibold truncate",
              isAdminConvo ? "text-[var(--teal-600)] dark:text-[var(--teal-400)]" : "text-neutral-900 dark:text-neutral-100"
            )}>
              {displayName}
            </span>
            {isAdminConvo ? (
              <Shield className="w-4 h-4 text-[var(--teal-500)]" />
            ) : null}
          </div>
          <span className={cn(
            "text-xs",
            convo.unreadCount > 0 ? "text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium" : "text-neutral-500"
          )}>
            {formatTime(convo.lastMessageAt)}
          </span>
        </div>

        {convo.postId && (
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin className="w-3 h-3 text-[var(--teal-500)] flex-shrink-0" />
            <span className="text-xs text-[var(--teal-600)] dark:text-[var(--teal-400)]">
              Listing inquiry
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm truncate pr-4",
            convo.unreadCount > 0
              ? "text-neutral-800 dark:text-neutral-200 font-medium"
              : "text-neutral-500"
          )}>
            {convo.lastMessage || 'No messages yet'}
          </p>
          {convo.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] text-xs font-bold flex items-center justify-center">
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// Chat List Sidebar Component
const ChatListSidebar = ({
  conversations,
  loading,
  onSelectChat,
  selectedChatId = null,
  isDesktopSidebar = false,
  onlineUsers,
  onSupportClick,
  supportLoading = false,
}: {
  conversations: Conversation[];
  loading: boolean;
  onSelectChat: (id: string) => void;
  selectedChatId?: string | null;
  isDesktopSidebar?: boolean;
  onlineUsers: Set<string>;
  onSupportClick?: () => void;
  supportLoading?: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Filter conversations
  const filteredConversations = conversations.filter(convo => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        convo.participant?.name?.toLowerCase().includes(query) ||
        convo.lastMessage?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Tab filter
    switch (activeFilter) {
      case 'Unread':
        return convo.unreadCount > 0;
      case 'Interested':
        return convo.participant?.isVerified;
      case 'Archived':
        return false;
      default:
        return true;
    }
  });

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

  return (
    <div className={cn(
      isDesktopSidebar
        ? "h-full flex flex-col bg-white/50 dark:bg-neutral-900/50 rounded-2xl overflow-hidden"
        : ""
    )}>
      {/* Header */}
      <div className={cn("px-5 pt-4 pb-2", isDesktopSidebar && "border-b border-[var(--peach-200)] dark:border-neutral-800")}>
        {isDesktopSidebar && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Conversations
            </h2>
            {unreadCount > 0 && (
              <span className="badge badge-lime text-xs">
                {unreadCount} new
              </span>
            )}
          </div>
        )}

        {/* Support Banner */}
        <button
          onClick={onSupportClick}
          disabled={supportLoading}
          className="w-full mb-4 p-3 rounded-2xl bg-gradient-to-r from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-500)]/10 dark:to-[var(--lime-500)]/10 border border-[var(--teal-200)] dark:border-[var(--teal-500)]/20 hover:from-[var(--teal-100)] hover:to-[var(--lime-100)] dark:hover:from-[var(--teal-500)]/20 dark:hover:to-[var(--lime-500)]/20 transition-all flex items-center gap-3 disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center flex-shrink-0">
            {supportLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-6 h-6" />
            )}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[var(--teal-700)] dark:text-[var(--teal-300)]">
                {PLATFORM_NAME} Support
              </span>
              <Shield className="w-3.5 h-3.5 text-[var(--teal-500)]" />
            </div>
            <p className="text-xs text-[var(--teal-600)]/70 dark:text-[var(--teal-400)]/70 truncate">
              Questions, ads, help — we're here
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--teal-400)] flex-shrink-0 ml-auto" />
        </button>

        {/* Search */}
        <div className="search-input mb-4">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {chatFilters.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                activeFilter === tab
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-white/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
              )}
            >
              {tab}
              {tab === 'Unread' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-[var(--lime-400)] text-[#212121]">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className={cn("px-5 pt-4 space-y-2", isDesktopSidebar && "flex-1 overflow-y-auto pb-4")}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500 text-sm">
              {activeFilter === 'Archived' ? 'No archived conversations' :
               activeFilter === 'Unread' ? 'No unread messages' :
               searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          filteredConversations.map((convo, i) => (
            <ConversationItem
              key={convo.id}
              convo={convo}
              onClick={() => onSelectChat(convo.id)}
              isSelected={selectedChatId === convo.id}
              index={i}
              isOnline={convo.participant ? onlineUsers.has(convo.participant.id) : false}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Voice Message Player Component
const VoiceMessagePlayer = ({
  messageId,
  attachmentUrl,
  duration,
  isOwn,
}: {
  messageId: string;
  attachmentUrl: string;
  duration?: number;
  isOwn: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const totalDuration = duration || 0;

  // If it's already an absolute URL (R2), use directly; otherwise use streaming endpoint
  const audioSrc = attachmentUrl.startsWith('http')
    ? attachmentUrl
    : `${process.env.NEXT_PUBLIC_API_URL}/upload/audio/${attachmentUrl.split('/').pop() || ''}`;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioSrc;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    audio.addEventListener('error', () => {
      setError(true);
    });
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioSrc]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current || error) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setError(true));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 min-w-[180px] opacity-60">
        <Mic className="w-5 h-5" />
        <span className="text-sm italic">Voice message unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={togglePlay}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          isOwn
            ? "bg-neutral-900/10 hover:bg-neutral-900/20"
            : "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 hover:bg-[var(--teal-200)]"
        )}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <div className="relative h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all",
              isOwn ? "bg-neutral-900/40" : "bg-[var(--teal-500)]"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] opacity-70 mt-1 block">
          {isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
};

// Message Action Menu
interface ActionMenuState {
  messageId: string;
  x: number;
  y: number;
  isOwn: boolean;
  content: string;
  senderName: string;
}

// Chat Options Menu Item
interface ChatOptionsMenuState {
  isOpen: boolean;
}

// Chat Detail View
const ChatDetail = ({
  conversationId,
  conversation,
  onBack,
  isEmbedded = false,
  onlineUsers,
  onMessageSent,
}: {
  conversationId: string;
  conversation: Conversation | null;
  onBack: () => void;
  isEmbedded?: boolean;
  onlineUsers: Set<string>;
  onMessageSent?: (conversationId: string, content: string) => void;
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const {
    joinChat, leaveChat,
    sendMessage: socketSendMessage,
    editMessage: chatEditMessage,
    deleteMessage: chatDeleteMessage,
    setTyping, markAsRead, typingUsers,
    setOnNewMessage, setOnMessageEdited, setOnMessageDeleted,
  } = useChat();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Action menu state
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);

  // Edit state
  const [editingMessage, setEditingMessage] = useState<{ id: string; originalContent: string } | null>(null);

  // Chat options menu state
  const [chatOptionsOpen, setChatOptionsOpen] = useState(false);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Verification required modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const isOnline = conversation?.participant ? onlineUsers.has(conversation.participant.id) : false;
  const isAdminConvo = conversation?.participant?.role === 'admin';

  // Check if other user is typing in this conversation
  const otherUserTyping = Array.from(typingUsers.values()).find(
    t => t.conversationId === conversationId && t.userId !== user?.id
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await chatApi.getMessages(conversationId);
        setMessages(response.data);
        // Mark all as read
        const unreadIds = response.data
          .filter(m => !m.isRead && m.senderId !== user?.id)
          .map(m => m.id);
        if (unreadIds.length > 0) {
          markAsRead(conversationId, unreadIds);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    joinChat(conversationId);

    // Check block status
    if (conversation?.participant?.id) {
      chatApi.checkBlocked(conversation.participant.id)
        .then(res => setIsBlocked(res.isBlocked))
        .catch(() => {});
    }

    // Set mute status from conversation data
    if (conversation?.isMuted !== undefined) {
      setIsMuted(conversation.isMuted);
    }

    return () => {
      leaveChat(conversationId);
    };
  }, [conversationId, joinChat, leaveChat, markAsRead, user?.id, conversation?.participant?.id, conversation?.isMuted]);

  // Handle new incoming messages (Task 1: fix dedup)
  useEffect(() => {
    setOnNewMessage((msg: ChatMessage) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            sender: msg.sender,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
            replyToId: msg.replyToId,
            replyTo: msg.replyTo,
            isEdited: msg.isEdited,
            isDeleted: msg.isDeleted,
            isSupport: msg.isSupport,
            messageType: msg.messageType,
            attachmentUrl: msg.attachmentUrl,
            attachmentDuration: msg.attachmentDuration,
          }];
        });
        // Mark as read immediately
        markAsRead(conversationId, [msg.id]);
        scrollToBottom();
      }
    });

    return () => {
      setOnNewMessage(null);
    };
  }, [conversationId, markAsRead, setOnNewMessage, scrollToBottom]);

  // Handle message edited events
  useEffect(() => {
    setOnMessageEdited((event: MessageEditedEvent) => {
      if (event.conversationId === conversationId) {
        setMessages(prev => prev.map(m =>
          m.id === event.id
            ? { ...m, content: event.content, isEdited: true }
            : m
        ));
      }
    });

    return () => {
      setOnMessageEdited(null);
    };
  }, [conversationId, setOnMessageEdited]);

  // Handle message deleted events
  useEffect(() => {
    setOnMessageDeleted((event: MessageDeletedEvent) => {
      if (event.conversationId === conversationId) {
        setMessages(prev => prev.map(m =>
          m.id === event.id
            ? { ...m, content: '', isDeleted: true }
            : m
        ));
      }
    });

    return () => {
      setOnMessageDeleted(null);
    };
  }, [conversationId, setOnMessageDeleted]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing
  const handleTyping = useCallback(() => {
    setTyping(conversationId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(conversationId, false);
    }, 2000);
  }, [conversationId, setTyping]);

  // Close action menu
  const closeActionMenu = useCallback(() => {
    setActionMenu(null);
  }, []);

  // Handle reply
  const handleReply = useCallback((msg: Message) => {
    setReplyTo({
      id: msg.id,
      content: msg.content,
      senderName: msg.sender.name,
    });
    setEditingMessage(null);
    setActionMenu(null);
    inputRef.current?.focus();
  }, []);

  // Handle edit
  const handleEdit = useCallback((msg: Message) => {
    setEditingMessage({ id: msg.id, originalContent: msg.content });
    setMessage(msg.content);
    setReplyTo(null);
    setActionMenu(null);
    inputRef.current?.focus();
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (msgId: string) => {
    setActionMenu(null);
    const confirmed = await confirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!confirmed) return;

    const success = await chatDeleteMessage(conversationId, msgId);
    if (success) {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: '', isDeleted: true } : m
      ));
    }
  }, [conversationId, chatDeleteMessage, confirm]);

  // Cancel edit/reply
  const cancelEditReply = useCallback(() => {
    setEditingMessage(null);
    setReplyTo(null);
    setMessage('');
  }, []);

  // Send message
  const handleSend = async () => {
    if (sending) return;

    // Handle image-only send
    if (selectedImage && !message.trim()) {
      setSending(true);
      try {
        const result = await chatApi.sendImageMessage(conversationId, selectedImage, replyTo?.id);
        setMessages(prev => {
          if (prev.some(m => m.id === result.id)) return prev;
          return [...prev, result];
        });
        clearSelectedImage();
        setReplyTo(null);
        scrollToBottom();
        onMessageSent?.(conversationId, '[Image]');
      } catch (error) {
        console.error('Failed to send image:', error);
        toast.error('Failed to send image');
      } finally {
        setSending(false);
      }
      return;
    }

    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');
    setTyping(conversationId, false);
    setSending(true);

    try {
      if (editingMessage) {
        // Edit mode
        const success = await chatEditMessage(conversationId, editingMessage.id, content);
        if (success) {
          setMessages(prev => prev.map(m =>
            m.id === editingMessage.id
              ? { ...m, content, isEdited: true }
              : m
          ));
        }
        setEditingMessage(null);
      } else {
        // Send mode
        const result = await socketSendMessage(conversationId, content, replyTo?.id);
        
        // Check for verification required error
        if (!result.success && result.code === 'VERIFICATION_REQUIRED') {
          setMessage(content); // Restore message
          setShowVerificationModal(true);
          return;
        }

        // Check for phone number detection (premium feature)
        if (!result.success && result.code === 'PHONE_NUMBER_DETECTED') {
          setMessage(content); // Restore message
          setShowPremiumModal(true);
          return;
        }
        
        if (result.success && result.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === result.message!.id)) return prev;
            return [...prev, {
              id: result.message!.id,
              content: result.message!.content,
              senderId: result.message!.senderId,
              sender: result.message!.sender,
              isRead: result.message!.isRead,
              createdAt: result.message!.createdAt,
              replyToId: result.message!.replyToId,
              replyTo: result.message!.replyTo,
              isEdited: result.message!.isEdited,
              isDeleted: result.message!.isDeleted,
              isSupport: result.message!.isSupport,
              messageType: result.message!.messageType,
              attachmentUrl: result.message!.attachmentUrl,
              attachmentDuration: result.message!.attachmentDuration,
            }];
          });
          scrollToBottom();
          onMessageSent?.(conversationId, result.message!.content);
        } else if (!result.success) {
          toast.error(result.error || 'Failed to send message');
          setMessage(content); // Restore message
        }
        setReplyTo(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(content); // Restore message if failed
    } finally {
      setSending(false);
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      cancelEditReply();
    }
  };

  // Context menu (desktop right-click)
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

  // Long press (mobile)
  const handleTouchStart = useCallback((msg: Message) => {
    if (msg.isDeleted) return;
    longPressTimerRef.current = setTimeout(() => {
      // Use center of screen for mobile
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Find message for action menu actions
  const findMessage = useCallback((id: string) => messages.find(m => m.id === id), [messages]);

  // Handle emoji select
  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
      if (!supportedTypes.includes(file.type)) {
        toast.warning('Unsupported format. Please use a JPEG, PNG, or WebP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, [toast]);

  // Clear selected image
  const clearSelectedImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [imagePreview]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Could not access microphone. Please allow microphone access.');
    }
  }, [toast]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Cancel voice recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, [isRecording]);

  // Play/pause recorded audio
  const togglePlayAudio = useCallback(() => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  }, [audioUrl, isPlayingAudio]);

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send voice note
  const sendVoiceNote = useCallback(async () => {
    if (!audioBlob) return;
    setSending(true);
    try {
      const message = await chatApi.sendVoiceMessage(conversationId, audioBlob, recordingTime);
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          sender: message.sender,
          isRead: message.isRead,
          createdAt: message.createdAt,
          isSupport: message.isSupport,
          messageType: message.messageType,
          attachmentUrl: message.attachmentUrl,
          attachmentDuration: message.attachmentDuration,
        }];
      });
      scrollToBottom();
      onMessageSent?.(conversationId, '[Voice note]');
    } catch (error) {
      console.error('Failed to send voice note:', error);
      toast.error('Failed to send voice note');
    } finally {
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setSending(false);
    }
  }, [audioBlob, conversationId, recordingTime, scrollToBottom, toast]);

  // Chat options handlers
  const handleViewProfile = useCallback(() => {
    if (conversation?.participant?.id) {
      router.push(`/profile/${conversation.participant.id}`);
    }
    setChatOptionsOpen(false);
  }, [conversation?.participant?.id, router]);

  const handleMuteNotifications = useCallback(async () => {
    try {
      if (isMuted) {
        await chatApi.unmuteConversation(conversationId);
        setIsMuted(false);
        toast.success('Notifications unmuted');
      } else {
        await chatApi.muteConversation(conversationId);
        setIsMuted(true);
        toast.success('Notifications muted for this conversation');
      }
    } catch (error) {
      toast.error('Failed to update mute setting');
    }
    setChatOptionsOpen(false);
  }, [isMuted, conversationId, toast]);

  const handleBlockUser = useCallback(async () => {
    if (isBlocked) {
      // Unblock
      try {
        await chatApi.unblockUser(conversation?.participant?.id || '');
        setIsBlocked(false);
        toast.success('User unblocked');
      } catch (error) {
        toast.error('Failed to unblock user');
      }
      setChatOptionsOpen(false);
      return;
    }

    const confirmed = await confirm({
      title: 'Block User',
      message: `Are you sure you want to block ${conversation?.participant?.name}? You won't be able to send or receive messages from them.`,
      confirmText: 'Block',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await chatApi.blockUser(conversation?.participant?.id || '');
      setIsBlocked(true);
      toast.success('User blocked successfully');
    } catch (error) {
      toast.error('Failed to block user');
    }
    setChatOptionsOpen(false);
  }, [isBlocked, conversation?.participant?.id, conversation?.participant?.name, confirm, toast]);

  const handleClearChat = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear Chat',
      message: 'Are you sure you want to clear all messages? This action cannot be undone.',
      confirmText: 'Clear All',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await chatApi.clearChat(conversationId);
      setMessages([]);
      toast.success('Chat cleared successfully');
    } catch (error) {
      toast.error('Failed to clear chat');
    }
    setChatOptionsOpen(false);
  }, [confirm, conversationId, toast]);

  return (
    <div className={cn(
      "flex flex-col",
      isEmbedded ? "h-full bg-white/50 dark:bg-neutral-900/50 rounded-2xl overflow-hidden" : "min-h-screen bg-gradient-warm"
    )}>
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

      {/* Action Menu Backdrop + Menu */}
      <AnimatePresence>
        {actionMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={closeActionMenu}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden min-w-[180px]"
              style={{
                left: Math.min(actionMenu.x, window.innerWidth - 200),
                top: Math.min(actionMenu.y, window.innerHeight - 200),
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={cn(
        "px-5 py-4 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800",
        isEmbedded ? "bg-transparent" : "bg-white/90 dark:bg-neutral-900/90 sticky top-0 z-40"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isEmbedded && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center lg:hidden flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            )}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                {isAdminConvo ? (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
                    <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-7 h-7" />
                  </div>
                ) : (
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={conversation?.participant?.avatar || ''} alt={conversation?.participant?.name || ''} />
                    <AvatarFallback>{conversation?.participant?.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                )}
                {isOnline && !isAdminConvo && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--lime-500)] rounded-full border-2 border-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "font-semibold truncate",
                    isAdminConvo ? "text-[var(--teal-600)] dark:text-[var(--teal-400)]" : "text-neutral-900 dark:text-neutral-100"
                  )}>
                    {isAdminConvo ? `${PLATFORM_NAME} Support` : (conversation?.participant?.name?.split(' ')[0] || 'Unknown')}
                  </span>
                  {isAdminConvo ? (
                    <Shield className="w-4 h-4 text-[var(--teal-500)]" />
                  ) : null}
                </div>
                <span className="text-xs text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                  {isAdminConvo ? 'Official Support' : otherUserTyping ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setChatOptionsOpen(!chatOptionsOpen)}
                className="w-10 h-10 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>

              {/* Chat Options Dropdown */}
              <AnimatePresence>
                {chatOptionsOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setChatOptionsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden min-w-[200px] z-50"
                    >
                      <button
                        onClick={handleViewProfile}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-[var(--teal-500)]" />
                        <span className="text-sm text-neutral-800 dark:text-neutral-200">View Profile</span>
                      </button>
                      <button
                        onClick={handleMuteNotifications}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors text-left"
                      >
                        <BellOff className="w-4 h-4 text-[var(--lime-600)]" />
                        <span className="text-sm text-neutral-800 dark:text-neutral-200">
                          {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                        </span>
                      </button>
                      <button
                        onClick={handleClearChat}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors text-left"
                      >
                        <Eraser className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-neutral-800 dark:text-neutral-200">Clear Chat</span>
                      </button>
                      <button
                        onClick={handleBlockUser}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {isBlocked ? 'Unblock User' : 'Block User'}
                        </span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Listing Badge */}
        {conversation?.postId && (
          <div className="mt-2 flex items-center gap-2">
            <span className="badge badge-peach">
              <Home className="w-3.5 h-3.5" />
              Listing inquiry
            </span>
          </div>
        )}
      </header>

      {/* Unverified User Warning (hide for support/admin conversations) */}
      {conversation?.participant && !conversation.participant.isVerified && !isAdminConvo && (
        <UnverifiedWarningBanner name={conversation.participant.name?.split(' ')[0] || 'This user'} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-neutral-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            const isSupportMsg = (msg.isSupport || msg.sender?.role === 'admin') && !isOwn;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  isOwn ? 'justify-end' : 'justify-start'
                )}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onTouchStart={() => handleTouchStart(msg)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
              >
                {/* Support message avatar */}
                {isSupportMsg && !msg.isDeleted && (
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
                      <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-5 h-5" />
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.isDeleted
                      ? 'bg-neutral-100 dark:bg-neutral-800/50'
                      : isOwn
                        ? 'bg-gradient-to-r from-[var(--lime-300)] to-[var(--yellow-300)] text-[#212121] rounded-br-sm'
                        : isSupportMsg
                          ? 'bg-gradient-to-r from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-500)]/10 dark:to-[var(--lime-500)]/10 text-neutral-800 dark:text-neutral-200 rounded-bl-sm shadow-sm border border-[var(--teal-200)] dark:border-[var(--teal-500)]/20'
                          : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-sm shadow-sm'
                  )}
                >
                  {/* Support label */}
                  {isSupportMsg && !msg.isDeleted && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Shield className="w-3.5 h-3.5 text-[var(--teal-500)]" />
                      <span className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                        {PLATFORM_NAME} Support
                      </span>
                    </div>
                  )}

                  {/* Reply preview in bubble */}
                  {msg.replyTo && !msg.isDeleted && (
                    <div className="flex gap-2 mb-2 pb-2 border-b border-black/10 dark:border-white/10">
                      <div className="w-1 rounded-full bg-[var(--teal-400)] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                          {msg.replyTo.sender?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                          {msg.replyTo.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {msg.isDeleted ? (
                    <p className="text-sm italic text-neutral-400 dark:text-neutral-500">
                      🚫 This message was deleted
                    </p>
                  ) : msg.messageType === 'voice' && msg.attachmentUrl ? (
                    <VoiceMessagePlayer
                      messageId={msg.id}
                      attachmentUrl={msg.attachmentUrl}
                      duration={msg.attachmentDuration}
                      isOwn={isOwn}
                    />
                  ) : msg.messageType === 'image' && msg.attachmentUrl ? (
                    <div className="rounded-xl overflow-hidden max-w-[280px]">
                      <img
                        src={msg.attachmentUrl?.startsWith('http') ? msg.attachmentUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${msg.attachmentUrl}`}
                        alt="Shared image"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  )}

                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    msg.isDeleted
                      ? 'text-neutral-400'
                      : isOwn ? 'text-neutral-700' : 'text-neutral-500'
                  )}>
                    {msg.isEdited && !msg.isDeleted && (
                      <span className="text-[10px] italic mr-1">edited</span>
                    )}
                    <span className="text-xs">{formatTime(msg.createdAt)}</span>
                    {isOwn && !msg.isDeleted && (
                      msg.isRead ? (
                        <CheckCheck className="w-4 h-4 text-[var(--teal-600)]" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherUserTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply / Edit preview bar */}
      <AnimatePresence>
        {(replyTo || editingMessage) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-[var(--peach-200)] dark:border-neutral-800 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-3">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-[var(--peach-200)] dark:border-neutral-800 overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="w-20 h-20 object-cover rounded-xl"
                />
                <button
                  onClick={clearSelectedImage}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {selectedImage?.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recording UI */}
      <AnimatePresence>
        {(isRecording || audioBlob) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-[var(--peach-200)] dark:border-neutral-800 overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-red-500">Recording</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatRecordingTime(recordingTime)}
                    </span>
                  </div>
                  <button
                    onClick={cancelRecording}
                    className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <Square className="w-4 h-4 text-white fill-white" />
                  </button>
                </>
              ) : audioBlob ? (
                <>
                  <button
                    onClick={togglePlayAudio}
                    className="w-10 h-10 rounded-full bg-[var(--teal-500)] flex items-center justify-center"
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                      <div className="h-full w-full bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] rounded-full" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Voice message ({formatRecordingTime(recordingTime)})
                    </p>
                  </div>
                  <button
                    onClick={cancelRecording}
                    className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </button>
                  <button
                    onClick={sendVoiceNote}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] flex items-center justify-center"
                  >
                    <Send className="w-5 h-5 text-neutral-900" />
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!user?.isVerified && !isAdminConvo ? (
        <div className="px-3 py-3 sm:px-5 sm:py-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Verification required</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Verify your identity to message other users</p>
            </div>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-full hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              Verify
            </button>
          </div>
        </div>
      ) : (
      <div className="px-3 py-3 sm:px-5 sm:py-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-[var(--peach-200)] dark:border-neutral-800">
        {/* Hidden file input */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <div className="flex items-end gap-2 sm:gap-3 relative">
          <div className="flex-1 min-w-0 flex items-end gap-1 sm:gap-2 p-2 sm:p-3 rounded-2xl bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700">
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors flex-shrink-0",
                  showEmojiPicker && "bg-[var(--peach-200)] dark:bg-neutral-700"
                )}
              >
                <Smile className="w-5 h-5 text-neutral-500" />
              </button>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-12 left-0 z-50"
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={theme === 'daylight' ? Theme.LIGHT : Theme.DARK}
                      width={320}
                      height={400}
                      searchPlaceholder="Search emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder={editingMessage ? "Edit message..." : "Type a message..."}
              rows={1}
              className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-neutral-100 resize-none py-2 max-h-32"
              style={{ minHeight: '36px' }}
            />
            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors flex-shrink-0">
              <Paperclip className="w-5 h-5 text-neutral-500" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(message.trim() || selectedImage) ? handleSend : (isRecording ? stopRecording : startRecording)}
            disabled={sending}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0",
              (message.trim() || selectedImage)
                ? editingMessage
                  ? "bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] shadow-lg"
                  : "bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] shadow-lg"
                : isRecording
                  ? "bg-red-500 shadow-lg"
                  : "bg-[var(--peach-200)] dark:bg-neutral-700 hover:bg-[var(--peach-300)] dark:hover:bg-neutral-600"
            )}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
            ) : (message.trim() || selectedImage) ? (
              editingMessage ? (
                <Check className="w-5 h-5 text-neutral-900" />
              ) : (
                <Send className="w-5 h-5 text-neutral-900" />
              )
            ) : isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-neutral-500" />
            )}
          </motion.button>
        </div>
      </div>
      )}
    </div>
  );
};

// Empty State for Desktop when no chat selected
const EmptyChatState = () => (
  <div className="h-full flex flex-col items-center justify-center bg-white/50 dark:bg-neutral-900/50 rounded-2xl p-8">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--peach-200)] to-[var(--pink-200)] dark:from-[var(--peach-500)]/20 dark:to-[var(--pink-500)]/20 flex items-center justify-center mb-6">
      <MessageSquare className="w-12 h-12 text-[var(--pink-400)]" />
    </div>
    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
      Select a conversation
    </h3>
    <p className="text-neutral-500 text-center max-w-sm">
      Choose a conversation from the list to start chatting with potential roommates
    </p>
  </div>
);

// Main Chat Page
export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isConnected, onlineUsers, setOnMessageNotification } = useChat();
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);

  // Get conversationId from URL if present
  const urlConversationId = searchParams.get('conversationId');
  const urlSupportParam = searchParams.get('support');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // Load conversations
  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        let data = await chatApi.getConversations();
        if (cancelled) return;
        setConversations(data);

        // Auto-select conversation from URL if present
        if (urlConversationId) {
          setSelectedChat(urlConversationId);
          // Clear the URL parameter to avoid issues on refresh
          router.replace('/chat', { scroll: false });
        }

        // Auto-open support conversation if ?support=true
        if (urlSupportParam === 'true') {
          try {
            const supportConvo = await chatApi.getSupportConversation();
            if (cancelled) return;
            const exists = data.some(c => c.id === supportConvo.id);
            if (!exists) {
              data = [supportConvo, ...data];
              setConversations(data);
            }
            setSelectedChat(supportConvo.id);
          } catch (err) {
            console.error('Failed to open support chat:', err);
          }
          if (!cancelled) router.replace('/chat', { scroll: false });
        }
      } catch (error) {
        if (!cancelled) console.error('Failed to load conversations:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadConversations();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, urlConversationId, urlSupportParam]);

  // Handle incoming message notifications (update conversation list)
  useEffect(() => {
    setOnMessageNotification((notification) => {
      setConversations(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.id === notification.conversationId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            lastMessage: notification.message.content,
            lastMessageAt: notification.message.createdAt,
            unreadCount: selectedChat === notification.conversationId
              ? updated[idx].unreadCount
              : updated[idx].unreadCount + 1,
          };
          // Move to top
          const [convo] = updated.splice(idx, 1);
          updated.unshift(convo);
        }
        return updated;
      });
    });

    return () => {
      setOnMessageNotification(null);
    };
  }, [setOnMessageNotification, selectedChat]);

  // Move conversation to top when user sends a message
  const handleMessageSent = useCallback((convoId: string, content: string) => {
    setConversations(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(c => c.id === convoId);
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          lastMessage: content,
          lastMessageAt: new Date().toISOString(),
        };
        const [convo] = updated.splice(idx, 1);
        updated.unshift(convo);
      }
      return updated;
    });
  }, []);

  // Get selected conversation
  const selectedConversation = conversations.find(c => c.id === selectedChat) || null;

  // Clear unread when selecting a chat
  const handleSelectChat = (id: string) => {
    setSelectedChat(id);
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));
  };

  // Open support conversation
  const openSupportChat = async () => {
    setSupportLoading(true);
    try {
      const supportConvo = await chatApi.getSupportConversation();
      // Add to conversations list if not already there
      setConversations(prev => {
        const exists = prev.some(c => c.id === supportConvo.id);
        if (exists) return prev;
        return [supportConvo, ...prev];
      });
      setSelectedChat(supportConvo.id);
    } catch (error) {
      console.error('Failed to open support chat:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-warm">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;

  // Mobile view - show either list or detail
  const renderMobileView = () => {
    if (selectedChat) {
      return (
        <ChatDetail
          conversationId={selectedChat}
          conversation={selectedConversation}
          onBack={() => setSelectedChat(null)}
          onlineUsers={onlineUsers}
          onMessageSent={handleMessageSent}
        />
      );
    }

    return (
      <AppLayout activeTab={activeTab} onTabChange={setActiveTab} showBottomNav={true}>
        {/* Mobile Header */}
        <header className="header-mobile px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-neutral-500">Messages</p>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Chats
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="badge badge-lime">
                  {unreadCount} new
                </span>
              )}
              {isConnected && (
                <span className="w-2 h-2 rounded-full bg-[var(--lime-500)]" title="Connected" />
              )}
            </div>
          </div>
        </header>

        <div className="content-container">
          <ChatListSidebar
            conversations={conversations}
            loading={loading}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChat}
            onlineUsers={onlineUsers}
            onSupportClick={openSupportChat}
            supportLoading={supportLoading}
          />
        </div>
      </AppLayout>
    );
  };

  // Desktop view - split layout
  const renderDesktopView = () => (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab} showBottomNav={false} showFab={false}>
      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Messages
            </h1>
            <p className="text-neutral-500 mt-1">Chat with potential roommates</p>
          </div>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-[var(--lime-500)]" title="Connected" />
          )}
        </div>
      </header>

      <div className="content-container">
        <div className="chat-split-layout">
          {/* Conversations List */}
          <div className="chat-sidebar">
            <ChatListSidebar
              conversations={conversations}
              loading={loading}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat}
              isDesktopSidebar={true}
              onlineUsers={onlineUsers}
              onSupportClick={openSupportChat}
              supportLoading={supportLoading}
            />
          </div>

          {/* Chat Detail */}
          <div className="chat-main">
            {selectedChat ? (
              <ChatDetail
                conversationId={selectedChat}
                conversation={selectedConversation}
                onBack={() => setSelectedChat(null)}
                isEmbedded={true}
                onlineUsers={onlineUsers}
                onMessageSent={handleMessageSent}
              />
            ) : (
              <EmptyChatState />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden">
        {renderMobileView()}
      </div>
      {/* Desktop layout */}
      <div className="hidden lg:block">
        {renderDesktopView()}
      </div>
    </>
  );
}
