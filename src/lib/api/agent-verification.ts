import apiClient from './client';

export type AgentTier = 'licensed_pro' | 'registered_agent' | 'property_owner' | 'house_owner';

export type AgentDocumentType =
  | 'esvarbon_license'
  | 'niesv_certificate'
  | 'lasrera_certificate'
  | 'cac_certificate'
  | 'ercaan_membership'
  | 'redan_membership'
  | 'certificate_of_occupancy'
  | 'governors_consent'
  | 'deed_of_assignment'
  | 'survey_plan'
  | 'excision_gazette'
  | 'valid_id'
  | 'house_photos';

export type AgentVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AgentVerificationRequest {
  id: string;
  userId: string;
  tier: AgentTier;
  documentType: AgentDocumentType;
  documentNumber?: string;
  businessName?: string;
  licenseNumber?: string;
  documentFrontImage: string;
  documentBackImage?: string;
  supportingDocumentImage?: string;
  status: AgentVerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAgentVerificationRequest extends AgentVerificationRequest {
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  adminNotes?: string;
}

export interface SubmitAgentVerificationData {
  tier: AgentTier;
  documentType: AgentDocumentType;
  documentNumber?: string;
  businessName?: string;
  licenseNumber?: string;
  documentFrontImage: string;
  documentBackImage?: string;
  supportingDocumentImage?: string;
}

export interface AgentVerificationStatusResponse {
  isAgentVerified: boolean;
  agentTier: AgentTier | null;
  latestRequest?: AgentVerificationRequest;
  hasPendingRequest: boolean;
  canSubmit: boolean;
}

export interface ReviewAgentVerificationData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
}

const agentVerificationApi = {
  getStatus: async (): Promise<AgentVerificationStatusResponse> => {
    return apiClient.get<AgentVerificationStatusResponse>('/agent-verification/status');
  },

  submit: async (data: SubmitAgentVerificationData): Promise<AgentVerificationRequest> => {
    return apiClient.post<AgentVerificationRequest>('/agent-verification/submit', data);
  },

  getHistory: async (): Promise<AgentVerificationRequest[]> => {
    return apiClient.get<AgentVerificationRequest[]>('/agent-verification/history');
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/agent-verification/${id}/cancel`);
  },

  admin: {
    getPending: async (): Promise<AdminAgentVerificationRequest[]> => {
      return apiClient.get<AdminAgentVerificationRequest[]>('/agent-verification/admin/pending');
    },

    getAll: async (status?: AgentVerificationStatus): Promise<AdminAgentVerificationRequest[]> => {
      const query = status ? `?status=${status}` : '';
      return apiClient.get<AdminAgentVerificationRequest[]>(`/agent-verification/admin/all${query}`);
    },

    getById: async (id: string): Promise<AdminAgentVerificationRequest> => {
      return apiClient.get<AdminAgentVerificationRequest>(`/agent-verification/admin/${id}`);
    },

    review: async (id: string, data: ReviewAgentVerificationData): Promise<AdminAgentVerificationRequest> => {
      return apiClient.patch<AdminAgentVerificationRequest>(`/agent-verification/admin/${id}/review`, data);
    },
  },
};

export default agentVerificationApi;
