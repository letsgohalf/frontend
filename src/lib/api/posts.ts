import apiClient from './client';

// Types
export interface Author {
  id: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  agentTier?: 'licensed_pro' | 'registered_agent' | 'property_owner' | 'house_owner' | null;
  isAgentVerified?: boolean;
  occupation?: string;
  role?: 'user' | 'admin';
  subscriptionTier?: 'free' | 'premium';
  isPartner?: boolean;
}

export type PromotionType = 'none' | 'sponsored' | 'promoted';

export interface Post {
  id: string;
  authorId: string;
  author: Author;
  content: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance?: number | null;
  budget: number;
  spotsAvailable: number;
  postType: 'looking-for-roommate' | 'looking-for-place' | 'have-spare-room' | 'announcement' | 'house-alert' | 'subscription-split' | 'grocery-split' | 'carpool-offer' | 'carpool-request';
  status: 'active' | 'filled' | 'matched' | 'booked' | 'expired' | 'deleted';
  images?: string[];
  video?: string;
  requirements?: string[];
  likesCount: number;
  heartsCount: number;
  homesCount: number;
  commentsCount: number;
  interestedCount: number;
  viewsCount: number;
  // Promotion fields
  promotionType?: PromotionType;
  promotedBy?: Author;
  promotedById?: string;
  promotedAt?: string;
  // Boost fields
  isBoosted?: boolean;
  boostedAt?: string;
  boostExpiresAt?: string;
  // AI-extracted match tags
  matchTags?: Record<string, any>;
  matchReason?: string;
  // Interest thread settings
  showPastThreads?: boolean;
  // Subscription split fields
  subscriptionName?: string;
  subscriptionTotalCost?: number;
  subscriptionCostPerPerson?: number;
  // Grocery split fields
  groceryItemName?: string;
  groceryTotalCost?: number;
  groceryCostPerPerson?: number;
  // Carpool fields
  carpoolOrigin?: string;
  carpoolOriginLat?: number;
  carpoolOriginLng?: number;
  carpoolDestination?: string;
  carpoolDestinationLat?: number;
  carpoolDestinationLng?: number;
  carpoolMeetupPoint?: string;
  carpoolMeetupLat?: number;
  carpoolMeetupLng?: number;
  carpoolDepartureTime?: string;
  carpoolCarType?: string;
  carpoolSeatsAvailable?: number;
  carpoolCostPerSeat?: number;
  carpoolPaymentMode?: string;
  carpoolIsScheduled?: boolean;
  matchedAt?: string;
  matchedWithUserId?: string;
  matchedWithUser?: Author;
  // Partner referral fields
  referralCode?: string;
  referredByPartnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: Author;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  content: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  spotsAvailable?: number;
  postType: Post['postType'];
  images?: string[];
  video?: string;
  requirements?: string[];
  visibility?: 'everyone' | 'verified-only';
  visibleRadiusKm?: number;
  subscriptionName?: string;
  subscriptionTotalCost?: number;
  subscriptionCostPerPerson?: number;
  groceryItemName?: string;
  groceryTotalCost?: number;
  groceryCostPerPerson?: number;
  referralCode?: string;
  // Carpool fields
  carpoolOrigin?: string;
  carpoolOriginLat?: number;
  carpoolOriginLng?: number;
  carpoolDestination?: string;
  carpoolDestinationLat?: number;
  carpoolDestinationLng?: number;
  carpoolMeetupPoint?: string;
  carpoolMeetupLat?: number;
  carpoolMeetupLng?: number;
  carpoolDepartureTime?: string;
  carpoolCarType?: string;
  carpoolSeatsAvailable?: number;
  carpoolCostPerSeat?: number;
  carpoolPaymentMode?: string;
  carpoolIsScheduled?: boolean;
}

export interface PostsQuery {
  page?: number;
  limit?: number;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  postType?: Post['postType'];
  status?: Post['status'];
  search?: string;
  sortBy?: 'createdAt' | 'likesCount' | 'interestedCount' | 'viewsCount';
  sortOrder?: 'ASC' | 'DESC';
  viewerLat?: number;
  viewerLng?: number;
  viewerIsVerified?: string;
  viewerId?: string;
  viewerIsAdmin?: string;
  carpoolRadiusKm?: number;
  verifiedOnly?: string;
  platform?: 'web' | 'mobile';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserInteractions {
  likes: string[];
  saves: string[];
  interests: string[];
}

export interface InterestedUser {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    isVerified: boolean;
    occupation: string | null;
    bio: string | null;
  };
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface InterestedUsersResponse {
  data: InterestedUser[];
  total: number;
  page: number;
  totalPages: number;
}

const postsApi = {
  // Get posts with filters
  getPosts: async (query: PostsQuery = {}): Promise<PaginatedResponse<Post>> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    return apiClient.get(`/posts?${params.toString()}`);
  },

  // Get single post
  getPost: async (id: string): Promise<Post> => {
    return apiClient.get(`/posts/${id}`);
  },

  // Create post
  createPost: async (data: CreatePostData): Promise<Post> => {
    return apiClient.post('/posts', data);
  },

  // Update post
  updatePost: async (id: string, data: Partial<CreatePostData>): Promise<Post> => {
    return apiClient.patch(`/posts/${id}`, data);
  },

  // Delete post
  deletePost: async (id: string): Promise<void> => {
    return apiClient.delete(`/posts/${id}`);
  },

  // Like/Unlike post
  toggleLike: async (id: string): Promise<{ liked: boolean; likesCount: number }> => {
    return apiClient.post(`/posts/${id}/like`);
  },

  // Save/Unsave post
  toggleSave: async (id: string): Promise<{ saved: boolean }> => {
    return apiClient.post(`/posts/${id}/save`);
  },

  // Express interest
  toggleInterested: async (id: string): Promise<{ interested: boolean; interestedCount: number }> => {
    return apiClient.post(`/posts/${id}/interested`);
  },

  // Get comments
  getComments: async (postId: string, page = 1, limit = 20): Promise<{ data: Comment[]; total: number }> => {
    return apiClient.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
  },

  // Add comment (with optional parentId for replies)
  addComment: async (postId: string, content: string, parentId?: string): Promise<Comment> => {
    return apiClient.post(`/posts/${postId}/comments`, { content, ...(parentId ? { parentId } : {}) });
  },

  // Edit comment
  editComment: async (commentId: string, content: string): Promise<Comment> => {
    return apiClient.patch(`/posts/comments/${commentId}`, { content });
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<void> => {
    return apiClient.delete(`/posts/comments/${commentId}`);
  },

  // Get user interactions for multiple posts
  getUserInteractions: async (postIds: string[]): Promise<UserInteractions> => {
    return apiClient.post('/posts/interactions', { postIds });
  },

  // Get saved posts
  getSavedPosts: async (page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
    return apiClient.get(`/posts/me/saved?page=${page}&limit=${limit}`);
  },

  // Get users who showed interest in a post (only for post author)
  getInterestedUsers: async (postId: string, page = 1, limit = 20): Promise<InterestedUsersResponse> => {
    return apiClient.get(`/posts/${postId}/interested?page=${page}&limit=${limit}`);
  },

  // Get recommended posts for the current user
  getRecommendations: async (page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
    return apiClient.get(`/posts/recommendations?page=${page}&limit=${limit}`);
  },

  // Get post viewers (premium only)
  getPostViewers: async (postId: string, page = 1, limit = 20): Promise<{
    data: Array<{
      id: string;
      viewer: { id: string; name: string; avatar: string | null; isVerified: boolean; subscriptionTier: string; occupation: string | null };
      viewCount: number;
      firstViewedAt: string;
      lastViewedAt: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return apiClient.get(`/posts/${postId}/viewers?page=${page}&limit=${limit}`);
  },

  // Admin: Promote post
  promotePost: async (postId: string, promotionType: 'sponsored' | 'promoted'): Promise<Post> => {
    return apiClient.patch(`/posts/${postId}/promote`, { promotionType });
  },

  // Admin: Demote post (remove promotion)
  demotePost: async (postId: string): Promise<Post> => {
    return apiClient.delete(`/posts/${postId}/promote`);
  },
};

export default postsApi;
