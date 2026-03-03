import apiClient from './client';

export type PartnerApplicationStatus = 'pending' | 'approved' | 'rejected';
export type CommissionType = 'post_creation' | 'successful_match';
export type CommissionStatus = 'pending' | 'paid';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface PartnerApplication {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  hearAbout: string;
  experience?: string;
  whyPartner: string;
  status: PartnerApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPartnerApplication extends PartnerApplication {
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
}

export interface PartnerStatusResponse {
  isPartner: boolean;
  referralCode?: string;
  latestApplication?: PartnerApplication;
  hasPendingApplication: boolean;
  canSubmit: boolean;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  commissionCount: number;
  referralCode?: string;
}

export interface Commission {
  id: string;
  partnerId: string;
  postId: string;
  referredUserId: string;
  type: CommissionType;
  amount: number;
  status: CommissionStatus;
  paidAt?: string;
  paidBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  referredUser?: { id: string; name: string; avatar?: string };
  post?: { id: string; content: string; location: string };
  partner?: { id: string; name: string; email?: string; referralCode?: string };
}

export interface PayoutRequest {
  id: string;
  partnerId: string;
  amount: number;
  status: PayoutStatus;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  processedBy?: string;
  processedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  partner?: { id: string; name: string; email?: string; referralCode?: string };
}

export interface ReferralValidation {
  valid: boolean;
  partnerId?: string;
  partnerName?: string;
}

export interface SubmitPartnerApplicationData {
  fullName: string;
  phone: string;
  email: string;
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  hearAbout: string;
  experience?: string;
  whyPartner: string;
}

export interface RequestPayoutData {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface CommissionSettings {
  commissionMode: 'percentage' | 'fixed';
  postCreationCommission: number;
  matchCommission: number;
}

const partnersApi = {
  getStatus: async (): Promise<PartnerStatusResponse> => {
    return apiClient.get<PartnerStatusResponse>('/partners/status');
  },

  submit: async (data: SubmitPartnerApplicationData): Promise<PartnerApplication> => {
    return apiClient.post<PartnerApplication>('/partners/apply', data);
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/partners/${id}/cancel`);
  },

  getEarnings: async (): Promise<EarningsSummary> => {
    return apiClient.get<EarningsSummary>('/partners/earnings');
  },

  getCommissions: async (page = 1, limit = 20): Promise<{ data: Commission[]; total: number; hasMore: boolean }> => {
    return apiClient.get(`/partners/commissions?page=${page}&limit=${limit}`);
  },

  requestPayout: async (data: RequestPayoutData): Promise<PayoutRequest> => {
    return apiClient.post<PayoutRequest>('/partners/payout/request', data);
  },

  getPayoutHistory: async (): Promise<PayoutRequest[]> => {
    return apiClient.get<PayoutRequest[]>('/partners/payout/history');
  },

  validateReferral: async (code: string): Promise<ReferralValidation> => {
    return apiClient.get<ReferralValidation>(`/partners/validate-referral/${code}`);
  },

  admin: {
    getPendingApplications: async (): Promise<AdminPartnerApplication[]> => {
      return apiClient.get<AdminPartnerApplication[]>('/partners/admin/applications/pending');
    },

    getAllApplications: async (status?: PartnerApplicationStatus): Promise<AdminPartnerApplication[]> => {
      const query = status ? `?status=${status}` : '';
      return apiClient.get<AdminPartnerApplication[]>(`/partners/admin/applications${query}`);
    },

    getApplicationById: async (id: string): Promise<AdminPartnerApplication> => {
      return apiClient.get<AdminPartnerApplication>(`/partners/admin/applications/${id}`);
    },

    reviewApplication: async (id: string, data: {
      status: 'approved' | 'rejected';
      rejectionReason?: string;
      adminNotes?: string;
    }): Promise<AdminPartnerApplication> => {
      return apiClient.patch<AdminPartnerApplication>(`/partners/admin/applications/${id}/review`, data);
    },

    getAllPartners: async (): Promise<any[]> => {
      return apiClient.get('/partners/admin/partners');
    },

    getPartnerDetail: async (id: string): Promise<any> => {
      return apiClient.get(`/partners/admin/partners/${id}`);
    },

    getAllCommissions: async (status?: CommissionStatus): Promise<Commission[]> => {
      const query = status ? `?status=${status}` : '';
      return apiClient.get<Commission[]>(`/partners/admin/commissions${query}`);
    },

    markCommissionPaid: async (id: string): Promise<Commission> => {
      return apiClient.patch<Commission>(`/partners/admin/commissions/${id}/pay`, {});
    },

    getAllPayoutRequests: async (status?: PayoutStatus): Promise<PayoutRequest[]> => {
      const query = status ? `?status=${status}` : '';
      return apiClient.get<PayoutRequest[]>(`/partners/admin/payouts${query}`);
    },

    processPayoutRequest: async (id: string, data: {
      status: 'completed' | 'rejected';
      adminNotes?: string;
      rejectionReason?: string;
    }): Promise<PayoutRequest> => {
      return apiClient.patch<PayoutRequest>(`/partners/admin/payouts/${id}/process`, data);
    },

    getCommissionSettings: async (): Promise<CommissionSettings> => {
      return apiClient.get<CommissionSettings>('/partners/admin/commission-settings');
    },

    updateCommissionSettings: async (data: Partial<CommissionSettings>): Promise<CommissionSettings> => {
      return apiClient.patch<CommissionSettings>('/partners/admin/commission-settings', data);
    },
  },
};

export default partnersApi;
