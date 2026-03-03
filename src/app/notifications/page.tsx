'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Heart,
  MessageCircle,
  Home,
  UserPlus,
  Star,
  Eye,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  MoreHorizontal,
  Filter,
  Loader2,
  BadgeCheck,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import notificationsApi, { Notification as ApiNotification } from '@/lib/api/notifications';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/utils/image';

// Notification types
type NotificationType = 'message' | 'interest' | 'like' | 'comment' | 'match' | 'view' | 'follow' | 'verification_approved' | 'verification_rejected' | 'system' | 'recommendation';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  postId?: string;
  postPreview?: string;
  conversationId?: string;
  threadId?: string;
  createdAt: string;
  isRead: boolean;
}

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return notifDate.toLocaleDateString();
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return <MessageCircle className="w-5 h-5" />;
    case 'interest':
      return <Home className="w-5 h-5" />;
    case 'like':
      return <Heart className="w-5 h-5" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5" />;
    case 'match':
      return <Star className="w-5 h-5" />;
    case 'view':
      return <Eye className="w-5 h-5" />;
    case 'follow':
      return <UserPlus className="w-5 h-5" />;
    case 'verification_approved':
      return <ShieldCheck className="w-5 h-5" />;
    case 'verification_rejected':
      return <ShieldX className="w-5 h-5" />;
    case 'recommendation':
      return <Sparkles className="w-5 h-5" />;
    case 'system':
      return <Bell className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'message':
      return 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-600)]';
    case 'interest':
      return 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/20 text-[var(--lime-600)]';
    case 'like':
      return 'bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/20 text-[var(--pink-400)]';
    case 'comment':
      return 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/20 text-[var(--lavender-500)]';
    case 'match':
      return 'bg-[var(--yellow-100)] dark:bg-[var(--yellow-500)]/20 text-[var(--yellow-500)]';
    case 'view':
      return 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/20 text-[var(--lavender-500)]';
    case 'follow':
      return 'bg-[var(--peach-200)] dark:bg-[var(--peach-500)]/20 text-[var(--peach-500)]';
    case 'verification_approved':
      return 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-600)]';
    case 'verification_rejected':
      return 'bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/20 text-[var(--pink-500)]';
    case 'recommendation':
      return 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/20 text-[var(--lime-600)]';
    case 'system':
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
    default:
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600';
  }
};

// Filter tabs
const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'interest', label: 'Interests' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'message', label: 'Messages' },
];

// Notification Item Component
const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
  isDeleting
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  isDeleting: boolean;
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "relative p-4 rounded-2xl transition-all cursor-pointer",
        notification.isRead
          ? "bg-white/50 dark:bg-neutral-800/50"
          : "bg-white dark:bg-neutral-800 shadow-sm"
      )}
      onClick={() => onClick(notification)}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[var(--teal-500)]" />
      )}

      <div className="flex gap-3">
        {/* Icon or Avatar */}
        {notification.user ? (
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-neutral-700">
              <AvatarImage src={resolveImageUrl(notification.user.avatar)} alt={notification.user.name} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)]">
                {notification.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
              getNotificationColor(notification.type)
            )}>
              {getNotificationIcon(notification.type)}
            </div>
          </div>
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            getNotificationColor(notification.type)
          )}>
            {getNotificationIcon(notification.type)}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-800 dark:text-neutral-200">
            {notification.message}
          </p>
          {notification.postPreview && (
            <p className="text-xs text-[var(--teal-600)] dark:text-[var(--teal-400)] mt-1 truncate">
              "{notification.postPreview}"
            </p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>

        {/* Actions Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-2 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors self-start"
        >
          <MoreHorizontal className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-[var(--peach-100)] dark:border-neutral-700 flex gap-2"
          >
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                  setShowActions(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark read
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--pink-50)] dark:bg-[var(--pink-400)]/10 text-sm font-medium text-[var(--pink-500)] hover:bg-[var(--pink-100)] dark:hover:bg-[var(--pink-400)]/20 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, promptAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const [notifResponse, countResponse] = await Promise.all([
        notificationsApi.getNotifications(activeFilter),
        notificationsApi.getUnreadCount(),
      ]);

      // Transform API response to local format
      const transformed: Notification[] = notifResponse.data.map((n: ApiNotification) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        user: n.actor ? {
          id: n.actor.id,
          name: n.actor.name,
          avatar: n.actor.avatar,
        } : undefined,
        postId: n.postId,
        postPreview: n.postPreview,
        conversationId: n.conversationId,
        threadId: n.threadId,
        createdAt: n.createdAt,
        isRead: n.isRead,
      }));

      setNotifications(transformed);
      setUnreadCount(countResponse.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, activeFilter]);

  // Fetch on mount and filter change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      promptAuth('Sign in to view your notifications');
    }
  }, [authLoading, isAuthenticated, promptAuth]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await notificationsApi.deleteNotification(id);
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'message' && notification.threadId) {
      // Interest thread conversation — go to thread page
      router.push(`/interest/${notification.threadId}`);
    } else if (notification.type === 'message' && notification.conversationId) {
      router.push(`/chat/${notification.conversationId}`);
    } else if (notification.type === 'message') {
      router.push('/chat');
    } else if (notification.postId) {
      router.push(`/post/${notification.postId}`);
    } else if (notification.type === 'verification_approved' || notification.type === 'verification_rejected') {
      router.push('/settings');
    } else if (notification.type === 'view' || notification.type === 'follow') {
      router.push('/profile');
    } else if (notification.user?.id) {
      router.push(`/profile/${notification.user.id}`);
    }
  };

  // Use filtered notifications from API directly since we pass filter to API
  const filteredNotifications = notifications;

  // Group notifications by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toDateString();
    let label = date;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else label = new Date(notification.createdAt).toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Mobile Header */}
      <header className="header-mobile px-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <p className="text-sm text-neutral-500">Updates</p>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Notifications
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="badge badge-lime">{unreadCount} new</span>
          )}
          <button className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
            <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Notifications
            </h1>
            <p className="text-neutral-500 mt-1">Stay updated with your activity</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCheck className="w-5 h-5" />
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="content-container">
        <div className="px-5 lg:px-0">
          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  activeFilter === tab.id
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                    : 'bg-white/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                )}
              >
                {tab.label}
                {tab.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-[var(--lime-400)] text-[#212121]">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mark All Read - Mobile */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="w-full mb-4 py-3 rounded-xl bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10 text-[var(--teal-600)] dark:text-[var(--teal-400)] font-medium flex items-center justify-center gap-2 lg:hidden"
            >
              <CheckCheck className="w-5 h-5" />
              Mark all as read
            </button>
          )}

          {/* Notifications List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-[var(--peach-400)]" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                No notifications
              </h3>
              <p className="text-neutral-500 text-sm">
                {activeFilter === 'unread'
                  ? "You're all caught up!"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-32">
              {Object.entries(groupedNotifications).map(([date, notifs]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-neutral-500 mb-3">
                    {date}
                  </h3>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {notifs.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                          onClick={handleNotificationClick}
                          isDeleting={deletingId === notification.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
