import apiClient from './client';

// ─── Types ──────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceFormatted: string;
  currency: string;
  interval: string;
}

export interface BoostOption {
  id: string;
  name: string;
  description: string;
  price: number;
  priceFormatted: string;
  currency: string;
}

export interface PlansResponse {
  plans: SubscriptionPlan[];
  boosts: BoostOption[];
}

export interface SubscriptionStatus {
  subscriptionTier: 'free' | 'premium';
  subscription: any | null;
  isPremium: boolean;
}

export interface PaymentInitResponse {
  paymentId: string;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaymentVerifyResponse {
  status: 'success' | 'failed' | 'pending';
  message: string;
}

export interface FreeBoostStatus {
  available: boolean;
  reason?: string;
  used: number;
  limit: number;
}

// ─── API calls ──────────────────────────────────────────────────────────

const paymentsApi = {
  getPlans: async (): Promise<PlansResponse> => {
    return apiClient.get('/payments/plans');
  },

  getMySubscription: async (): Promise<SubscriptionStatus> => {
    return apiClient.get('/payments/my-subscription');
  },

  initiatePayment: async (
    type: 'premium_subscription' | 'interest_boost' | 'post_boost' | 'chat_unlock',
    referenceId?: string,
  ): Promise<PaymentInitResponse> => {
    return apiClient.post('/payments/initiate', { type, referenceId });
  },

  verifyPayment: async (reference: string): Promise<PaymentVerifyResponse> => {
    return apiClient.post('/payments/verify', { reference });
  },

  getFreeBoostStatus: async (): Promise<FreeBoostStatus> => {
    return apiClient.get('/payments/free-boost-status');
  },

  applyFreeBoost: async (postId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post('/payments/free-boost', { postId });
  },

  getPremiumStatus: async (): Promise<{ premiumEnabledWeb: boolean; premiumEnabledMobile: boolean }> => {
    return apiClient.get('/settings/premium-status');
  },
};

export default paymentsApi;
