import apiClient from './client';

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'choice' | 'yesno' | 'area_pick' | 'text';
  options?: string[];
  category: 'rent' | 'traffic' | 'safety' | 'amenities' | 'general' | 'feedback' | 'testimonial';
  area?: string;
}

export interface InsightData {
  average?: number;
  label?: string;
  distribution?: { option: string; count: number; percentage: number }[];
  winner?: string;
  winnerPercentage?: number;
  yes?: number;
  no?: number;
  totalResponses: number;
}

export interface SurveyInsight {
  questionId: string;
  question: string;
  type: string;
  category: string;
  area?: string;
  data: InsightData;
}

const surveysApi = {
  // Get unanswered questions for current user
  getQuestions: (limit: number = 5): Promise<SurveyQuestion[]> =>
    apiClient.get(`/surveys/questions?limit=${limit}`),

  // Submit a response
  submitResponse: (questionId: string, answer: string): Promise<{ success: boolean }> =>
    apiClient.post('/surveys/respond', { questionId, answer }),

  // Get aggregated community insights
  getInsights: (): Promise<SurveyInsight[]> =>
    apiClient.get('/surveys/insights'),
};

export default surveysApi;
