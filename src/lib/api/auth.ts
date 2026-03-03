import apiClient from './client';

export type AuthMethod = 'email_password' | 'phone_otp' | 'email_otp';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  avatar?: string;
  bio?: string;
  occupation?: string;
  age?: number;
  preferredLocations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  homeLatitude?: number;
  homeLongitude?: number;
  homeLocationName?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdVerified: boolean;
  isVerified: boolean;
  agentTier?: 'licensed_pro' | 'registered_agent' | 'property_owner' | 'house_owner' | null;
  isAgentVerified?: boolean;
  agentVerifiedAt?: string;
  // Premium fields
  subscriptionTier?: 'free' | 'premium';
  // Partner fields
  isPartner?: boolean;
  partnerApprovedAt?: string;
  referralCode?: string;
  role?: 'user' | 'admin';
  // Privacy settings
  showOnlineStatus?: boolean;
  showLikes?: boolean;
  showLastSeen?: boolean;
  profileVisibility?: 'public' | 'verified' | 'matches';
  lastSeenAt?: string;
  // Notification settings
  notifyOnInterest?: boolean;
  notifyOnMessage?: boolean;
  notifyOnMatch?: boolean;
  pendingInterestCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  method: AuthMethod;
  email?: string;
  phone?: string;
  password?: string;
  name: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password?: string;
}

export interface OtpRequest {
  email?: string;
  phone?: string;
}

export interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  otp: string;
}

export interface AuthResponse {
  message: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  requiresVerification?: boolean;
  isNewUser?: boolean;
  userId?: string;
}

export const authApi = {
  // Register with email/password or request OTP for phone/email
  register: (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post('/auth/register', data);
  },

  // Login with email/password or request OTP
  login: (data: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', data);
  },

  // Request OTP for phone or email
  requestOtp: (data: OtpRequest): Promise<AuthResponse> => {
    return apiClient.post('/auth/request-otp', data);
  },

  // Verify OTP and complete authentication
  verifyOtp: (data: VerifyOtpRequest): Promise<AuthResponse> => {
    return apiClient.post('/auth/verify-otp', data);
  },

  // Resend OTP
  resendOtp: (data: OtpRequest): Promise<AuthResponse> => {
    return apiClient.post('/auth/resend-otp', data);
  },

  // Forgot password - request OTP for password reset
  forgotPassword: (data: { email: string }): Promise<AuthResponse> => {
    return apiClient.post('/auth/forgot-password', data);
  },

  // Reset password using OTP
  resetPassword: (data: { email: string; otp: string; newPassword: string }): Promise<AuthResponse> => {
    return apiClient.post('/auth/reset-password', data);
  },

  // Get current user
  getCurrentUser: (): Promise<User> => {
    return apiClient.get('/auth/me');
  },

  // Update user profile
  updateProfile: (data: Partial<User>): Promise<User> => {
    return apiClient.patch('/auth/profile', data);
  },
};

export default authApi;
