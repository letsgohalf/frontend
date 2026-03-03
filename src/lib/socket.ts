import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

let socket: Socket | null = null;

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  isRead: boolean;
  createdAt: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    sender?: { id: string; name: string; avatar?: string };
  };
  isEdited?: boolean;
  isDeleted?: boolean;
  isSupport?: boolean;
  messageType?: 'text' | 'image' | 'voice';
  attachmentUrl?: string;
  attachmentDuration?: number;
}

export interface MessageEditedEvent {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  isEdited: boolean;
  editedAt: string;
}

export interface MessageDeletedEvent {
  id: string;
  conversationId: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessagesReadEvent {
  conversationId: string;
  readBy: string;
  messageIds: string[];
}

export interface MessageNotification {
  conversationId: string;
  message: ChatMessage;
  sender: {
    id: string;
    name: string;
  };
}

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Helper functions for chat operations
export const joinConversation = (conversationId: string): Promise<{ success?: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ error: 'Not connected' });
      return;
    }
    socket.emit('joinConversation', { conversationId }, (response: { success?: boolean; error?: string }) => {
      resolve(response);
    });
  });
};

export const leaveConversation = (conversationId: string): void => {
  socket?.emit('leaveConversation', { conversationId });
};

export const sendMessage = (
  conversationId: string,
  content: string,
  replyToId?: string,
): Promise<{ success?: boolean; message?: ChatMessage; error?: string; code?: string }> => {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ error: 'Not connected' });
      return;
    }
    socket.emit('sendMessage', { conversationId, content, replyToId }, (response: { success?: boolean; message?: ChatMessage; error?: string; code?: string }) => {
      resolve(response);
    });
  });
};

export const editMessage = (
  conversationId: string,
  messageId: string,
  content: string,
): Promise<{ success?: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ error: 'Not connected' });
      return;
    }
    socket.emit('editMessage', { conversationId, messageId, content }, (response: { success?: boolean; error?: string }) => {
      resolve(response);
    });
  });
};

export const deleteMessage = (
  conversationId: string,
  messageId: string,
): Promise<{ success?: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ error: 'Not connected' });
      return;
    }
    socket.emit('deleteMessage', { conversationId, messageId }, (response: { success?: boolean; error?: string }) => {
      resolve(response);
    });
  });
};

export const sendTypingStatus = (conversationId: string, isTyping: boolean): void => {
  socket?.emit('typing', { conversationId, isTyping });
};

export const markMessagesAsRead = (conversationId: string, messageIds: string[]): void => {
  socket?.emit('markAsRead', { conversationId, messageIds });
};

export const getOnlineUsers = (): Promise<{ onlineUsers: string[] }> => {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ onlineUsers: [] });
      return;
    }
    socket.emit('getOnlineUsers', (response: { onlineUsers: string[] }) => {
      resolve(response);
    });
  });
};

// Event listeners
export const onNewMessage = (callback: (message: ChatMessage) => void): (() => void) => {
  socket?.on('newMessage', callback);
  return () => socket?.off('newMessage', callback);
};

export const onMessageNotification = (callback: (notification: MessageNotification) => void): (() => void) => {
  socket?.on('messageNotification', callback);
  return () => socket?.off('messageNotification', callback);
};

export const onTyping = (callback: (event: TypingEvent) => void): (() => void) => {
  socket?.on('userTyping', callback);
  return () => socket?.off('userTyping', callback);
};

export const onMessagesRead = (callback: (event: MessagesReadEvent) => void): (() => void) => {
  socket?.on('messagesRead', callback);
  return () => socket?.off('messagesRead', callback);
};

export const onUserOnline = (callback: (event: { userId: string }) => void): (() => void) => {
  socket?.on('userOnline', callback);
  return () => socket?.off('userOnline', callback);
};

export const onUserOffline = (callback: (event: { userId: string }) => void): (() => void) => {
  socket?.on('userOffline', callback);
  return () => socket?.off('userOffline', callback);
};

export const onMessageEdited = (callback: (event: MessageEditedEvent) => void): (() => void) => {
  socket?.on('messageEdited', callback);
  return () => socket?.off('messageEdited', callback);
};

export const onMessageDeleted = (callback: (event: MessageDeletedEvent) => void): (() => void) => {
  socket?.on('messageDeleted', callback);
  return () => socket?.off('messageDeleted', callback);
};
