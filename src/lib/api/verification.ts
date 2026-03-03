import apiClient from './client';

export type VerificationDocumentType = 'nin' | 'drivers_license' | 'passport' | 'voters_card';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: string;
  userId: string;
  documentType: VerificationDocumentType;
  documentNumber?: string;
  documentFrontImage: string;
  documentBackImage?: string;
  selfieImage?: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVerificationRequest extends VerificationRequest {
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  adminNotes?: string;
}

export interface SubmitVerificationData {
  documentType: VerificationDocumentType;
  documentNumber?: string;
  documentFrontImage: string;
  documentBackImage?: string;
  selfieImage?: string;
}

export interface VerificationStatusResponse {
  isVerified: boolean;
  hasPendingRequest: boolean;
  latestRequest?: VerificationRequest;
}

export interface ReviewVerificationData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
}

const verificationApi = {
  // Get current verification status
  getStatus: async (): Promise<VerificationStatusResponse> => {
    return apiClient.get<VerificationStatusResponse>('/verification/status');
  },

  // Submit a new verification request
  submit: async (data: SubmitVerificationData): Promise<VerificationRequest> => {
    return apiClient.post<VerificationRequest>('/verification/submit', data);
  },

  // Get verification history
  getHistory: async (): Promise<VerificationRequest[]> => {
    return apiClient.get<VerificationRequest[]>('/verification/history');
  },

  // Cancel a pending verification request
  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/verification/${id}/cancel`);
  },

  // Admin methods
  admin: {
    // Get pending verification requests
    getPending: async (): Promise<AdminVerificationRequest[]> => {
      return apiClient.get<AdminVerificationRequest[]>('/verification/admin/pending');
    },

    // Get all verification requests with optional status filter
    getAll: async (status?: VerificationStatus): Promise<AdminVerificationRequest[]> => {
      const query = status ? `?status=${status}` : '';
      return apiClient.get<AdminVerificationRequest[]>(`/verification/admin/all${query}`);
    },

    // Get single verification request by ID
    getById: async (id: string): Promise<AdminVerificationRequest> => {
      return apiClient.get<AdminVerificationRequest>(`/verification/admin/${id}`);
    },

    // Approve or reject a verification request
    review: async (id: string, data: ReviewVerificationData): Promise<AdminVerificationRequest> => {
      return apiClient.patch<AdminVerificationRequest>(`/verification/admin/${id}/review`, data);
    },
  },
};

export default verificationApi;
