'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileQuestion,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import interestThreadsApi, {
  InterestThread,
  ScreeningQuestion,
} from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default function ScreeningPage({ params }: PageProps) {
  const { threadId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [thread, setThread] = useState<InterestThread | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/my-interests/' + threadId + '/screening');
    }
  }, [authLoading, user, router, threadId]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, threadId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [threadData, questionsData] = await Promise.all([
        interestThreadsApi.getThread(threadId),
        // Get questions from the thread's post
        null, // We'll get questions from the thread response
      ]);

      setThread(threadData);

      // If thread is not pending screening, redirect to detail
      if (threadData.status !== 'pending_screening') {
        router.replace(`/my-interests/${threadId}`);
        return;
      }

      // Get questions for the post
      const qs = await interestThreadsApi.getQuestionsForPost(threadData.postId);
      setQuestions(qs);

      // Pre-fill any existing answers
      if (threadData.screeningAnswers) {
        const existingAnswers: Record<string, string> = {};
        threadData.screeningAnswers.forEach((a) => {
          existingAnswers[a.questionId] = a.answer;
        });
        setAnswers(existingAnswers);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load screening questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const canSubmit = () => {
    const requiredUnanswered = questions
      .filter((q) => q.isRequired)
      .some((q) => !answers[q.id]?.trim());
    return !requiredUnanswered;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    try {
      setSubmitting(true);
      setError(null);

      const answersArray = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }));

      const updatedThread = await interestThreadsApi.submitAnswers(threadId, answersArray);

      setSuccess(true);
      setThread(updatedThread);

      // Redirect to conversation after a moment
      setTimeout(() => {
        if (updatedThread.conversationId) {
          router.push(`/messages/${updatedThread.conversationId}`);
        } else {
          router.push(`/my-interests/${threadId}`);
        }
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Answers Submitted!</h2>
          <p className="text-gray-600 mb-4">
            The post owner can now see your answers. You can start chatting!
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-teal-500 mx-auto" />
          <p className="text-sm text-gray-400 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Complete Screening</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Post info */}
        {thread?.post && (
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-500 mb-1">Interested in</p>
            <p className="font-medium text-gray-900">{thread.post.location || 'Listing'}</p>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {thread.post.content}
            </p>
          </div>
        )}

        {/* Info banner */}
        <div className="p-4 bg-teal-50 rounded-xl flex items-start gap-3">
          <FileQuestion className="w-6 h-6 text-teal-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-teal-800">Screening Questions</h3>
            <p className="text-sm text-teal-700 mt-1">
              Please answer these questions to help the post owner learn more about you.
              Once completed, you can start chatting!
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl border divide-y">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {idx + 1}. {q.question}
                {q.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Your answer..."
                className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
                required={q.isRequired}
              />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || submitting}
          className="w-full py-3 px-4 bg-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          Submit Answers
        </button>
      </div>
    </div>
  );
}
