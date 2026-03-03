'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import authApi, { User, AuthResponse, AuthMethod } from '@/lib/api/auth';
import { resolveImageUrl } from '@/lib/utils/image';

function resolveUserAvatar(user: User): User {
  return { ...user, avatar: resolveImageUrl(user.avatar) };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  register: (data: { method: AuthMethod; email?: string; phone?: string; password?: string; name: string }) => Promise<AuthResponse>;
  login: (data: { email?: string; phone?: string; password?: string }) => Promise<AuthResponse>;
  requestOtp: (data: { email?: string; phone?: string }) => Promise<AuthResponse>;
  verifyOtp: (data: { email?: string; phone?: string; otp: string }) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;

  // Auth prompt
  showAuthPrompt: boolean;
  setShowAuthPrompt: (show: boolean) => void;
  authPromptMessage: string;
  promptAuth: (message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(resolveUserAvatar(currentUser));
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const saveTokens = (accessToken?: string, refreshToken?: string) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  };

  const register = useCallback(async (data: { method: AuthMethod; email?: string; phone?: string; password?: string; name: string }) => {
    const response = await authApi.register(data);

    if (response.accessToken && response.user) {
      saveTokens(response.accessToken, response.refreshToken);
      setUser(resolveUserAvatar(response.user));
    }

    return response;
  }, []);

  const login = useCallback(async (data: { email?: string; phone?: string; password?: string }) => {
    const response = await authApi.login(data);

    if (response.accessToken && response.user) {
      saveTokens(response.accessToken, response.refreshToken);
      setUser(resolveUserAvatar(response.user));
    }

    return response;
  }, []);

  const requestOtp = useCallback(async (data: { email?: string; phone?: string }) => {
    return authApi.requestOtp(data);
  }, []);

  const verifyOtp = useCallback(async (data: { email?: string; phone?: string; otp: string }) => {
    const response = await authApi.verifyOtp(data);

    if (response.accessToken && response.user) {
      saveTokens(response.accessToken, response.refreshToken);
      setUser(resolveUserAvatar(response.user));
    }

    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/');
  }, [router]);

  const promptAuth = useCallback((message = 'Please sign in to continue') => {
    setAuthPromptMessage(message);
    setShowAuthPrompt(true);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(resolveUserAvatar(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(resolveUserAvatar(currentUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    register,
    login,
    requestOtp,
    verifyOtp,
    logout,
    updateUser,
    refreshUser,
    showAuthPrompt,
    setShowAuthPrompt,
    authPromptMessage,
    promptAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC to require authentication for a component
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string }
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, promptAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        if (options?.redirectTo) {
          router.push(options.redirectTo);
        } else {
          promptAuth();
        }
      }
    }, [isLoading, isAuthenticated, router, promptAuth]);

    if (isLoading) {
      return null; // Or a loading spinner
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
