import apiClient from './client';

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

export interface Conversation {
  id: string;
  participant: ConversationParticipant | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  postId?: string;
}

export interface MessageSender {
  id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: MessageSender;
  isRead: boolean;
  createdAt: string;
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

export interface StartConversationData {
  recipientId: string;
  message: string;
  postId?: string;
}

const conversationsApi = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    return apiClient.get('/conversations');
  },

  // Start a new conversation
  startConversation: async (data: StartConversationData): Promise<{ conversation: Conversation; message: Message }> => {
    return apiClient.post('/conversations?platform=web', data);
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    return apiClient.get('/conversations/unread-count');
  },

  // Get or create conversation with a specific user
  getOrCreateWithUser: async (userId: string): Promise<Conversation> => {
    return apiClient.get(`/conversations/with/${userId}?platform=web`);
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string, page = 1, limit = 50): Promise<MessagesResponse> => {
    return apiClient.get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  },

  // Send a message
  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    return apiClient.post(`/conversations/${conversationId}/messages`, { content });
  },
};

export default conversationsApi;
