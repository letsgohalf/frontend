import apiClient from './client';
import { Author, Post } from './posts';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InterestThreadStatus =
  | 'pending_screening'
  | 'open'
  | 'closed'
  | 'matched'
  | 'withdrawn';

export interface ScreeningQuestion {
  id: string;
  postId: string | null;
  question: string;
  order: number;
  isRequired: boolean;
  category: string | null;
  isPlatformDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ScreeningAnswer {
  id: string;
  threadId: string;
  questionId: string;
  question?: ScreeningQuestion;
  answer: string;
  createdAt: string;
}

export interface InterestThread {
  id: string;
  postId: string;
  post?: Post;
  interestedUserId: string;
  interestedUser?: Author;
  postOwnerId: string;
  postOwner?: Author;
  conversationId: string | null;
  screeningAnswers?: ScreeningAnswer[];
  status: InterestThreadStatus;
  initialMessage: string | null;
  screeningCompletedAt: string | null;
  matchedAt: string | null;
  closedAt: string | null;
  closedById: string | null;
  closedReason: string | null;
  meetupTokenOwner: string | null;
  meetupTokenInterested: string | null;
  meetupConfirmedByOwnerAt: string | null;
  meetupConfirmedByInterestedAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpressInterestDto {
  initialMessage?: string;
  screeningAnswers?: {
    questionId: string;
    answer: string;
  }[];
}

export interface SubmitAnswersDto {
  answers: {
    questionId: string;
    answer: string;
  }[];
}

export type CloseAction = 'close' | 'match' | 'withdraw';

export interface CloseThreadDto {
  action: CloseAction;
  reason?: string;
}

export interface CreateScreeningQuestionDto {
  question: string;
  order?: number;
  isRequired?: boolean;
}

export interface PaginatedThreadsResponse {
  data: InterestThread[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ExpressInterestResponse {
  thread: InterestThread;
  requiresScreening: boolean;
}

export interface MeetupVerification {
  qrOwner: {
    name: string;
    avatar: string | null;
    isVerified: boolean;
  };
  carpool: {
    origin: string | null;
    destination: string | null;
    meetupPoint: string | null;
    departureTime: string | null;
    carType: string | null;
    costPerSeat: number | null;
  };
  alreadyConfirmed: boolean;
  tokenBelongsTo: 'owner' | 'interested';
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

const interestThreadsApi = {
  // ─── Express Interest ───

  /**
   * Express interest in a post (creates a thread)
   * Returns the thread and whether screening questions need to be answered
   */
  expressInterest: async (
    postId: string,
    data: ExpressInterestDto = {},
  ): Promise<ExpressInterestResponse> => {
    return apiClient.post(`/interest-threads/posts/${postId}/interest`, data);
  },

  // ─── Screening Questions ───

  /**
   * Get screening questions for a post (combines post-specific + platform defaults)
   */
  getQuestionsForPost: async (postId: string): Promise<ScreeningQuestion[]> => {
    return apiClient.get(`/interest-threads/posts/${postId}/questions`);
  },

  /**
   * Add screening questions to a post (post owner only)
   */
  addScreeningQuestions: async (
    postId: string,
    questions: CreateScreeningQuestionDto[],
  ): Promise<ScreeningQuestion[]> => {
    return apiClient.post(`/interest-threads/posts/${postId}/questions`, { questions });
  },

  /**
   * Delete a screening question
   */
  removeScreeningQuestion: async (questionId: string): Promise<void> => {
    return apiClient.delete(`/interest-threads/questions/${questionId}`);
  },

  // ─── Screening Answers ───

  /**
   * Submit screening answers for a thread (batch)
   */
  submitAnswers: async (
    threadId: string,
    answers: { questionId: string; answer: string }[],
  ): Promise<InterestThread> => {
    return apiClient.post(`/interest-threads/${threadId}/answers`, { answers });
  },

  /**
   * Save a single screening answer
   */
  saveAnswer: async (
    threadId: string,
    questionId: string,
    answer: string,
  ): Promise<ScreeningAnswer> => {
    return apiClient.patch(`/interest-threads/${threadId}/answers/${questionId}`, { answer });
  },

  // ─── Thread Management ───

  /**
   * Get all threads for a post (post owner only)
   */
  getThreadsForPost: async (
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedThreadsResponse> => {
    return apiClient.get(`/interest-threads/posts/${postId}/threads?page=${page}&limit=${limit}`);
  },

  /**
   * Get my interest threads (as the interested party)
   */
  getMyThreads: async (page = 1, limit = 20): Promise<PaginatedThreadsResponse> => {
    return apiClient.get(`/interest-threads/my-threads?page=${page}&limit=${limit}`);
  },

  /**
   * Get a specific thread by ID
   */
  getThread: async (threadId: string): Promise<InterestThread> => {
    return apiClient.get(`/interest-threads/${threadId}`);
  },

  /**
   * Get past threads for viewing (if post owner allows)
   */
  getPastThreads: async (postId: string): Promise<InterestThread[]> => {
    return apiClient.get(`/interest-threads/posts/${postId}/past-threads`);
  },

  // ─── Close / Match ───

  /**
   * Close a thread (reject), mark as matched, or withdraw interest
   */
  closeThread: async (threadId: string, data: CloseThreadDto): Promise<InterestThread> => {
    return apiClient.post(`/interest-threads/${threadId}/close`, data);
  },

  /**
   * Convenience method to mark a thread as matched
   */
  matchThread: async (threadId: string): Promise<InterestThread> => {
    return apiClient.post(`/interest-threads/${threadId}/close`, {
      action: 'match',
    });
  },

  /**
   * Convenience method to withdraw interest
   */
  withdrawInterest: async (threadId: string, reason?: string): Promise<InterestThread> => {
    return apiClient.post(`/interest-threads/${threadId}/close`, {
      action: 'withdraw',
      reason,
    });
  },

  // ─── Post Settings ───

  /**
   * Update post thread visibility settings
   */
  updatePostSettings: async (
    postId: string,
    showPastThreads: boolean,
  ): Promise<Post> => {
    return apiClient.patch(`/interest-threads/posts/${postId}/settings`, {
      showPastThreads,
    });
  },

  // ─── Repost ───

  /**
   * Create a new post from a matched one
   */
  repost: async (postId: string): Promise<Post> => {
    return apiClient.post(`/interest-threads/posts/${postId}/repost`);
  },

  // ─── Meetup QR Verification ───

  getMeetupVerification: async (token: string): Promise<MeetupVerification> => {
    return apiClient.get(`/interest-threads/verify-meetup/${token}`);
  },

  confirmMeetup: async (token: string): Promise<{ message: string }> => {
    return apiClient.post(`/interest-threads/verify-meetup/${token}/confirm`);
  },

  // ─── Admin: Platform Questions ───

  /**
   * Get all platform default questions (admin)
   */
  getPlatformQuestions: async (): Promise<ScreeningQuestion[]> => {
    return apiClient.get('/interest-threads/admin/platform-questions');
  },

  /**
   * Create a platform default question (admin)
   */
  createPlatformQuestion: async (data: {
    question: string;
    order?: number;
    isRequired?: boolean;
    category?: string;
  }): Promise<ScreeningQuestion> => {
    return apiClient.post('/interest-threads/admin/platform-questions', data);
  },
};

export default interestThreadsApi;
