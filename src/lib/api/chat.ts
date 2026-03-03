import apiClient from './client';

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  role?: string;
}

export interface Conversation {
  id: string;
  participant: ChatParticipant | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  postId?: string;
  isMuted?: boolean;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  isRead: boolean;
  createdAt: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    sender?: { id: string; name: string; avatar?: string; role?: string };
  };
  isEdited?: boolean;
  isDeleted?: boolean;
  isSupport?: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'video';
  attachmentUrl?: string;
  attachmentDuration?: number;
}

export interface MessagesResponse {
  data: Message[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface StartConversationRequest {
  recipientId: string;
  message: string;
  postId?: string;
}

export interface StartConversationResponse {
  conversation: {
    id: string;
    participants: { id: string; name: string; avatar?: string }[];
    postId?: string;
  };
  message: Message;
}

export const chatApi = {
  // Get all conversations for the current user
  getConversations: (): Promise<Conversation[]> => {
    return apiClient.get('/conversations');
  },

  // Get messages for a specific conversation
  getMessages: (conversationId: string, page = 1, limit = 50): Promise<MessagesResponse> => {
    return apiClient.get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  },

  // Start a new conversation with a message
  startConversation: (data: StartConversationRequest): Promise<StartConversationResponse> => {
    return apiClient.post('/conversations', data);
  },

  // Send a message (REST fallback - prefer WebSocket)
  sendMessage: (conversationId: string, content: string, replyToId?: string): Promise<Message> => {
    return apiClient.post(`/conversations/${conversationId}/messages`, { content, replyToId });
  },

  // Upload audio and send as voice message
  sendVoiceMessage: async (conversationId: string, audioBlob: Blob, duration: number): Promise<Message> => {
    // Upload the audio file
    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });
    const uploadResult = await apiClient.uploadFile<{ url: string }>('/upload/audio', audioFile);

    // Send message with attachment
    return apiClient.post(`/conversations/${conversationId}/messages`, {
      content: '🎤 Voice message',
      messageType: 'voice',
      attachmentUrl: uploadResult.url,
      attachmentDuration: duration,
    });
  },

  // Upload video and send as video message
  sendVideoMessage: async (conversationId: string, videoFile: File): Promise<Message> => {
    const uploadResult = await apiClient.uploadFile<{ url: string }>('/upload/video', videoFile, { folder: 'chat-videos' });

    return apiClient.post(`/conversations/${conversationId}/messages`, {
      content: '🎬 Video',
      messageType: 'video',
      attachmentUrl: uploadResult.url,
    });
  },

  // Upload image and send as image message
  sendImageMessage: async (conversationId: string, imageFile: File, replyToId?: string): Promise<Message> => {
    const uploadResult = await apiClient.uploadFile<{ url: string }>('/upload/image', imageFile, { folder: 'chat-images' });

    return apiClient.post(`/conversations/${conversationId}/messages`, {
      content: '📷 Image',
      messageType: 'image',
      attachmentUrl: uploadResult.url,
      replyToId,
    });
  },

  // Edit a message
  editMessage: (conversationId: string, messageId: string, content: string): Promise<Message> => {
    return apiClient.patch(`/conversations/${conversationId}/messages/${messageId}`, { content });
  },

  // Delete a message
  deleteMessage: (conversationId: string, messageId: string): Promise<Message> => {
    return apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`);
  },

  // Get unread message count
  getUnreadCount: (): Promise<{ count: number }> => {
    return apiClient.get('/conversations/unread-count');
  },

  // Block a user
  blockUser: (userId: string) => apiClient.post(`/blocks/${userId}`),

  // Unblock a user
  unblockUser: (userId: string) => apiClient.delete(`/blocks/${userId}`),

  // Check if a user is blocked (bidirectional)
  checkBlocked: (userId: string): Promise<{ isBlocked: boolean }> =>
    apiClient.get(`/blocks/check/${userId}`),

  // Mute a conversation
  muteConversation: (conversationId: string) =>
    apiClient.post(`/conversations/${conversationId}/mute`),

  // Unmute a conversation
  unmuteConversation: (conversationId: string) =>
    apiClient.delete(`/conversations/${conversationId}/mute`),

  // Clear all messages in a conversation
  clearChat: (conversationId: string) =>
    apiClient.delete(`/conversations/${conversationId}/messages`),

  // Get or create support conversation (user-facing)
  getSupportConversation: (): Promise<Conversation> =>
    apiClient.get('/conversations/support'),

  // Admin: Send support message to users
  sendSupportMessage: (data: { recipientIds?: string[]; sendToAll?: boolean; content: string }): Promise<{ sentCount: number }> =>
    apiClient.post('/conversations/admin/support', data),
};

export default chatApi;
