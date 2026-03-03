import apiClient from './client';

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'interest' | 'like' | 'comment' | 'match' | 'view' | 'follow' | 'verification_approved' | 'verification_rejected' | 'system' | 'recommendation';
  title: string;
  message: string;
  actorId?: string;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  postId?: string;
  postPreview?: string;
  conversationId?: string;
  threadId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  hasMore: boolean;
}

const notificationsApi = {
  // Get notifications
  getNotifications: (filter = 'all', page = 1, limit = 20): Promise<NotificationsResponse> => {
    return apiClient.get(`/notifications?filter=${filter}&page=${page}&limit=${limit}`);
  },

  // Get unread count
  getUnreadCount: (): Promise<{ count: number }> => {
    return apiClient.get('/notifications/unread-count');
  },

  // Mark notification as read
  markAsRead: (notificationId: string): Promise<Notification> => {
    return apiClient.patch(`/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: (): Promise<{ success: boolean }> => {
    return apiClient.patch('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: (notificationId: string): Promise<{ success: boolean }> => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },

  // Delete all notifications
  deleteAll: (): Promise<{ success: boolean }> => {
    return apiClient.delete('/notifications');
  },
};

export default notificationsApi;
