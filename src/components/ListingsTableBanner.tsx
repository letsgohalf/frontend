'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronDown, ChevronUp, X, MapPin, Heart, Loader2, Shield, AlertCircle } from 'lucide-react';
import { ListingsTableRow } from '@/lib/api/settings';
import interestThreadsApi from '@/lib/api/interest-threads';
import { useAuth } from '@/contexts/AuthContext';

interface ListingsTableBannerProps {
  rows: ListingsTableRow[];
  dismissible?: boolean;
}

export default function ListingsTableBanner({
  rows,
  dismissible = false,
}: ListingsTableBannerProps) {
  const router = useRouter();
  const { isAuthenticated, promptAuth } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [interestLoading, setInterestLoading] = useState<string | null>(null);
  const [verificationNeeded, setVerificationNeeded] = useState(false);

  if (dismissed || !rows.length) return null;

  const visibleRows = expanded ? rows : rows.slice(0, 5);
  const hasMore = rows.length > 5;

  const handleInterestClick = async (postId: string) => {
    if (!isAuthenticated) {
      promptAuth('Sign in to express interest');
      return;
    }

    if (interestLoading) return;
    setInterestLoading(postId);

    try {
      const { thread } = await interestThreadsApi.expressInterest(postId);
      setDismissed(true);
      router.push(`/interest/${thread.id}`);
    } catch (err: any) {
      if (err?.code === 'VERIFICATION_REQUIRED' || err?.message?.includes('verify')) {
        setVerificationNeeded(true);
      } else if (err?.message?.includes('already') || err?.statusCode === 409) {
        try {
          const { data } = await interestThreadsApi.getMyThreads(1, 50);
          const existing = data.find(t => t.postId === postId);
          if (existing) {
            setDismissed(true);
            router.push(`/interest/${existing.id}`);
            return;
          }
        } catch {}
        setDismissed(true);
        router.push(`/post/${postId}`);
      } else {
        setDismissed(true);
        router.push(`/post/${postId}`);
      }
    } finally {
      setInterestLoading(null);
    }
  };

  return (
    <div
      className="marquee-container bg-gradient-to-r from-[var(--lime-100)] via-[var(--peach-100)] to-[var(--lavender-100)] dark:from-[var(--lime-600)]/20 dark:via-[var(--peach-200)]/10 dark:to-[var(--lavender-400)]/15 border-b border-neutral-200/50 dark:border-neutral-700/50"
      aria-label="Quick Listings"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-200/30 dark:border-neutral-700/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[var(--lime-500)]" />
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            Quick Listings
          </span>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            aria-label="Dismiss listings"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table — horizontally scrollable */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="text-xs" style={{ minWidth: '480px', width: '100%' }}>
          <thead>
            <tr className="text-left text-neutral-500 dark:text-neutral-400">
              <th className="px-3 py-1.5 font-medium whitespace-nowrap">Name</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap">Location</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap">Needs/Has</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap text-right">Price</th>
              <th className="px-3 py-1.5 font-medium whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={row.postId + '-' + i}
                onClick={() => handleInterestClick(row.postId)}
                className="cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-colors border-t border-neutral-200/20 dark:border-neutral-700/20"
              >
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {row.name}
                  </span>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-[var(--teal-500)]" />
                    <span>{row.location}</span>
                  </div>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <span className="text-neutral-600 dark:text-neutral-300">{row.description}</span>
                </td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {row.price}
                  </span>
                </td>
                <td className="px-3 py-1.5 whitespace-nowrap">
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

      {/* Expand/collapse button */}
      {hasMore && !verificationNeeded && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:bg-white/30 dark:hover:bg-white/5 transition-colors border-t border-neutral-200/20 dark:border-neutral-700/20"
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
        <div className="px-3 py-2.5 border-t border-neutral-200/30 dark:border-neutral-700/30 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              You need to verify your identity before you can show interest.
            </p>
          </div>
          <button
            onClick={() => router.push('/verification')}
            className="w-full py-1.5 px-3 bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:from-[var(--lime-500)] hover:to-[var(--yellow-500)] transition-all shadow-sm"
          >
            <Shield className="w-3 h-3" />
            Verify Your Identity
          </button>
        </div>
      )}
    </div>
  );
}
