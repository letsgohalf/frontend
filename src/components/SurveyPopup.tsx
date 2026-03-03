'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  Car,
  Shield,
  Sparkles,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  SkipForward,
  MessageSquare,
  Star,
  Send,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import surveysApi, { SurveyQuestion } from '@/lib/api/surveys';

const categoryIcons: Record<string, React.ElementType> = {
  rent: Home,
  traffic: Car,
  safety: Shield,
  amenities: Sparkles,
  general: MapPin,
  feedback: MessageSquare,
  testimonial: Star,
};

const categoryColors: Record<string, string> = {
  rent: 'from-[var(--peach-400)] to-[var(--pink-400)]',
  traffic: 'from-[var(--yellow-400)] to-[var(--peach-400)]',
  safety: 'from-[var(--teal-400)] to-[var(--lime-400)]',
  amenities: 'from-[var(--lavender-400)] to-[var(--pink-400)]',
  general: 'from-[var(--lime-400)] to-[var(--teal-400)]',
  feedback: 'from-[var(--lavender-400)] to-[var(--teal-400)]',
  testimonial: 'from-[var(--yellow-400)] to-[var(--pink-400)]',
};

const ratingEmojis = ['😞', '😐', '😊', '😃', '🤩'];
const ratingLabels = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'];

export default function SurveyPopup() {
  const { user, isAuthenticated } = useAuth();
  const [question, setQuestion] = useState<SurveyQuestion | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we should show the popup
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Don't show on chat page
    if (typeof window !== 'undefined' && window.location.pathname === '/chat') return;

    // Session check — max once per session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('surveyShown')) return;

    // Cooldown check — 24 hours after last dismissal
    if (typeof localStorage !== 'undefined') {
      const lastDismissed = localStorage.getItem('surveyDismissedAt');
      if (lastDismissed) {
        const elapsed = Date.now() - parseInt(lastDismissed, 10);
        if (elapsed < 24 * 60 * 60 * 1000) return;
      }
    }

    // Fetch 1 random question after 30s delay
    timerRef.current = setTimeout(async () => {
      try {
        const data = await surveysApi.getQuestions(1);
        if (data.length > 0) {
          setQuestion(data[0]);
          setIsVisible(true);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('surveyShown', 'true');
          }
        }
      } catch (err) {
        console.error('Failed to fetch survey question:', err);
      }
    }, 30000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, user]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('surveyDismissedAt', Date.now().toString());
    }
  }, []);

  const handleAnswer = useCallback(async (answer: string) => {
    if (isSubmitting || !question) return;

    setSelectedAnswer(answer);
    setIsSubmitting(true);

    try {
      await surveysApi.submitResponse(question.id, answer);
    } catch (err) {
      console.error('Failed to submit survey response:', err);
    }

    // Close after brief delay
    setTimeout(() => {
      dismiss();
    }, 500);
  }, [question, isSubmitting, dismiss]);

  const handleTextSubmit = useCallback(() => {
    if (textAnswer.trim().length < 3) return;
    handleAnswer(textAnswer.trim());
  }, [textAnswer, handleAnswer]);

  const skipQuestion = useCallback(() => {
    dismiss();
  }, [dismiss]);

  if (!isVisible || !question) return null;

  const CategoryIcon = categoryIcons[question.category] || MapPin;
  const gradientClass = categoryColors[question.category] || categoryColors.general;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]"
          />

          {/* Card — centered on desktop, bottom sheet on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed left-4 right-4 bottom-6 md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[151]"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
              {/* Header */}
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                    <CategoryIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      Quick question
                      {question.area && ` · ${question.area}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Question */}
              <div className="px-5 py-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                  {question.question}
                </h3>
              </div>

              {/* Answer area */}
              <div className="px-5 pb-5">
                {/* Rating type */}
                {question.type === 'rating' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {ratingEmojis.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(String(i + 1))}
                          disabled={isSubmitting}
                          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                            selectedAnswer === String(i + 1)
                              ? 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 scale-110'
                              : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          } disabled:opacity-60`}
                        >
                          <span className="text-2xl">{emoji}</span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                            {ratingLabels[i]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Choice type */}
                {question.type === 'choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={isSubmitting}
                        className={`w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-medium ${
                          selectedAnswer === option
                            ? 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-700)] dark:text-[var(--teal-300)] ring-2 ring-[var(--teal-400)]'
                            : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        } disabled:opacity-60`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Yes/No type */}
                {question.type === 'yesno' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAnswer('yes')}
                      disabled={isSubmitting}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all font-semibold ${
                        selectedAnswer === 'yes'
                          ? 'bg-[var(--lime-200)] dark:bg-[var(--lime-500)]/20 text-[var(--lime-700)] dark:text-[var(--lime-300)] scale-105'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[var(--lime-50)] dark:hover:bg-[var(--lime-500)]/10'
                      } disabled:opacity-60`}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer('no')}
                      disabled={isSubmitting}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all font-semibold ${
                        selectedAnswer === 'no'
                          ? 'bg-[var(--pink-200)] dark:bg-[var(--pink-500)]/20 text-[var(--pink-700)] dark:text-[var(--pink-300)] scale-105'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[var(--pink-50)] dark:hover:bg-[var(--pink-500)]/10'
                      } disabled:opacity-60`}
                    >
                      <ThumbsDown className="w-5 h-5" />
                      No
                    </button>
                  </div>
                )}

                {/* Area pick type */}
                {question.type === 'area_pick' && question.options && (
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((area) => (
                      <button
                        key={area}
                        onClick={() => handleAnswer(area)}
                        disabled={isSubmitting}
                        className={`px-4 py-2.5 rounded-full transition-all text-sm font-medium ${
                          selectedAnswer === area
                            ? 'bg-[var(--teal-400)] text-white scale-105'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[var(--teal-50)] dark:hover:bg-[var(--teal-500)]/10'
                        } disabled:opacity-60`}
                      >
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {area}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text type */}
                {question.type === 'text' && (
                  <div className="space-y-3">
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Share your thoughts..."
                      disabled={isSubmitting}
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 border border-neutral-200 dark:border-neutral-700 focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20 outline-none resize-none text-sm transition-all disabled:opacity-60"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={isSubmitting || textAnswer.trim().length < 3}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-all ${
                        textAnswer.trim().length >= 3
                          ? 'bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white hover:opacity-90'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      } disabled:opacity-60`}
                    >
                      <Send className="w-4 h-4" />
                      Submit
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 flex items-center justify-center">
                <button
                  onClick={skipQuestion}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
