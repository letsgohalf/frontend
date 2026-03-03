import apiClient from './client';

export interface TestimonialUser {
  id: string;
  name: string;
  avatar: string | null;
  occupation: string | null;
  isVerified: boolean;
}

export interface Testimonial {
  id: string;
  content: string;
  headline: string | null;
  rating: number | null;
  isFeatured: boolean;
  createdAt: string;
  user: TestimonialUser;
}

export interface TestimonialsResponse {
  testimonials: Testimonial[];
  total: number;
  hasMore: boolean;
}

export interface UserTestimonial {
  id: string;
  content: string;
  headline: string | null;
  rating: number | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CreateTestimonialDto {
  content: string;
  headline?: string;
  rating?: number;
}

const testimonialsApi = {
  // Get approved testimonials (public)
  getApproved: (limit: number = 20, offset: number = 0): Promise<TestimonialsResponse> =>
    apiClient.get(`/testimonials?limit=${limit}&offset=${offset}`),

  // Get featured testimonials
  getFeatured: (limit: number = 6): Promise<Testimonial[]> =>
    apiClient.get(`/testimonials/featured?limit=${limit}`),

  // Submit a testimonial (authenticated)
  create: (data: CreateTestimonialDto): Promise<{ success: boolean; message: string }> =>
    apiClient.post('/testimonials', data),

  // Get user's own testimonials (authenticated)
  getMine: (): Promise<UserTestimonial[]> =>
    apiClient.get('/testimonials/mine'),

  // Admin: get pending testimonials
  getPending: (): Promise<any[]> =>
    apiClient.get('/testimonials/admin/pending'),

  // Admin: get all testimonials
  getAll: (status?: string): Promise<any[]> =>
    apiClient.get(`/testimonials/admin/all${status ? `?status=${status}` : ''}`),

  // Admin: update status
  updateStatus: (id: string, status: string, isFeatured?: boolean): Promise<{ success: boolean }> =>
    apiClient.patch(`/testimonials/admin/${id}`, { status, isFeatured }),

  // Admin: delete
  delete: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/testimonials/admin/${id}`),
};

export default testimonialsApi;
