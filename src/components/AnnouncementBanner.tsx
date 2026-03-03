'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Sparkles, MapPin, Tag, ChevronDown, ChevronUp, Table2, Heart, Loader2, Shield, AlertCircle } from 'lucide-react';
import postsApi, { Post } from '@/lib/api/posts';
import settingsApi, { BannerConfig, ListingsTableRow } from '@/lib/api/settings';
import interestThreadsApi from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';
import { playSound } from '@/lib/sounds';

const DISMISS_KEY = 'announcement-banner-dismissed';
const LISTINGS_DISMISS_KEY = 'listings-table-dismissed';

export default function AnnouncementBanner() {
  const router = useRouter();
  const { user, isAuthenticated, promptAuth } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [visible, setVisible] = useState(false);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [interestLoading, setInterestLoading] = useState<string | null>(null);
  const [verificationNeeded, setVerificationNeeded] = useState(false);

  useEffect(() => {
    // Fetch banner config first to determine mode
    settingsApi.getBannerConfig()
      .then((config) => {
        setBannerConfig(config);

        // If banner is disabled by admin, don't show anything
        if (config.bannerEnabled === false) return;

        if (config.bannerMode === 'listings-table' && config.listingsTableData?.rows?.length) {
          // Listings table mode — check dismissal
          try {
            const raw = localStorage.getItem(LISTINGS_DISMISS_KEY);
            if (raw) {
              const data = JSON.parse(raw);
              if (Date.now() - data.timestamp < 3600000 && data.generatedAt === config.listingsTableData!.generatedAt) {
                return; // dismissed within last hour for this generation
              }
            }
          } catch {}
          setTimeout(() => setVisible(true), 1500);
          return;
        }

        // Marquee/announcement mode — fetch latest announcement
        fetchAnnouncement();
      })
      .catch(() => {
        // Fallback: fetch announcement as before
        fetchAnnouncement();
      });
  }, []);

  const fetchAnnouncement = () => {
    let dismissedPostId: string | undefined;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Date.now() - data.timestamp < 3600000) {
          dismissedPostId = data.postId;
        }
      }
    } catch {}

    postsApi.getPosts({
      postType: 'announcement',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      limit: 1,
    })
      .then((response) => {
        if (response.data && response.data.length > 0) {
          const latest = response.data[0];
          if (dismissedPostId === latest.id) return;
          setPost(latest);
          setTimeout(() => setVisible(true), 1500);
        }
      })
      .catch(() => {});
  };

  const handleDismiss = () => {
    playSound('swooshDown');
    setVisible(false);
    try {
      if (bannerConfig?.bannerMode === 'listings-table') {
        localStorage.setItem(LISTINGS_DISMISS_KEY, JSON.stringify({
          generatedAt: bannerConfig.listingsTableData?.generatedAt,
          timestamp: Date.now(),
        }));
      } else {
        localStorage.setItem(DISMISS_KEY, JSON.stringify({
          postId: post?.id,
          timestamp: Date.now(),
        }));
      }
    } catch {}
  };

  const handleInterestClick = async (postId: string) => {
    if (!isAuthenticated) {
      promptAuth('Sign in to express interest');
      return;
    }

    if (interestLoading) return;
    setInterestLoading(postId);

    try {
      const { thread } = await interestThreadsApi.expressInterest(postId);
      handleDismiss();
      router.push(`/interest/${thread.id}`);
    } catch (err: any) {
      if (err?.code === 'VERIFICATION_REQUIRED' || err?.message?.includes('verify')) {
        setVerificationNeeded(true);
      } else if (err?.message?.includes('already') || err?.statusCode === 409) {
        // Already has a thread — find it and navigate
        try {
          const { data } = await interestThreadsApi.getMyThreads(1, 50);
          const existing = data.find(t => t.postId === postId);
          if (existing) {
            handleDismiss();
            router.push(`/interest/${existing.id}`);
            return;
          }
        } catch {}
        // Fallback: go to the post page
        handleDismiss();
        router.push(`/post/${postId}`);
      } else {
        // Fallback for other errors — just open the post
        handleDismiss();
        router.push(`/post/${postId}`);
      }
    } finally {
      setInterestLoading(null);
    }
  };

  if (typeof window === 'undefined') return null;

  const isListingsMode =
    bannerConfig?.bannerMode === 'listings-table' &&
    bannerConfig.listingsTableData?.rows?.length;

  // Nothing to show
  if (!isListingsMode && !post) return null;

  const rows = bannerConfig?.listingsTableData?.rows || [];
  const visibleRows = expanded ? rows : rows.slice(0, 5);
  const hasMore = rows.length > 5;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140]"
          />

          {/* Banner container — top center */}
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="fixed top-0 left-0 right-0 z-[141] flex justify-center pointer-events-none"
          >
            <div className={`w-full ${isListingsMode ? 'max-w-lg' : 'max-w-md'} mx-4 pointer-events-auto`}>
              {/* Ropes — SVG with braided twist + slight catenary sag */}
              <div className="flex justify-center gap-[55%]">
                {[false, true].map((mirrored) => (
                  <svg
                    key={mirrored ? 'r' : 'l'}
                    width="10"
                    height="44"
                    viewBox="0 0 10 44"
                    fill="none"
                    className="flex-shrink-0"
                    style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
                  >
                    {/* Shadow/depth strand */}
                    <path
                      d="M6 0 C6 8, 3 12, 5 20 C7 28, 3 32, 5 44"
                      stroke="rgba(0,0,0,0.08)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Main rope body */}
                    <path
                      d="M5 0 C5 8, 2 12, 4 20 C6 28, 2 32, 4 44"
                      stroke="#c2a882"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Highlight strand — lighter twist */}
                    <path
                      d="M4 0 C4 6, 6 10, 4 16 C2 22, 6 26, 4 32 C2 38, 5 40, 4 44"
                      stroke="#dbc9a0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    {/* Dark twist line for braided look */}
                    <path
                      d="M6 2 C6 8, 3 12, 5 18 C7 24, 3 28, 5 34 C7 40, 4 42, 5 44"
                      stroke="#a08860"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeDasharray="3 4"
                    />
                    {/* Knot at the bottom where rope meets banner */}
                    <circle cx="4" cy="42" r="2.5" fill="#c2a882" />
                    <circle cx="4" cy="42" r="1.5" fill="#dbc9a0" />
                  </svg>
                ))}
              </div>

              {/* Banner card */}
              <motion.div
                animate={{ rotate: [0, 0.4, -0.4, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                className="relative overflow-hidden rounded-2xl border border-[var(--peach-200)] dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl"
              >
                {/* Gradient top edge */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--lime-400)] via-[var(--yellow-400)] to-[var(--peach-400)]" />

                {isListingsMode ? (
                  /* ---- Listings Table Mode ---- */
                  <div>
                    {/* Header */}
                    <div className="px-5 py-3 flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--teal-100)] to-[var(--lime-100)] dark:from-[var(--teal-500)]/15 dark:to-[var(--lime-500)]/15 flex items-center justify-center flex-shrink-0">
                        <Table2 className="w-4.5 h-4.5 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Quick Listings</span>
                         
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Tap any listing to show interest</p>
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                        aria-label="Dismiss"
                      >
                        <X className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>

                    {/* Table — horizontally scrollable on mobile */}
                    <div className="overflow-x-auto max-h-[50vh] overflow-y-auto -webkit-overflow-scrolling-touch">
                      <table className="text-xs" style={{ minWidth: '480px', width: '100%' }}>
                        <thead>
                          <tr className="text-left text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
                            <th className="px-3 py-2 font-medium whitespace-nowrap">Name</th>
                            <th className="px-3 py-2 font-medium whitespace-nowrap">Location</th>
                            <th className="px-3 py-2 font-medium whitespace-nowrap">Needs/Has</th>
                            <th className="px-3 py-2 font-medium whitespace-nowrap text-right">Price</th>
                            <th className="px-3 py-2 font-medium whitespace-nowrap"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRows.map((row, i) => (
                            <tr
                              key={row.postId + '-' + i}
                              onClick={() => handleInterestClick(row.postId)}
                              className="cursor-pointer hover:bg-[var(--lime-50)] dark:hover:bg-[var(--lime-500)]/5 transition-colors border-t border-neutral-100 dark:border-neutral-800"
                            >
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span className="font-medium text-neutral-800 dark:text-neutral-100">
                                  {row.name}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                                  <MapPin className="w-3 h-3 flex-shrink-0 text-[var(--teal-500)]" />
                                  <span>{row.location}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span className="text-neutral-600 dark:text-neutral-300">{row.description}</span>
                              </td>
                              <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                                  {row.price}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleInterestClick(row.postId); }}
                                  disabled={interestLoading === row.postId}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-white text-[10px] font-semibold hover:shadow-md transition-all disabled:opacity-60"
                                >
                                  {interestLoading === row.postId ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Heart className="w-2.5 h-2.5" />
                                  )}
                                  Interested
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Expand/collapse */}
                    {hasMore && !verificationNeeded && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-t border-neutral-100 dark:border-neutral-800"
                      >
                        {expanded ? (
                          <>Show less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <>Show {rows.length - 5} more <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    )}

                    {/* Verification required message */}
                    {verificationNeeded && (
                      <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-amber-50 dark:bg-amber-900/20">
                        <div className="flex items-start gap-2.5 mb-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            You need to verify your identity before you can show interest in listings.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            handleDismiss();
                            router.push('/verification');
                          }}
                          className="w-full py-2 px-3 bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Verify Your Identity
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ---- Announcement Mode (original) ---- */
                  <div className="px-5 py-4 flex items-start gap-3.5">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--lime-100)] to-[var(--yellow-100)] dark:from-[var(--lime-500)]/15 dark:to-[var(--yellow-500)]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone className="w-5 h-5 text-[var(--lime-600)] dark:text-[var(--lime-400)]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/15 text-[var(--lime-700)] dark:text-[var(--lime-300)] mb-1.5">
                        Announcement
                      </span>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed whitespace-pre-line">
                        {post?.content}
                      </p>
                    </div>

                    {/* Close */}
                    <button
                      onClick={handleDismiss}
                      className="p-1.5 rounded-full hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
