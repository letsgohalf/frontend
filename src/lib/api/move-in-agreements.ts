import apiClient from './client';

export type MoveInAgreementStatus = 'pending' | 'completed' | 'approved' | 'rejected';

export interface MoveInAgreement {
  id: string;
  threadId: string;
  tenantId: string;
  landlordId: string;
  status: MoveInAgreementStatus;

  // Poster (host) details
  posterFullName: string | null;
  posterPhone: string | null;
  posterEmail: string | null;
  posterDateOfBirth: string | null;
  posterOccupation: string | null;
  posterEmployer: string | null;
  posterSubmittedAt: string | null;

  // Interested party details
  fullName: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  occupation: string | null;
  employer: string | null;

  // Guarantor
  guarantorFullName: string | null;
  guarantorPhone: string | null;
  guarantorEmail: string | null;
  guarantorAddress: string | null;
  guarantorRelationship: string | null;
  guarantorOccupation: string | null;
  guarantorIdImageUrl: string | null;

  // Move-In Preferences
  preferredMoveInDate: string | null;
  durationOfStay: string | null;
  numberOfOccupants: number | null;
  hasPets: boolean;
  petDetails: string | null;
  isSmoker: boolean;
  specialRequirements: string | null;

  // Output
  pdfUrl: string | null;
  landlordNotes: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  tenant?: { id: string; name: string; email: string; avatar?: string };
  landlord?: { id: string; name: string; email: string; avatar?: string };
}

export interface SubmitMoveInAgreementData {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  occupation?: string;
  employer?: string;

  guarantorFullName: string;
  guarantorPhone: string;
  guarantorEmail: string;
  guarantorAddress: string;
  guarantorRelationship: string;
  guarantorOccupation: string;
  guarantorIdImage?: string; // base64

  preferredMoveInDate?: string;
  durationOfStay?: string;
  numberOfOccupants?: number;
  hasPets?: boolean;
  petDetails?: string;
  isSmoker?: boolean;
  specialRequirements?: string;
}

export interface SubmitPosterDetailsData {
  posterFullName: string;
  posterPhone: string;
  posterEmail: string;
  posterDateOfBirth: string;
  posterOccupation?: string;
  posterEmployer?: string;
}

const moveInAgreementsApi = {
  /** Get or create agreement for a matched thread */
  get: (threadId: string) =>
    apiClient.get<MoveInAgreement>(`/move-in-agreements/threads/${threadId}`),

  /** Submit interested party details (tenant) */
  submit: (threadId: string, data: SubmitMoveInAgreementData) =>
    apiClient.post<MoveInAgreement>(`/move-in-agreements/threads/${threadId}`, data),

  /** Submit poster (host) details */
  submitPoster: (threadId: string, data: SubmitPosterDetailsData) =>
    apiClient.post<MoveInAgreement>(`/move-in-agreements/threads/${threadId}/poster`, data),

  /** Approve or reject agreement */
  updateStatus: (agreementId: string, status: 'approved' | 'rejected', landlordNotes?: string) =>
    apiClient.patch<MoveInAgreement>(`/move-in-agreements/${agreementId}/status`, {
      status,
      landlordNotes,
    }),

  /** Download a single party's PDF */
  getPartyPdf: (agreementId: string, party: 'poster' | 'tenant') =>
    apiClient.get<{ pdfUrl: string }>(`/move-in-agreements/${agreementId}/pdf/${party}`),
};

export default moveInAgreementsApi;
