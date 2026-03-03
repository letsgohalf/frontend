'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Handshake,
  Loader2,
  Copy,
  Check,
  Share2,
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Banknote,
  Link as LinkIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import partnersApi, { EarningsSummary, Commission, PayoutRequest } from '@/lib/api/partners';

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.isPartner) {
      router.replace('/become-partner');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      const [earningsData, commissionsData, payoutsData] = await Promise.all([
        partnersApi.getEarnings(),
        partnersApi.getCommissions(1, 20),
        partnersApi.getPayoutHistory(),
      ]);
      setEarnings(earningsData);
      setCommissions(commissionsData.data);
      setPayouts(payoutsData);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://letsgohalf.com';
  const referralLink = earnings?.referralCode ? `${siteUrl}/?ref=${earnings.referralCode}` : '';

  const copyReferralCode = () => {
    if (earnings?.referralCode) {
      navigator.clipboard.writeText(earnings.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareReferralCode = () => {
    if (earnings?.referralCode && navigator.share) {
      navigator.share({
        title: 'LetsGoHalf Partner Referral',
        text: `Find your perfect roommate on LetsGoHalf! Use my link to get started: ${referralLink}`,
        url: referralLink,
      }).catch(() => {});
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || !bankName.trim() || !accountNumber.trim() || !accountName.trim()) return;

    setIsRequestingPayout(true);
    setPayoutError(null);
    try {
      await partnersApi.requestPayout({
        amount,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      setShowPayoutForm(false);
      setPayoutAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      loadData();
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to request payout');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
        </div>
      </AppLayout>
    );
  }

  const paidEarnings = (earnings?.totalEarnings || 0) - (earnings?.pendingEarnings || 0);

  return (
    <AppLayout activeTab="" onTabChange={() => {}} showBottomNav={false} showFab={false}>
      {/* Mobile Header */}
      <header className="header-mobile sticky top-0 z-40 px-5 py-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex-1 text-center">
            Partner Dashboard
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Partner Dashboard
            </h1>
            <p className="text-neutral-500 text-sm">Manage your referrals and earnings</p>
          </div>
        </div>
      </header>

      <div className="content-container py-6">
        <div className="create-form-container space-y-6">
          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass p-6 bg-gradient-to-br from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-900)]/20 dark:to-[var(--lime-900)]/20 border border-[var(--teal-100)] dark:border-[var(--teal-800)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--teal-200)] to-[var(--lime-200)] dark:from-[var(--teal-800)] dark:to-[var(--lime-800)] flex items-center justify-center">
                <Handshake className="w-5 h-5 text-[var(--teal-700)] dark:text-[var(--teal-300)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Your Referral Code</p>
                <p className="text-sm text-neutral-400">Share with house owners</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--teal-200)] dark:border-[var(--teal-700)]">
                <p className="text-xl font-mono font-bold text-[var(--teal-600)] dark:text-[var(--teal-400)] tracking-wider">
                  {earnings?.referralCode}
                </p>
              </div>
              <button
                onClick={copyReferralCode}
                className="w-12 h-12 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--teal-200)] dark:border-[var(--teal-700)] flex items-center justify-center transition-colors hover:bg-white dark:hover:bg-neutral-800"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-[var(--teal-600)]" />
                ) : (
                  <Copy className="w-5 h-5 text-[var(--teal-600)]" />
                )}
              </button>
              <button
                onClick={shareReferralCode}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Referral Link */}
            <div className="mt-4">
              <p className="text-xs font-medium text-neutral-500 mb-2 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Your Referral Link
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--teal-200)] dark:border-[var(--teal-700)] overflow-hidden">
                  <p className="text-sm text-[var(--teal-600)] dark:text-[var(--teal-400)] truncate">
                    {referralLink}
                  </p>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2.5 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--teal-200)] dark:border-[var(--teal-700)] flex items-center gap-1.5 transition-colors hover:bg-white dark:hover:bg-neutral-800 flex-shrink-0"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-[var(--teal-600)]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[var(--teal-600)]" />
                  )}
                  <span className="text-xs font-medium text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Earnings Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="card-glass p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-4 h-4 text-[var(--teal-600)]" />
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {(earnings?.totalEarnings || 0).toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500">Total Earned</p>
            </div>
            <div className="card-glass p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {(earnings?.pendingEarnings || 0).toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500">Pending</p>
            </div>
            <div className="card-glass p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--lime-600)]" />
              </div>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {paidEarnings.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500">Paid</p>
            </div>
          </motion.div>

          {/* Commission History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Commission History</h3>
              <p className="text-xs text-neutral-500">{earnings?.commissionCount || 0} total commissions</p>
            </div>
            {commissions.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No commissions yet. Share your referral code to start earning!</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                {commissions.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      c.type === 'post_creation'
                        ? "bg-blue-100 dark:bg-blue-500/10"
                        : "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10"
                    )}>
                      {c.type === 'post_creation' ? (
                        <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[var(--lime-600)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {c.type === 'post_creation' ? 'Post Creation' : 'Successful Match'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {c.post?.location || 'Unknown post'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                        +{c.amount.toLocaleString()}
                      </p>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        c.status === 'paid'
                          ? "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-700)] dark:text-[var(--lime-400)]"
                          : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      )}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Payout Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Payouts</h3>
                <p className="text-xs text-neutral-500">
                  Available: {(earnings?.pendingEarnings || 0).toLocaleString()}
                </p>
              </div>
              {(earnings?.pendingEarnings || 0) > 0 && !showPayoutForm && (
                <button
                  onClick={() => setShowPayoutForm(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white text-sm font-medium flex items-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" />
                  Request Payout
                </button>
              )}
            </div>

            {showPayoutForm && (
              <div className="p-4 space-y-3 bg-[var(--peach-50)] dark:bg-neutral-800/50">
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Amount"
                  max={earnings?.pendingEarnings}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank Name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 text-sm"
                />
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account Name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 outline-none text-neutral-900 dark:text-neutral-100 text-sm"
                />
                {payoutError && (
                  <p className="text-xs text-red-500">{payoutError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPayoutForm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestPayout}
                    disabled={isRequestingPayout}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    {isRequestingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                  </button>
                </div>
              </div>
            )}

            {payouts.length > 0 ? (
              <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                {payouts.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      p.status === 'completed' ? "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10" :
                      p.status === 'rejected' ? "bg-red-100 dark:bg-red-500/10" :
                      "bg-amber-100 dark:bg-amber-500/10"
                    )}>
                      <Banknote className={cn(
                        "w-4 h-4",
                        p.status === 'completed' ? "text-[var(--lime-600)]" :
                        p.status === 'rejected' ? "text-red-600" :
                        "text-amber-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {Number(p.amount).toLocaleString()} payout
                      </p>
                      <p className="text-xs text-neutral-500">
                        {p.bankName} - {p.accountNumber}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      p.status === 'completed' ? "bg-[var(--lime-100)] text-[var(--lime-700)]" :
                      p.status === 'rejected' ? "bg-red-100 text-red-700" :
                      p.status === 'processing' ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : !showPayoutForm ? (
              <div className="p-8 text-center">
                <Banknote className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No payout requests yet.</p>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
