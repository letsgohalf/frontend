'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinConversation,
  leaveConversation,
  sendMessage as socketSendMessage,
  editMessage as socketEditMessage,
  deleteMessage as socketDeleteMessage,
  sendTypingStatus,
  markMessagesAsRead,
  getOnlineUsers,
  onNewMessage,
  onMessageNotification,
  onMessageEdited,
  onMessageDeleted,
  onTyping,
  onMessagesRead,
  onUserOnline,
  onUserOffline,
  ChatMessage,
  TypingEvent,
  MessageNotification,
  MessageEditedEvent,
  MessageDeletedEvent,
} from '@/lib/socket';
import { chatApi } from '@/lib/api/chat';

export interface SendMessageResult {
  success: boolean;
  message?: ChatMessage;
  error?: string;
  code?: string;
}

interface ChatContextType {
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, TypingEvent>;
  unreadCount: number;

  // Actions
  joinChat: (conversationId: string) => Promise<void>;
  leaveChat: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string, replyToId?: string) => Promise<SendMessageResult>;
  editMessage: (conversationId: string, messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<boolean>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string, messageIds: string[]) => void;

  // Event callbacks (set by chat page)
  setOnNewMessage: (callback: ((msg: ChatMessage) => void) | null) => void;
  setOnMessageNotification: (callback: ((notif: MessageNotification) => void) | null) => void;
  setOnMessageEdited: (callback: ((event: MessageEditedEvent) => void) | null) => void;
  setOnMessageDeleted: (callback: ((event: MessageDeletedEvent) => void) | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingEvent>>(new Map());
  const [unreadCount, setUnreadCount] = useState(0);

  // Callbacks for message handlers
  const [onNewMessageCallback, setOnNewMessageCallback] = useState<((msg: ChatMessage) => void) | null>(null);
  const [onNotificationCallback, setOnNotificationCallback] = useState<((notif: MessageNotification) => void) | null>(null);
  const [onMessageEditedCallback, setOnMessageEditedCallback] = useState<((event: MessageEditedEvent) => void) | null>(null);
  const [onMessageDeletedCallback, setOnMessageDeletedCallback] = useState<((event: MessageDeletedEvent) => void) | null>(null);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const socket = connectSocket(token);

          socket.on('connected', () => {
            setIsConnected(true);
            // Get initial online users
            getOnlineUsers().then(({ onlineUsers }) => {
              setOnlineUsers(new Set(onlineUsers));
            }).catch(() => {});
          });

          socket.on('disconnect', () => {
            setIsConnected(false);
          });

          socket.on('connect_error', () => {
            setIsConnected(false);
          });
        } catch (err) {
          console.warn('Socket connection failed:', err);
          setIsConnected(false);
        }
      }
    } else {
      disconnectSocket();
      setIsConnected(false);
      setOnlineUsers(new Set());
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return;

    const unsubNewMessage = onNewMessage((message) => {
      if (onNewMessageCallback) {
        onNewMessageCallback(message);
      }
    });

    const unsubNotification = onMessageNotification((notification) => {
      setUnreadCount(prev => prev + 1);
      if (onNotificationCallback) {
        onNotificationCallback(notification);
      }
    });

    const unsubTyping = onTyping((event) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (event.isTyping) {
          newMap.set(`${event.conversationId}:${event.userId}`, event);
          // Auto-remove after 3 seconds
          setTimeout(() => {
            setTypingUsers(current => {
              const updated = new Map(current);
              updated.delete(`${event.conversationId}:${event.userId}`);
              return updated;
            });
          }, 3000);
        } else {
          newMap.delete(`${event.conversationId}:${event.userId}`);
        }
        return newMap;
      });
    });

    const unsubMessageEdited = onMessageEdited((event) => {
      if (onMessageEditedCallback) {
        onMessageEditedCallback(event);
      }
    });

    const unsubMessageDeleted = onMessageDeleted((event) => {
      if (onMessageDeletedCallback) {
        onMessageDeletedCallback(event);
      }
    });

    const unsubMessagesRead = onMessagesRead(() => {
      // Could update message read status in UI
    });

    const unsubOnline = onUserOnline(({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    const unsubOffline = onUserOffline(({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      unsubNewMessage();
      unsubNotification();
      unsubMessageEdited();
      unsubMessageDeleted();
      unsubTyping();
      unsubMessagesRead();
      unsubOnline();
      unsubOffline();
    };
  }, [isConnected, onNewMessageCallback, onNotificationCallback, onMessageEditedCallback, onMessageDeletedCallback]);

  const joinChat = useCallback(async (conversationId: string) => {
    if (!isConnected) return;
    await joinConversation(conversationId);
  }, [isConnected]);

  const leaveChat = useCallback((conversationId: string) => {
    if (!isConnected) return;
    leaveConversation(conversationId);
  }, [isConnected]);

  const sendMessageAction = useCallback(async (conversationId: string, content: string, replyToId?: string): Promise<SendMessageResult> => {
    // Try WebSocket first if connected
    if (isConnected) {
      try {
        const result = await socketSendMessage(conversationId, content, replyToId);
        if (result.success && result.message) {
          return { success: true, message: result.message };
        }
        // Return error from socket
        if (result.error || result.code) {
          return { success: false, error: result.error, code: result.code };
        }
      } catch (err) {
        console.warn('Socket send failed, falling back to REST:', err);
      }
    }

    // Fall back to REST API
    try {
      const message = await chatApi.sendMessage(conversationId, content, replyToId);
      return {
        success: true,
        message: {
          id: message.id,
          conversationId,
          content: message.content,
          senderId: message.senderId,
          sender: message.sender,
          isRead: message.isRead,
          createdAt: message.createdAt,
          replyToId: message.replyToId,
          replyTo: message.replyTo,
          isEdited: message.isEdited,
          isDeleted: message.isDeleted,
        },
      };
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const code = err?.code || err?.response?.data?.code;
      // Check for verification error
      if (code === 'VERIFICATION_REQUIRED') {
        return { success: false, error: 'Verification required', code: 'VERIFICATION_REQUIRED' };
      }
      // Check for phone number detection (premium feature)
      if (code === 'PHONE_NUMBER_DETECTED') {
        return { success: false, error: 'Phone numbers require premium', code: 'PHONE_NUMBER_DETECTED' };
      }
      return { success: false, error: err?.message || 'Failed to send message' };
    }
  }, [isConnected]);

  const editMessageAction = useCallback(async (conversationId: string, messageId: string, content: string): Promise<boolean> => {
    // Try WebSocket first
    if (isConnected) {
      try {
        const result = await socketEditMessage(conversationId, messageId, content);
        if (result.success) return true;
      } catch (err) {
        console.warn('Socket edit failed, falling back to REST:', err);
      }
    }

    // Fall back to REST
    try {
      await chatApi.editMessage(conversationId, messageId, content);
      return true;
    } catch (err) {
      console.error('Failed to edit message:', err);
      return false;
    }
  }, [isConnected]);

  const deleteMessageAction = useCallback(async (conversationId: string, messageId: string): Promise<boolean> => {
    // Try WebSocket first
    if (isConnected) {
      try {
        const result = await socketDeleteMessage(conversationId, messageId);
        if (result.success) return true;
      } catch (err) {
        console.warn('Socket delete failed, falling back to REST:', err);
      }
    }

    // Fall back to REST
    try {
      await chatApi.deleteMessage(conversationId, messageId);
      return true;
    } catch (err) {
      console.error('Failed to delete message:', err);
      return false;
    }
  }, [isConnected]);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!isConnected) return;
    sendTypingStatus(conversationId, isTyping);
  }, [isConnected]);

  const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
    if (!isConnected) return;
    markMessagesAsRead(conversationId, messageIds);
  }, [isConnected]);

  const setOnNewMessage = useCallback((callback: ((msg: ChatMessage) => void) | null) => {
    setOnNewMessageCallback(() => callback);
  }, []);

  const setOnMessageNotification = useCallback((callback: ((notif: MessageNotification) => void) | null) => {
    setOnNotificationCallback(() => callback);
  }, []);

  const setOnMessageEditedCb = useCallback((callback: ((event: MessageEditedEvent) => void) | null) => {
    setOnMessageEditedCallback(() => callback);
  }, []);

  const setOnMessageDeletedCb = useCallback((callback: ((event: MessageDeletedEvent) => void) | null) => {
    setOnMessageDeletedCallback(() => callback);
  }, []);

  const value: ChatContextType = {
    isConnected,
    onlineUsers,
    typingUsers,
    unreadCount,
    joinChat,
    leaveChat,
    sendMessage: sendMessageAction,
    editMessage: editMessageAction,
    deleteMessage: deleteMessageAction,
    setTyping,
    markAsRead,
    setOnNewMessage,
    setOnMessageNotification,
    setOnMessageEdited: setOnMessageEditedCb,
    setOnMessageDeleted: setOnMessageDeletedCb,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
