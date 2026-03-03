'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import postsApi, { Post, UserInteractions } from '@/lib/api/posts';
import { useAuth } from '@/contexts/AuthContext';

const POLL_INTERVAL = 20000; // 20 seconds

interface UseCarpoolPollingOptions {
  postType: Post['postType'];
  viewerLat?: number | null;
  viewerLng?: number | null;
  carpoolRadiusKm?: number;
}

export function useCarpoolPolling({
  postType,
  viewerLat,
  viewerLng,
  carpoolRadiusKm = 50,
}: UseCarpoolPollingOptions) {
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    likes: [],
    saves: [],
    interests: [],
  });

  const previousIdsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPosts = useCallback(async (isInitial = false) => {
    if (!isInitial) setIsRefreshing(true);

    try {
      const query: Parameters<typeof postsApi.getPosts>[0] = {
        postType,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        limit: 50,
      };

      // Carpool posts are verified-only, so we must pass viewer verification status
      if (user?.isVerified || user?.role === 'admin') {
        query.viewerIsVerified = 'true';
      }

      if (user?.id) {
        query.viewerId = user.id;
      }

      if (user?.role === 'admin') {
        query.viewerIsAdmin = 'true';
      }

      if (viewerLat != null && viewerLng != null) {
        query.viewerLat = viewerLat;
        query.viewerLng = viewerLng;
        query.carpoolRadiusKm = carpoolRadiusKm;
      }

      const response = await postsApi.getPosts(query);
      const newPosts = response.data;

      // Find new post IDs (appeared in latest poll but not in previous)
      if (!isInitial && previousIdsRef.current.size > 0) {
        const freshIds = new Set<string>();
        for (const post of newPosts) {
          if (!previousIdsRef.current.has(post.id)) {
            freshIds.add(post.id);
          }
        }
        if (freshIds.size > 0) {
          setNewPostIds(freshIds);
          // Clear new markers after 5 seconds
          setTimeout(() => setNewPostIds(new Set()), 5000);
        }
      }

      // Update previous IDs
      previousIdsRef.current = new Set(newPosts.map(p => p.id));
      setPosts(newPosts);

      // Fetch user interactions
      if (isAuthenticated && newPosts.length > 0) {
        try {
          const interactions = await postsApi.getUserInteractions(
            newPosts.map(p => p.id)
          );
          setUserInteractions(interactions);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to fetch carpool posts:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postType, viewerLat, viewerLng, carpoolRadiusKm, isAuthenticated, user?.isVerified, user?.role]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchPosts(true);
  }, [fetchPosts]);

  // Polling
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchPosts(false), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPosts]);

  const refetch = useCallback(() => {
    fetchPosts(false);
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    isRefreshing,
    newPostIds,
    userInteractions,
    refetch,
  };
}
