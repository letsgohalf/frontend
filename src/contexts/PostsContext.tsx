'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import postsApi, { Post, PostsQuery, PaginatedResponse, UserInteractions } from '@/lib/api/posts';

interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  userInteractions: UserInteractions;

  // Actions
  fetchPosts: (query?: PostsQuery) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  toggleInterested: (postId: string) => Promise<void>;
  fetchUserInteractions: (postIds: string[]) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PostsContextType['meta']>(null);
  const [currentQuery, setCurrentQuery] = useState<PostsQuery>({});
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    likes: [],
    saves: [],
    interests: [],
  });

  const fetchPosts = useCallback(async (query: PostsQuery = {}) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);

    try {
      const response = await postsApi.getPosts(query);
      setPosts(response.data);
      setMeta(response.meta);

      // Fetch user interactions for these posts
      if (response.data.length > 0) {
        try {
          const interactions = await postsApi.getUserInteractions(
            response.data.map(p => p.id)
          );
          setUserInteractions(interactions);
        } catch {
          // User might not be authenticated, ignore error
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!meta || meta.page >= meta.totalPages || isLoading) return;

    setIsLoading(true);
    try {
      const response = await postsApi.getPosts({
        ...currentQuery,
        page: meta.page + 1,
      });
      setPosts(prev => [...prev, ...response.data]);
      setMeta(response.meta);

      // Fetch interactions for new posts
      if (response.data.length > 0) {
        try {
          const newInteractions = await postsApi.getUserInteractions(
            response.data.map(p => p.id)
          );
          setUserInteractions(prev => ({
            likes: [...prev.likes, ...newInteractions.likes],
            saves: [...prev.saves, ...newInteractions.saves],
            interests: [...prev.interests, ...newInteractions.interests],
          }));
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [meta, currentQuery, isLoading]);

  const refreshPosts = useCallback(async () => {
    await fetchPosts(currentQuery);
  }, [fetchPosts, currentQuery]);

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const result = await postsApi.toggleLike(postId);

      // Update local state
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, likesCount: result.likesCount } : p
        )
      );

      setUserInteractions(prev => ({
        ...prev,
        likes: result.liked
          ? [...prev.likes, postId]
          : prev.likes.filter(id => id !== postId),
      }));
    } catch (err: any) {
      throw err;
    }
  }, []);

  const toggleSave = useCallback(async (postId: string) => {
    try {
      const result = await postsApi.toggleSave(postId);

      setUserInteractions(prev => ({
        ...prev,
        saves: result.saved
          ? [...prev.saves, postId]
          : prev.saves.filter(id => id !== postId),
      }));
    } catch (err: any) {
      throw err;
    }
  }, []);

  const toggleInterested = useCallback(async (postId: string) => {
    try {
      const result = await postsApi.toggleInterested(postId);

      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, interestedCount: result.interestedCount } : p
        )
      );

      setUserInteractions(prev => ({
        ...prev,
        interests: result.interested
          ? [...prev.interests, postId]
          : prev.interests.filter(id => id !== postId),
      }));
    } catch (err: any) {
      throw err;
    }
  }, []);

  const fetchUserInteractions = useCallback(async (postIds: string[]) => {
    try {
      const interactions = await postsApi.getUserInteractions(postIds);
      setUserInteractions(interactions);
    } catch {
      // Ignore - user not authenticated
    }
  }, []);

  const value: PostsContextType = {
    posts,
    isLoading,
    error,
    meta,
    userInteractions,
    fetchPosts,
    loadMore,
    refreshPosts,
    toggleLike,
    toggleSave,
    toggleInterested,
    fetchUserInteractions,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
