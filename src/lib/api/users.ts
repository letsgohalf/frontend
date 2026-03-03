import apiClient from './client';
import { Post, PaginatedResponse } from './posts';

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  name: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  age?: number;
  preferredLocations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    listings: number;
    interested: number;
    matches: number;
    reviews: number;
  };
}

export interface PublicProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  preferredLocations?: string[];
  isVerified: boolean;
  createdAt: string;
  stats: {
    listings: number;
  };
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  age?: number;
  preferredLocations?: string[];
  budgetMin?: number;
  budgetMax?: number;
}

export interface CommunityStats {
  activeUsers: number;
  activeListings: number;
  matches: number;
}

const usersApi = {
  // Get public community stats (no auth required)
  getCommunityStats: async (): Promise<CommunityStats> => {
    return apiClient.get('/users/public/stats');
  },

  // Get current user's profile
  getMyProfile: async (): Promise<UserProfile> => {
    return apiClient.get('/users/me');
  },

  // Update current user's profile
  updateMyProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    return apiClient.patch('/users/me', data);
  },

  // Get current user's posts
  getMyPosts: async (page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
    return apiClient.get(`/users/me/posts?page=${page}&limit=${limit}`);
  },

  // Get public profile
  getPublicProfile: async (userId: string): Promise<PublicProfile> => {
    return apiClient.get(`/users/${userId}`);
  },

  // Get user's public posts
  getUserPosts: async (userId: string, page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
    return apiClient.get(`/users/${userId}/posts?page=${page}&limit=${limit}`);
  },

  // Admin methods
  admin: {
    // Get all users (admin only)
    getAllUsers: async (page = 1, limit = 20, search?: string): Promise<AdminUsersResponse> => {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      return apiClient.get(`/users/admin/all?page=${page}&limit=${limit}${searchParam}`);
    },

    // Get platform stats (admin only)
    getStats: async (): Promise<AdminStats> => {
      return apiClient.get('/users/admin/stats');
    },

    // Get user by ID with full details (admin only)
    getUserById: async (userId: string): Promise<AdminUserDetail> => {
      return apiClient.get(`/users/admin/${userId}`);
    },

    // Update user (admin only) - can update isVerified, etc.
    updateUser: async (userId: string, data: AdminUpdateUserData): Promise<AdminUser> => {
      return apiClient.patch(`/users/admin/${userId}`, data);
    },

    // Delete user permanently (admin only)
    deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
      return apiClient.delete(`/users/admin/${userId}`);
    },
  },
};

// Admin types
export interface AdminUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  age?: number;
  preferredLocations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdVerified: boolean;
  isVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  stats: {
    totalPosts: number;
    totalInterests: number;
  };
}

export interface AdminUsersResponse {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalPosts: number;
  activePosts: number;
}

export interface AdminUpdateUserData {
  isVerified?: boolean;
  isIdVerified?: boolean;
  role?: 'user' | 'admin';
  name?: string;
  email?: string;
  bio?: string;
  occupation?: string;
}

export default usersApi;
