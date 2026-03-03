'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Quote,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  Loader2,
  User,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import testimonialsApi, { Testimonial, UserTestimonial } from '@/lib/api/testimonials';

export default function TestimonialsPage() {
  const { user, isAuthenticated } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [myTestimonials, setMyTestimonials] = useState<UserTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [headline, setHeadline] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadTestimonials();
    if (isAuthenticated) {
      loadMyTestimonials();
    }
  }, [isAuthenticated]);

  const loadTestimonials = async () => {
    try {
      const res = await testimonialsApi.getApproved(20, 0);
      setTestimonials(res.testimonials);
      setHasMore(res.hasMore);
      setOffset(res.testimonials.length);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await testimonialsApi.getApproved(20, offset);
      setTestimonials(prev => [...prev, ...res.testimonials]);
      setHasMore(res.hasMore);
      setOffset(prev => prev + res.testimonials.length);
    } catch (err) {
      console.error('Failed to load more testimonials:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMyTestimonials = async () => {
    try {
      const res = await testimonialsApi.getMine();
      setMyTestimonials(res);
    } catch (err) {
      console.error('Failed to load my testimonials:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 20) {
      setSubmitError('Please share a bit more (at least 20 characters)');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await testimonialsApi.create({
        content: content.trim(),
        headline: headline.trim() || undefined,
        rating,
      });
      setSubmitSuccess(true);
      setContent('');
      setHeadline('');
      setRating(5);
      loadMyTestimonials();
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPendingTestimonial = myTestimonials.some(t => t.status === 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Published
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Not Published
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Testimonials
              </h1>
              <p className="text-xs text-neutral-500">
                What our community says
              </p>
            </div>
          </div>

          {isAuthenticated && !hasPendingTestimonial && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Share Yours
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* My Testimonials */}
        {isAuthenticated && myTestimonials.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
              Your Testimonials
            </h2>
            <div className="space-y-3">
              {myTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    {t.headline && (
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {t.headline}
                      </h3>
                    )}
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t.content}
                  </p>
                  {t.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= t.rating!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[var(--teal-400)] animate-spin" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-20">
            <Quote className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              No testimonials yet
            </h2>
            <p className="text-neutral-500 mb-6">
              Be the first to share your experience!
            </p>
            {isAuthenticated ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Share Your Story
              </button>
            ) : (
              <Link
                href="/login"
                className="px-6 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:opacity-90 transition-opacity inline-block"
              >
                Sign in to Share
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 border ${
                    t.isFeatured
                      ? 'border-[var(--teal-300)] dark:border-[var(--teal-500)]/50 ring-1 ring-[var(--teal-200)] dark:ring-[var(--teal-500)]/20'
                      : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {t.isFeatured && (
                    <div className="flex items-center gap-1 text-[var(--teal-500)] text-xs font-semibold mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      Featured
                    </div>
                  )}

                  <Quote className="w-8 h-8 text-[var(--teal-200)] dark:text-[var(--teal-500)]/30 mb-3" />

                  {t.headline && (
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                      "{t.headline}"
                    </h3>
                  )}

                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4">
                    {t.content}
                  </p>

                  {t.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= t.rating!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {t.user.avatar ? (
                      <img
                        src={t.user.avatar}
                        alt={t.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {t.user.name}
                        {t.user.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-[var(--teal-400)] inline ml-1" />
                        )}
                      </p>
                      {t.user.occupation && (
                        <p className="text-xs text-neutral-500">
                          {t.user.occupation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Submit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowForm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                {submitSuccess ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                      Thank you!
                    </h3>
                    <p className="text-neutral-500">
                      Your testimonial has been submitted for review.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                          Share Your Experience
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          disabled={isSubmitting}
                          className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-neutral-500" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          How would you rate LetsGoHalf?
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setRating(i)}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  i <= rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-neutral-300 dark:text-neutral-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Headline */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Headline (optional)
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="Sum it up in a few words..."
                          maxLength={100}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20 outline-none transition-all"
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Your Story
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="How has LetsGoHalf helped you? What do you like about it?"
                          rows={4}
                          maxLength={1000}
                          className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:border-[var(--teal-400)] focus:ring-2 focus:ring-[var(--teal-400)]/20 outline-none transition-all resize-none"
                        />
                        <p className="text-xs text-neutral-400 mt-1 text-right">
                          {content.length}/1000
                        </p>
                      </div>

                      {submitError && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
                          {submitError}
                        </p>
                      )}
                    </div>

                    <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="submit"
                        disabled={isSubmitting || content.trim().length < 20}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit Testimonial
                          </>
                        )}
                      </button>
                      <p className="text-xs text-neutral-400 text-center mt-3">
                        Your testimonial will be reviewed before publishing
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
