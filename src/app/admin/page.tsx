'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  FileText,
  BadgeCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Shield,
  ShieldOff,
  Eye,
  UserCog,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  FileImage,
  Camera,
  CreditCard,
  ZoomIn,
  ChevronDown,
  AlertTriangle,
  LayoutDashboard,
  Settings,
  Bell,
  BellOff,
  PenSquare,
  Bed,
  Building2,
  DollarSign,
  Image,
  Check,
  Send,
  Home,
  Megaphone,
  Plus,
  Trash2,
  ChevronUp,
  Link,
  Sparkles,
  MessageSquare,
  UserCheck,
  UsersRound,
  Star,
  Quote,
  Handshake,
  Banknote,
  Table2,
  RefreshCw,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import usersApi, { AdminUser, AdminUserDetail, AdminStats } from '@/lib/api/users';
import verificationApi, {
  AdminVerificationRequest,
  VerificationStatus,
  VerificationDocumentType,
} from '@/lib/api/verification';
import agentVerificationApi, {
  AdminAgentVerificationRequest,
  AgentVerificationStatus,
} from '@/lib/api/agent-verification';
import AgentBadge from '@/components/AgentBadge';
import settingsApi, { AdminSettings, BannerConfig, ListingsTableRow } from '@/lib/api/settings';
import postsApi, { CreatePostData } from '@/lib/api/posts';
import apiClient from '@/lib/api/client';
import advertsApi, { Advert, CreateAdvertData, UpdateAdvertData } from '@/lib/api/adverts';
import { chatApi } from '@/lib/api/chat';
import testimonialsApi from '@/lib/api/testimonials';
import partnersApi, {
  AdminPartnerApplication,
  PartnerApplicationStatus,
  Commission as PartnerCommission,
  PayoutRequest as PartnerPayoutRequest,
  CommissionSettings,
} from '@/lib/api/partners';
import { PLATFORM_NAME, PLATFORM_LOGO } from '@/lib/constants/platform';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/utils/image';

// ============================================
// Types
// ============================================

type AdminTab = 'overview' | 'users' | 'verifications' | 'agent-verifications' | 'partners' | 'posts' | 'adverts' | 'testimonials' | 'support' | 'settings';
type AgentVerificationFilter = 'all' | AgentVerificationStatus;
type VerificationFilter = 'all' | VerificationStatus;

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'teal' | 'lime' | 'pink' | 'lavender';
  trend?: number;
}

function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
  const colorClasses = {
    teal: 'bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 text-[var(--teal-600)]',
    lime: 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)]',
    pink: 'bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-500)]',
    lavender: 'bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-[var(--lavender-500)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass p-5"
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend >= 0 ? "bg-[var(--lime-100)] text-[var(--lime-600)]" : "bg-[var(--pink-100)] text-[var(--pink-500)]"
          )}>
            <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-4">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </motion.div>
  );
}

// ============================================
// User Detail Modal
// ============================================

interface UserDetailModalProps {
  user: AdminUserDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (userId: string, verify: boolean) => void;
  onDelete: (userId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function UserDetailModal({ user, isOpen, onClose, onVerify, onDelete, isUpdating, isDeleting }: UserDetailModalProps) {
  const router = useRouter();

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            User Details
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20 ring-4 ring-white dark:ring-neutral-800 shadow-lg">
              <AvatarImage src={resolveImageUrl(user.avatar)} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-2xl font-semibold text-neutral-800">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {user.name}
                </h4>
                {user.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-[var(--teal-500)]" />
                )}
              </div>
              <p className="text-sm text-neutral-500">
                {user.role === 'admin' ? 'Administrator' : 'User'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={cn(
              "p-3 rounded-xl text-center",
              user.isPhoneVerified
                ? "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10"
                : "bg-neutral-100 dark:bg-neutral-800"
            )}>
              <Phone className={cn(
                "w-5 h-5 mx-auto mb-1",
                user.isPhoneVerified ? "text-[var(--lime-600)]" : "text-neutral-400"
              )} />
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Phone</p>
              <p className={cn(
                "text-xs",
                user.isPhoneVerified ? "text-[var(--lime-600)]" : "text-neutral-400"
              )}>
                {user.isPhoneVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl text-center",
              user.isEmailVerified
                ? "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10"
                : "bg-neutral-100 dark:bg-neutral-800"
            )}>
              <Mail className={cn(
                "w-5 h-5 mx-auto mb-1",
                user.isEmailVerified ? "text-[var(--lime-600)]" : "text-neutral-400"
              )} />
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Email</p>
              <p className={cn(
                "text-xs",
                user.isEmailVerified ? "text-[var(--lime-600)]" : "text-neutral-400"
              )}>
                {user.isEmailVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl text-center",
              user.isIdVerified
                ? "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10"
                : "bg-neutral-100 dark:bg-neutral-800"
            )}>
              <Shield className={cn(
                "w-5 h-5 mx-auto mb-1",
                user.isIdVerified ? "text-[var(--lime-600)]" : "text-neutral-400"
              )} />
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">ID</p>
              <p className={cn(
                "text-xs",
                user.isIdVerified ? "text-[var(--lime-600)]" : "text-neutral-400"
              )}>
                {user.isIdVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4 mb-6">
            {user.email && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.email}</p>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Phone</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.phone}</p>
                </div>
              </div>
            )}
            {user.occupation && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Occupation</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.occupation}</p>
                </div>
              </div>
            )}
            {user.preferredLocations && user.preferredLocations.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Preferred Locations</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {user.preferredLocations.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {user.stats.totalPosts}
              </p>
              <p className="text-xs text-neutral-500">Total Posts</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {user.stats.totalInterests}
              </p>
              <p className="text-xs text-neutral-500">Interests Expressed</p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-6">
              <p className="text-xs text-neutral-500 mb-2">Bio</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-[var(--peach-50)] dark:bg-neutral-800 p-4 rounded-xl">
                {user.bio}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  router.push(`/profile/${user.id}`);
                }}
                className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Profile
              </button>
              <button
                onClick={() => onVerify(user.id, !user.isVerified)}
                disabled={isUpdating || isDeleting}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50",
                  user.isVerified
                    ? "bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-600)]"
                    : "bg-[var(--lime-400)] text-[#212121]"
                )}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.isVerified ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Remove Verification
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    Verify User
                  </>
                )}
              </button>
            </div>
            
            {/* Delete User Button */}
            {user.role !== 'admin' && (
              <button
                onClick={() => onDelete(user.id)}
                disabled={isDeleting || isUpdating}
                className="w-full py-3 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Delete User Permanently
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// User Row Component
// ============================================

interface UserRowProps {
  user: AdminUser;
  onView: (user: AdminUser) => void;
  onQuickVerify: (userId: string, verify: boolean) => void;
  isUpdating: boolean;
}

function UserRow({ user, onView, onQuickVerify, isUpdating }: UserRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors border-b border-[var(--peach-100)] dark:border-neutral-800 last:border-0"
    >
      {/* Avatar & Name */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-white dark:ring-neutral-800 shadow-sm flex-shrink-0">
          <AvatarImage src={resolveImageUrl(user.avatar)} alt={user.name} />
          <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-xs sm:text-sm font-semibold text-neutral-800">
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <span className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate max-w-[120px] sm:max-w-none">
              {user.name}
            </span>
            {user.isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--teal-500)] flex-shrink-0" />
            )}
            {user.role === 'admin' && (
              <span className="px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-[var(--lavender-200)] text-[var(--lavender-600)]">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
            {user.email || user.phone || 'No contact'}
          </p>
        </div>
      </div>

      {/* Verification Status - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          user.isPhoneVerified ? "bg-[var(--lime-400)]" : "bg-neutral-300"
        )} title={user.isPhoneVerified ? 'Phone verified' : 'Phone not verified'} />
        <div className={cn(
          "w-2 h-2 rounded-full",
          user.isEmailVerified ? "bg-[var(--lime-400)]" : "bg-neutral-300"
        )} title={user.isEmailVerified ? 'Email verified' : 'Email not verified'} />
        <div className={cn(
          "w-2 h-2 rounded-full",
          user.isIdVerified ? "bg-[var(--lime-400)]" : "bg-neutral-300"
        )} title={user.isIdVerified ? 'ID verified' : 'ID not verified'} />
      </div>

      {/* Join Date - Hidden on mobile */}
      <div className="hidden md:block text-xs text-neutral-500 w-24">
        {new Date(user.createdAt).toLocaleDateString()}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={() => onView(user)}
          className="p-1.5 sm:p-2 rounded-lg bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors"
          title="View details"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => onQuickVerify(user.id, !user.isVerified)}
          disabled={isUpdating}
          className={cn(
            "p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-50",
            user.isVerified
              ? "bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-500)] hover:bg-[var(--pink-200)]"
              : "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)] hover:bg-[var(--lime-200)]"
          )}
          title={user.isVerified ? 'Remove verification' : 'Verify user'}
        >
          {isUpdating ? (
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : user.isVerified ? (
            <ShieldOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// Image Lightbox Component
// ============================================

interface LightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

function Lightbox({ src, alt, isOpen, onClose }: LightboxProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded-2xl"
        />
      </motion.div>
    </div>
  );
}

// ============================================
// Document Image Thumbnail
// ============================================

interface DocImageProps {
  src: string | undefined | null;
  label: string;
  onZoom: (src: string, label: string) => void;
}

function DocImage({ src, label, onZoom }: DocImageProps) {
  const resolvedSrc = resolveImageUrl(src);
  if (!resolvedSrc) return null;

  return (
    <div className="group relative">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">{label}</p>
      <div
        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer border border-[var(--peach-200)] dark:border-neutral-700"
        onClick={() => onZoom(resolvedSrc, label)}
      >
        <img
          src={resolvedSrc}
          alt={label}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Verification Status Badge
// ============================================

function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const config = {
    pending: {
      label: 'Pending',
      className: 'badge badge-peach',
      icon: Clock,
    },
    approved: {
      label: 'Approved',
      className: 'badge badge-lime',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      className: 'badge badge-pink',
      icon: XCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <span className={className}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ============================================
// Document Type Label
// ============================================

function getDocTypeLabel(type: VerificationDocumentType): string {
  const labels: Record<VerificationDocumentType, string> = {
    nin: 'NIN',
    drivers_license: "Driver's License",
    passport: 'Passport',
    voters_card: "Voter's Card",
  };
  return labels[type] || type;
}

function getDocTypeIcon(type: VerificationDocumentType) {
  switch (type) {
    case 'passport':
      return FileImage;
    case 'drivers_license':
      return CreditCard;
    default:
      return CreditCard;
  }
}

// ============================================
// Verification Detail Panel
// ============================================

interface VerificationDetailProps {
  verification: AdminVerificationRequest;
  onClose: () => void;
  onReview: (id: string, status: 'approved' | 'rejected', rejectionReason?: string, adminNotes?: string) => void;
  isReviewing: boolean;
}

function VerificationDetail({ verification, onClose, onReview, isReviewing }: VerificationDetailProps) {
  const [adminNotes, setAdminNotes] = useState(verification.adminNotes || '');
  const [rejectionReason, setRejectionReason] = useState(verification.rejectionReason || '');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  const handleApprove = () => {
    onReview(verification.id, 'approved', undefined, adminNotes || undefined);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onReview(verification.id, 'rejected', rejectionReason, adminNotes || undefined);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl sm:mx-4 max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
            {/* Drag indicator on mobile */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 sm:hidden" />
            <div className="pt-2 sm:pt-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Verification Review
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500">
                Submitted {new Date(verification.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
            {/* User Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-white dark:ring-neutral-800 shadow-md flex-shrink-0">
                <AvatarImage src={resolveImageUrl(verification.user.avatar)} alt={verification.user.name} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-base sm:text-lg font-semibold text-neutral-800">
                  {verification.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {verification.user.name}
                </h4>
                {verification.user.email && (
                  <p className="text-xs sm:text-sm text-neutral-500 truncate">{verification.user.email}</p>
                )}
              </div>
              <VerificationStatusBadge status={verification.status} />
            </div>

            {/* Document Info */}
            <div className="p-3 sm:p-4 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--lavender-500)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {getDocTypeLabel(verification.documentType)}
                  </p>
                  {verification.documentNumber && (
                    <p className="text-xs text-neutral-500 font-mono truncate">
                      {verification.documentNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Images */}
            <div>
              <h5 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2 sm:mb-3">
                Document Images
              </h5>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <DocImage
                  src={verification.documentFrontImage}
                  label="Front"
                  onZoom={(src, alt) => setLightboxImage({ src, alt })}
                />
                <DocImage
                  src={verification.documentBackImage}
                  label="Back"
                  onZoom={(src, alt) => setLightboxImage({ src, alt })}
                />
                <DocImage
                  src={verification.selfieImage}
                  label="Selfie"
                  onZoom={(src, alt) => setLightboxImage({ src, alt })}
                />
              </div>
            </div>

            {/* Existing rejection reason (if already rejected) */}
            {verification.status === 'rejected' && verification.rejectionReason && (
              <div className="p-4 rounded-xl bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 border border-[var(--pink-200)] dark:border-[var(--pink-400)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-[var(--pink-500)]" />
                  <p className="text-sm font-semibold text-[var(--pink-600)] dark:text-[var(--pink-400)]">
                    Rejection Reason
                  </p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {verification.rejectionReason}
                </p>
              </div>
            )}

            {/* Review details (if already reviewed) */}
            {verification.reviewedAt && (
              <div className="text-xs text-neutral-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Reviewed on {new Date(verification.reviewedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            )}

            {/* Admin Actions (only for pending) */}
            {verification.status === 'pending' && (
              <div className="space-y-4 pt-2">
                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this verification..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm resize-none placeholder:text-neutral-400"
                  />
                </div>

                {/* Reject Form */}
                <AnimatePresence>
                  {showRejectForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-[var(--pink-50)] dark:bg-[var(--pink-400)]/5 border border-[var(--pink-200)] dark:border-[var(--pink-400)]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-[var(--pink-500)]" />
                          <label className="text-sm font-medium text-[var(--pink-600)] dark:text-[var(--pink-400)]">
                            Rejection Reason (required)
                          </label>
                        </div>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this verification is being rejected..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--pink-200)] dark:border-neutral-700 focus:ring-2 focus:ring-[var(--pink-400)] text-neutral-900 dark:text-neutral-100 text-sm resize-none placeholder:text-neutral-400"
                          autoFocus
                        />
                        <div className="flex gap-3 mt-3">
                          <button
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectionReason('');
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || isReviewing}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isReviewing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Confirm Rejection
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                {!showRejectForm && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isReviewing}
                      className="flex-1 py-3 rounded-xl bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-600)] dark:text-[var(--pink-400)] font-medium flex items-center justify-center gap-2 hover:bg-[var(--pink-200)] dark:hover:bg-[var(--pink-400)]/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isReviewing}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {isReviewing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <Lightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            isOpen={!!lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// Verification Row Component
// ============================================

interface VerificationRowProps {
  verification: AdminVerificationRequest;
  onView: (v: AdminVerificationRequest) => void;
}

function VerificationRow({ verification, onView }: VerificationRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors border-b border-[var(--peach-100)] dark:border-neutral-800 last:border-0 cursor-pointer"
      onClick={() => onView(verification)}
    >
      {/* User Avatar & Name */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-white dark:ring-neutral-800 shadow-sm flex-shrink-0">
          <AvatarImage src={resolveImageUrl(verification.user.avatar)} alt={verification.user.name} />
          <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-xs sm:text-sm font-semibold text-neutral-800">
            {verification.user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <span className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate block max-w-[140px] sm:max-w-none">
            {verification.user.name}
          </span>
          <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
            {getDocTypeLabel(verification.documentType)}
          </p>
        </div>
      </div>

      {/* Date - hidden on mobile */}
      <div className="hidden sm:block text-xs text-neutral-500 w-24">
        {new Date(verification.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short',
        })}
      </div>

      {/* Status badge */}
      <VerificationStatusBadge status={verification.status} />

      {/* View button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(verification);
        }}
        className="p-1.5 sm:p-2 rounded-lg bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
        title="Review"
      >
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </motion.div>
  );
}

// ============================================
// Overview Tab Content
// ============================================

interface OverviewTabProps {
  stats: AdminStats | null;
  pendingVerificationsCount: number;
}

function OverviewTab({ stats, pendingVerificationsCount }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers || 0}
          color="teal"
        />
        <StatCard
          icon={BadgeCheck}
          label="Verified Users"
          value={stats?.verifiedUsers || 0}
          color="lime"
        />
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={stats?.totalPosts || 0}
          color="lavender"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Posts"
          value={stats?.activePosts || 0}
          color="pink"
        />
      </div>

      {/* Pending Verifications Alert */}
      {pendingVerificationsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--yellow-100)] dark:bg-[var(--yellow-400)]/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-[var(--yellow-500)]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Pending Verifications
              </h3>
              <p className="text-sm text-neutral-500">
                {pendingVerificationsCount} verification request{pendingVerificationsCount !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
            <span className="badge badge-peach font-semibold">
              {pendingVerificationsCount}
            </span>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass p-6"
      >
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Platform Summary
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Verification Rate</span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {stats && stats.totalUsers > 0
                ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--teal-400)] transition-all duration-500"
              style={{
                width: stats && stats.totalUsers > 0
                  ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%`
                  : '0%',
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Active Posts Rate</span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {stats && stats.totalPosts > 0
                ? `${Math.round((stats.activePosts / stats.totalPosts) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--lavender-300)] to-[var(--pink-300)] transition-all duration-500"
              style={{
                width: stats && stats.totalPosts > 0
                  ? `${Math.round((stats.activePosts / stats.totalPosts) * 100)}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// Users Tab Content
// ============================================

interface UsersTabProps {
  users: AdminUser[];
  isLoading: boolean;
  search: string;
  setSearch: (v: string) => void;
  totalUsers: number;
  page: number;
  totalPages: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  onViewUser: (user: AdminUser) => void;
  onVerifyUser: (userId: string, verify: boolean) => void;
  updatingUserId: string | null;
}

function UsersTab({
  users,
  isLoading,
  search,
  setSearch,
  totalUsers,
  page,
  totalPages,
  setPage,
  onViewUser,
  onVerifyUser,
  updatingUserId,
}: UsersTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass overflow-hidden"
    >
      {/* Section Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              User Management
            </h2>
            <p className="text-sm text-neutral-500">
              {totalUsers} users total
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">
              {search ? 'No users found matching your search' : 'No users yet'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onView={onViewUser}
                  onQuickVerify={onVerifyUser}
                  isUpdating={updatingUserId === u.id}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Verifications Tab Content
// ============================================

interface VerificationsTabProps {
  verifications: AdminVerificationRequest[];
  isLoading: boolean;
  filter: VerificationFilter;
  setFilter: (f: VerificationFilter) => void;
  onView: (v: AdminVerificationRequest) => void;
  pendingCount: number;
}

function VerificationsTab({
  verifications,
  isLoading,
  filter,
  setFilter,
  onView,
  pendingCount,
}: VerificationsTabProps) {
  const filters: { value: VerificationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass overflow-hidden"
    >
      {/* Section Header */}
      <div className="p-3 sm:p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Verification Reviews
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Review and manage ID verification requests
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-full overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                  filter === f.value
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                {f.label}
                {f.value === 'pending' && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--pink-400)] text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verifications List */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">
              {filter === 'all'
                ? 'No verification requests yet'
                : `No ${filter} verification requests`}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <div>
              {verifications.map((v) => (
                <VerificationRow
                  key={v.id}
                  verification={v}
                  onView={onView}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Agent Verifications Tab
// ============================================

const agentTierLabels: Record<string, string> = {
  licensed_pro: 'Licensed Professional',
  registered_agent: 'Registered Agent',
  property_owner: 'Property Owner',
  house_owner: 'House Owner',
};

const agentDocTypeLabels: Record<string, string> = {
  esvarbon_license: 'ESVARBON License',
  niesv_certificate: 'NIESV Certificate',
  lasrera_certificate: 'LASRERA Certificate',
  cac_certificate: 'CAC Registration',
  ercaan_membership: 'ERCAAN Membership',
  redan_membership: 'REDAN Membership',
  certificate_of_occupancy: 'Certificate of Occupancy',
  governors_consent: "Governor's Consent",
  deed_of_assignment: 'Deed of Assignment',
  survey_plan: 'Survey Plan',
  excision_gazette: 'Excision & Gazette',
  valid_id: 'Valid ID',
  house_photos: 'House Photos',
};

interface AgentVerificationsTabProps {
  verifications: AdminAgentVerificationRequest[];
  isLoading: boolean;
  filter: AgentVerificationFilter;
  setFilter: (f: AgentVerificationFilter) => void;
  onView: (v: AdminAgentVerificationRequest) => void;
  pendingCount: number;
}

function AgentVerificationsTab({
  verifications,
  isLoading,
  filter,
  setFilter,
  onView,
  pendingCount,
}: AgentVerificationsTabProps) {
  const filters: { value: AgentVerificationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass overflow-hidden"
    >
      <div className="p-3 sm:p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Agent / Owner Verifications
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Review agent and property owner verification requests
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-full overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                  filter === f.value
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                {f.label}
                {f.value === 'pending' && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--pink-400)] text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">
              {filter === 'all'
                ? 'No agent verification requests yet'
                : `No ${filter} agent verification requests`}
            </p>
          </div>
        ) : (
          <div>
            {verifications.map((v) => (
              <button
                key={v.id}
                onClick={() => onView(v)}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b border-[var(--peach-100)] dark:border-neutral-800 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors text-left"
              >
                <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-neutral-800 shadow-sm flex-shrink-0">
                  <AvatarImage src={resolveImageUrl(v.user.avatar)} alt={v.user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-sm font-semibold text-neutral-800">
                    {v.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {v.user.name}
                    </p>
                    {v.status === 'approved' && v.tier && (
                      <AgentBadge tier={v.tier} size="sm" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">
                    {agentTierLabels[v.tier] || v.tier} &middot; {agentDocTypeLabels[v.documentType] || v.documentType}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold',
                    v.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
                    v.status === 'approved' && 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
                    v.status === 'rejected' && 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                  )}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Agent Verification Detail Modal
// ============================================

interface AgentVerificationDetailProps {
  verification: AdminAgentVerificationRequest;
  onClose: () => void;
  onReview: (id: string, status: 'approved' | 'rejected', rejectionReason?: string, adminNotes?: string) => void;
  isReviewing: boolean;
}

function AgentVerificationDetail({ verification, onClose, onReview, isReviewing }: AgentVerificationDetailProps) {
  const [adminNotes, setAdminNotes] = useState(verification.adminNotes || '');
  const [rejectionReason, setRejectionReason] = useState(verification.rejectionReason || '');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const rejectionFormRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showRejectForm) {
      const timer = setTimeout(() => {
        if (rejectionFormRef.current) {
          rejectionFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          rejectionFormRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showRejectForm]);

  const handleApprove = () => {
    onReview(verification.id, 'approved', undefined, adminNotes || undefined);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onReview(verification.id, 'rejected', rejectionReason, adminNotes || undefined);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl sm:mx-4 max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 sm:hidden" />
            <div className="pt-2 sm:pt-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Agent Verification Review
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500">
                Submitted {new Date(verification.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
            {/* User Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-white dark:ring-neutral-800 shadow-md flex-shrink-0">
                <AvatarImage src={resolveImageUrl(verification.user.avatar)} alt={verification.user.name} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-base sm:text-lg font-semibold text-neutral-800">
                  {verification.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {verification.user.name}
                </h4>
                {verification.user.email && (
                  <p className="text-xs sm:text-sm text-neutral-500 truncate">{verification.user.email}</p>
                )}
              </div>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0',
                verification.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
                verification.status === 'approved' && 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
                verification.status === 'rejected' && 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
              )}>
                {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
              </span>
            </div>

            {/* Tier & Document Info */}
            <div className="p-3 sm:p-4 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {agentTierLabels[verification.tier] || verification.tier}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {agentDocTypeLabels[verification.documentType] || verification.documentType}
                  </p>
                </div>
              </div>

              {verification.documentNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Document #</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{verification.documentNumber}</span>
                </div>
              )}
              {verification.licenseNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">License #</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{verification.licenseNumber}</span>
                </div>
              )}
              {verification.businessName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Business Name</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{verification.businessName}</span>
                </div>
              )}
            </div>

            {/* Document Images */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                Document Images
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {verification.documentFrontImage && (
                  <button
                    onClick={() => setLightboxImage({ src: verification.documentFrontImage, alt: 'Front' })}
                    className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                  >
                    <img src={verification.documentFrontImage} alt="Front" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">Front</span>
                  </button>
                )}
                {verification.documentBackImage && (
                  <button
                    onClick={() => setLightboxImage({ src: verification.documentBackImage!, alt: 'Back' })}
                    className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                  >
                    <img src={verification.documentBackImage} alt="Back" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">Back</span>
                  </button>
                )}
                {verification.supportingDocumentImage && (
                  <button
                    onClick={() => setLightboxImage({ src: verification.supportingDocumentImage!, alt: 'Supporting' })}
                    className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                  >
                    <img src={verification.supportingDocumentImage} alt="Supporting" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">Supporting</span>
                  </button>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            {verification.status === 'pending' && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                  Admin Notes (internal)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-[var(--teal-500)] text-sm text-neutral-900 dark:text-neutral-100 resize-none"
                />
              </div>
            )}

            {/* Rejection Form */}
            {verification.status === 'pending' && (
              <AnimatePresence>
                {showRejectForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <label className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 block">
                      Rejection Reason (will be sent to user)
                    </label>
                    <textarea
                      ref={rejectionFormRef}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this verification is being rejected..."
                      className="w-full px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 outline-none focus:border-red-400 text-sm text-neutral-900 dark:text-neutral-100 resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Actions */}
          {verification.status === 'pending' && (
            <div className="sticky bottom-0 bg-white dark:bg-neutral-900 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--peach-200)] dark:border-neutral-800 flex gap-3 flex-shrink-0">
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={isReviewing}
                    className="flex-1 py-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isReviewing}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--lime-400)] to-[var(--teal-400)] text-[#212121] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    disabled={isReviewing}
                    className="flex-1 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isReviewing || !rejectionReason.trim()}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Confirm Reject
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// Admin Post Creator Types & Constants
// ============================================

const adminPostTypes = [
  {
    id: 'announcement' as const,
    icon: Megaphone,
    label: 'Announcement',
    description: 'General update, news, tips, or any announcement',
    color: 'amber' as const,
  },
  {
    id: 'house-alert' as const,
    icon: AlertTriangle,
    label: '🚨 House Alert',
    description: 'Featured housing listing with special email notification',
    color: 'pink' as const,
  },
  {
    id: 'looking-for-roommate' as const,
    icon: Users,
    label: 'Looking for Roommate',
    description: 'Someone has a place and needs a roommate',
    color: 'peach' as const,
  },
  {
    id: 'looking-for-place' as const,
    icon: Building2,
    label: 'Looking for Place',
    description: 'Someone needs a place and is open to sharing',
    color: 'lavender' as const,
  },
  {
    id: 'have-spare-room' as const,
    icon: Bed,
    label: 'Have Spare Room',
    description: 'An extra room is available for rent',
    color: 'lime' as const,
  },
];


// ============================================
// Testimonials Tab Content
// ============================================

interface TestimonialsTabProps {
  testimonials: any[];
  isLoading: boolean;
  filter: 'pending' | 'approved' | 'rejected' | 'all';
  setFilter: (f: 'pending' | 'approved' | 'rejected' | 'all') => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFeature: (id: string, featured: boolean) => void;
  onDelete: (id: string) => void;
  updatingId: string | null;
}

function TestimonialsTab({
  testimonials,
  isLoading,
  filter,
  setFilter,
  onApprove,
  onReject,
  onFeature,
  onDelete,
  updatingId,
}: TestimonialsTabProps) {
  const filters: { value: 'pending' | 'approved' | 'rejected' | 'all'; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Testimonials
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Review and manage user testimonials
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-full overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                  filter === f.value
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <Quote className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">
              No testimonials found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
            {testimonials.map((t) => (
              <div key={t.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* User Avatar */}
                  <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-neutral-800 shadow-sm flex-shrink-0">
                    <AvatarImage src={resolveImageUrl(t.user?.avatar)} alt={t.user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)] text-sm font-semibold text-neutral-800">
                      {t.user?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* User Info & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                          {t.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(t.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.isFeatured && (
                          <span className="badge badge-lime text-[10px]">
                            <Sparkles className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                        <span className={cn(
                          'badge text-[10px]',
                          t.status === 'pending' ? 'badge-peach' :
                          t.status === 'approved' ? 'badge-lime' : 'badge-pink'
                        )}>
                          {t.status === 'pending' && <Clock className="w-3 h-3" />}
                          {t.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {t.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Headline */}
                    {t.headline && (
                      <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">
                        "{t.headline}"
                      </p>
                    )}

                    {/* Content */}
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {t.content}
                    </p>

                    {/* Rating */}
                    {t.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApprove(t.id)}
                            disabled={updatingId === t.id}
                            className="px-3 py-1.5 rounded-lg bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)] text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--lime-200)] transition-colors disabled:opacity-50"
                          >
                            {updatingId === t.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(t.id)}
                            disabled={updatingId === t.id}
                            className="px-3 py-1.5 rounded-lg bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-500)] text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--pink-200)] transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                      {t.status === 'approved' && (
                        <button
                          onClick={() => onFeature(t.id, !t.isFeatured)}
                          disabled={updatingId === t.id}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50',
                            t.isFeatured
                              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              : 'bg-[var(--yellow-100)] dark:bg-[var(--yellow-400)]/10 text-[var(--yellow-600)]'
                          )}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {t.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(t.id)}
                        disabled={updatingId === t.id}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-medium flex items-center gap-1.5 hover:bg-red-100 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Posts Tab Content (Admin Post Creator)
// ============================================

function PostsTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [postType, setPostType] = useState<CreatePostData['postType'] | null>(null);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [customBudget, setCustomBudget] = useState('');
  const [spots, setSpots] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPost, setPublishedPost] = useState<{ id: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Banner mode state
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerMode, setBannerMode] = useState<'marquee' | 'listings-table'>('marquee');
  const [listingsTableData, setListingsTableData] = useState<BannerConfig['listingsTableData']>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [isTogglingBanner, setIsTogglingBanner] = useState(false);

  // Fetch banner config on mount
  useEffect(() => {
    settingsApi.getBannerConfig()
      .then((config) => {
        setBannerEnabled(config.bannerEnabled);
        setBannerMode(config.bannerMode);
        setListingsTableData(config.listingsTableData);
      })
      .catch(() => {});
  }, []);

  const handleToggleBanner = async () => {
    setIsTogglingBanner(true);
    try {
      const result = await settingsApi.admin.setBannerEnabled(!bannerEnabled);
      setBannerEnabled(result.bannerEnabled);
      showToast(`Announcement banner ${result.bannerEnabled ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      showToast('Failed to toggle banner', 'error');
    } finally {
      setIsTogglingBanner(false);
    }
  };

  const handleBannerModeChange = async (mode: 'marquee' | 'listings-table') => {
    setIsSwitchingMode(true);
    try {
      await settingsApi.admin.setBannerMode(mode);
      setBannerMode(mode);
      showToast(`Announcement banner set to ${mode === 'marquee' ? 'Announcement' : 'Listings Table'}`, 'success');
    } catch {
      showToast('Failed to change banner mode', 'error');
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const handleGenerateListings = async () => {
    setIsGenerating(true);
    try {
      const result = await settingsApi.admin.generateListingsTable();
      setBannerMode(result.bannerMode);
      setListingsTableData(result.listingsTableData);
      const rowCount = result.listingsTableData?.rows?.length ?? 0;
      if (rowCount > 0) {
        showToast(`Listings table generated — ${rowCount} rows. Banner switched to Listings Table mode.`, 'success');
      } else {
        showToast('Generated but no listings found. Make sure there are active posts.', 'error');
      }
    } catch {
      showToast('Failed to generate listings table', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const effectiveBudget = customBudget ? parseInt(customBudget, 10) : null;
  const isAnnouncement = postType === 'announcement';
  const canPublish = postType && content.trim().length >= 20 && (isAnnouncement || (location.trim() && effectiveBudget && effectiveBudget > 0));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); continue; }
        if (!file.type.startsWith('image/')) { showToast('Only image files allowed', 'error'); continue; }
        const result = await apiClient.uploadFile<{ url: string }>('/upload/image', file, { folder: 'posts' });
        setImages(prev => [...prev, result.url]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.size > 50 * 1024 * 1024) {
      showToast('Video must be under 50MB', 'error');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }
    if (!file.type.startsWith('video/')) {
      showToast('Only video files allowed', 'error');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }
    
    setUploadingVideo(true);
    try {
      const result = await apiClient.uploadFile<{ url: string }>('/upload/video', file, { folder: 'posts' });
      setVideo(result.url);
      showToast('Video uploaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload video', 'error');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!canPublish || isPublishing) return;
    setIsPublishing(true);
    try {
      const data: CreatePostData = {
        content: content.trim(),
        postType: postType!,
        ...(isAnnouncement ? {} : {
          location: location.trim(),
          budget: effectiveBudget!,
          spotsAvailable: spots,
        }),
        ...(location.trim() && isAnnouncement ? { location: location.trim() } : {}),
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
      };
      const post = await postsApi.createPost(data);
      setPublishedPost({ id: post.id, content: post.content.substring(0, 60) + '...' });
      showToast('Post published successfully! All users will see it in their feed.', 'success');
      // Reset form
      setPostType(null);
      setContent('');
      setLocation('');
      setCustomBudget('');
      setSpots(1);
      setImages([]);
      setVideo(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to publish post', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <AnimatePresence>
        {publishedPost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-glass p-4 border border-[var(--lime-300)] dark:border-[var(--lime-500)]/30 bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--lime-200)] dark:bg-[var(--lime-500)]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-[var(--lime-600)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--lime-700)] dark:text-[var(--lime-400)]">Post Published!</p>
                <p className="text-xs text-[var(--lime-600)] dark:text-[var(--lime-400)]/70 truncate">"{publishedPost.content}"</p>
              </div>
              <button onClick={() => setPublishedPost(null)} className="p-1 rounded-lg hover:bg-[var(--lime-200)] dark:hover:bg-[var(--lime-500)]/10 transition-colors">
                <X className="w-4 h-4 text-[var(--lime-600)]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Banner Mode Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass overflow-hidden"
      >
        <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
              <Table2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Announcement Banner</h2>
              <p className="text-sm text-neutral-500">Choose what visitors see in the announcement popup</p>
            </div>
            {/* Enable/Disable Toggle */}
            <button
              onClick={handleToggleBanner}
              disabled={isTogglingBanner}
              className="flex items-center gap-2 group"
              title={bannerEnabled ? 'Disable banner' : 'Enable banner'}
            >
              {isTogglingBanner ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              ) : (
                <>
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    bannerEnabled ? "text-[var(--lime-600)] dark:text-[var(--lime-400)]" : "text-neutral-400"
                  )}>
                    {bannerEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-200",
                    bannerEnabled
                      ? "bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)]"
                      : "bg-neutral-300 dark:bg-neutral-600"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                      bannerEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                    )} />
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
        <div className={cn("p-5 space-y-4 transition-opacity duration-200", !bannerEnabled && "opacity-50 pointer-events-none")}>
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 p-1">
              <button
                onClick={() => handleBannerModeChange('marquee')}
                disabled={isSwitchingMode}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  bannerMode === 'marquee'
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  Announcement
                </span>
              </button>
              <button
                onClick={() => handleBannerModeChange('listings-table')}
                disabled={isSwitchingMode}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  bannerMode === 'listings-table'
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Table2 className="w-3.5 h-3.5" />
                  Listings Table
                </span>
              </button>
            </div>
            {isSwitchingMode && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
          </div>

          {/* Generate Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateListings}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-white text-sm font-semibold hover:shadow-md transition-all disabled:opacity-60"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Listings Table'}
            </button>
            {listingsTableData && (
              <span className="text-xs text-neutral-400">
                Last generated: {new Date(listingsTableData.generatedAt).toLocaleString()} ({listingsTableData.postCount} posts scanned)
              </span>
            )}
          </div>

          {/* Status info */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>
              <span className="font-medium">Current mode:</span>{' '}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                bannerMode === 'listings-table'
                  ? "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-600)] dark:text-[var(--teal-400)]"
                  : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
              )}>
                {bannerMode === 'listings-table' ? 'Listings Table (active for visitors)' : 'Announcement (default)'}
              </span>
            </p>
            {bannerMode === 'listings-table' && !listingsTableData?.rows?.length && (
              <p className="text-amber-600 dark:text-amber-400">
                Listings Table mode is active but no table data exists. Click "Generate" to create one.
              </p>
            )}
          </div>

          {/* Table Preview */}
          {listingsTableData && listingsTableData.rows.length > 0 && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Table Preview ({listingsTableData.rows.length} rows) — this is what visitors see in the announcement popup</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/30">
                      <th className="px-3 py-1.5 font-medium">Name</th>
                      <th className="px-3 py-1.5 font-medium">Location</th>
                      <th className="px-3 py-1.5 font-medium">Description</th>
                      <th className="px-3 py-1.5 font-medium text-right">Price</th>
                      <th className="px-3 py-1.5 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listingsTableData.rows.map((row, i) => (
                      <tr key={row.postId + '-' + i} className="border-t border-neutral-100 dark:border-neutral-800">
                        <td className="px-3 py-1.5 font-medium text-neutral-800 dark:text-neutral-200">{row.name}</td>
                        <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{row.location}</td>
                        <td className="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{row.description}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-neutral-800 dark:text-neutral-200">{row.price}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-[10px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                            {row.postType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Create a Post</h2>
              <p className="text-sm text-neutral-500">Publish a post as admin — it will appear in every user's feed</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-6">

          {/* Post Type */}
          <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3 block">Post Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adminPostTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                    postType === type.id
                      ? "border-[var(--teal-500)] bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10"
                      : "border-transparent bg-[var(--peach-50)] dark:bg-neutral-800/50 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    type.color === 'amber' && "bg-amber-100 dark:bg-amber-500/10",
                    type.color === 'pink' && "bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10",
                    type.color === 'peach' && "bg-[var(--peach-200)] dark:bg-[var(--peach-300)]/10",
                    type.color === 'lavender' && "bg-[var(--lavender-200)] dark:bg-[var(--lavender-300)]/10",
                    type.color === 'lime' && "bg-[var(--lime-200)] dark:bg-[var(--lime-300)]/10"
                  )}>
                    <type.icon className={cn(
                      "w-5 h-5",
                      type.color === 'amber' ? "text-amber-600 dark:text-amber-400" : 
                      type.color === 'pink' ? "text-[var(--pink-500)]" : "text-neutral-700 dark:text-neutral-300"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{type.label}</p>
                    <p className="text-xs text-neutral-500 leading-snug">{type.description}</p>
                  </div>
                  {postType === type.id && (
                    <div className="w-5 h-5 rounded-full bg-[var(--teal-500)] flex items-center justify-center flex-shrink-0 ml-auto">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">Content</label>
            <div className="rounded-2xl bg-[var(--peach-50)] dark:bg-neutral-800/50 overflow-hidden">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isAnnouncement ? "Write your announcement... Share news, updates, tips, events, or anything you want users to know." : "Write the post content... Describe the listing, what's available, preferences, lifestyle, etc."}
                rows={5}
                maxLength={600}
                className="w-full bg-transparent px-4 pt-4 pb-2 outline-none text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400 text-sm"
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || images.length >= 5}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-600 transition-colors disabled:opacity-40"
                  >
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                    Add Photos
                  </button>
                  {images.length > 0 && (
                    <span className="text-xs text-neutral-400">{images.length}/5</span>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo || !!video}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--lavender-100)] dark:bg-[var(--lavender-500)]/10 text-xs font-medium text-[var(--lavender-600)] dark:text-[var(--lavender-400)] hover:bg-[var(--lavender-200)] dark:hover:bg-[var(--lavender-500)]/20 transition-colors disabled:opacity-40"
                  >
                    {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    Add Video
                  </button>
                  {video && (
                    <span className="text-xs text-[var(--lavender-500)]">1 video</span>
                  )}
                </div>
                <span className={cn(
                  "text-xs",
                  content.length < 20 ? "text-neutral-400" : "text-[var(--teal-600)]"
                )}>
                  {content.length}/500
                </span>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden group">
                      <img
                        src={resolveImageUrl(img) || img}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video Preview */}
              {video && (
                <div className="px-4 pb-4">
                  <div className="relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <video
                      src={resolveImageUrl(video) || video}
                      controls
                      className="w-full max-h-48 object-contain"
                    />
                    <button
                      onClick={() => setVideo(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Location for announcements */}
          {isAnnouncement && (
            <div>
              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                <MapPin className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Location <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lagos, Nigeria (leave blank for general announcements)"
                className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400"
              />
            </div>
          )}

          {/* Location & Budget Row — only for housing posts */}
          {!isAnnouncement && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                <MapPin className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lekki Phase 1, Lagos"
                className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                <span className="inline text-xs font-bold mr-1">₦</span> Budget (Yearly)
              </label>
              <input
                type="number"
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400"
              />
            </div>
          </div>


          {/* Spots */}
          <div>
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">Spots Available</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSpots(Math.max(1, spots - 1))}
                className="w-10 h-10 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 flex items-center justify-center text-lg font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 w-8 text-center">{spots}</span>
              <button
                onClick={() => setSpots(Math.min(10, spots + 1))}
                className="w-10 h-10 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 flex items-center justify-center text-lg font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors"
              >
                +
              </button>
              <span className="text-xs text-neutral-500 ml-1">roommate{spots !== 1 ? 's' : ''} needed</span>
            </div>
          </div>
          </>
          )}

          {/* Divider */}
          <div className="border-t border-[var(--peach-200)] dark:border-neutral-800" />

          {/* Publish Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              {canPublish ? 'Ready to publish' : 'Fill in all required fields'}
            </p>
            <button
              onClick={handlePublish}
              disabled={!canPublish || isPublishing}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all",
                canPublish && !isPublishing
                  ? "bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] shadow-md hover:shadow-lg"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
              )}
            >
              {isPublishing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
              ) : (
                <><Send className="w-4 h-4" /> Publish Post</>
              )}
            </button>
          </div>

        </div>
      </motion.div>

      {/* Post Management Section */}
      <PostManagement showToast={showToast} />
    </div>
  );
}

// ============================================
// Post Management Component (for promotions)
// ============================================

interface ManagedPost {
  id: string;
  content: string;
  author: { id: string; name: string; avatar?: string };
  location?: string;
  budget?: number;
  spotsAvailable?: number;
  postType: string;
  promotionType?: 'none' | 'sponsored' | 'promoted';
  promotedBy?: { id: string; name: string };
  promotedAt?: string;
  createdAt: string;
}

function PostManagement({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promotingPostId, setPromotingPostId] = useState<string | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState<{ postId: string; currentType: string } | null>(null);
  const [editingPost, setEditingPost] = useState<ManagedPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editSpots, setEditSpots] = useState(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await postsApi.getPosts({ limit: 50, sortBy: 'createdAt', sortOrder: 'DESC' });
      setPosts(response.data as ManagedPost[]);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      showToast('Failed to load posts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePromote = async (postId: string, promotionType: 'sponsored' | 'promoted') => {
    setPromotingPostId(postId);
    try {
      const updatedPost = await postsApi.promotePost(postId, promotionType);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedPost } : p));
      showToast(`Post ${promotionType === 'promoted' ? 'promoted' : 'marked as sponsored'}!`, 'success');
      setShowPromoteModal(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to promote post', 'error');
    } finally {
      setPromotingPostId(null);
    }
  };

  const handleDemote = async (postId: string) => {
    setPromotingPostId(postId);
    try {
      await postsApi.demotePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, promotionType: 'none', promotedBy: undefined, promotedAt: undefined } : p));
      showToast('Promotion removed', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to remove promotion', 'error');
    } finally {
      setPromotingPostId(null);
    }
  };

  const getPromotionBadge = (type?: string) => {
    if (!type || type === 'none') return null;
    if (type === 'promoted') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121]">
          <Sparkles className="w-3 h-3" />
          PROMOTED
        </span>
      );
    }
    if (type === 'sponsored') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--lavender-200)] text-[var(--lavender-600)]">
          <Megaphone className="w-3 h-3" />
          SPONSORED
        </span>
      );
    }
    return null;
  };

  const openEditModal = (post: ManagedPost) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditLocation(post.location || '');
    setEditBudget(post.budget && post.budget > 0 ? String(post.budget) : '');
    setEditSpots(post.spotsAvailable || 1);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setIsSavingEdit(true);
    try {
      const data: Record<string, unknown> = {};
      if (editContent.trim() !== editingPost.content) data.content = editContent.trim();
      if (editLocation.trim() !== (editingPost.location || '')) data.location = editLocation.trim();
      const newBudget = editBudget ? parseInt(editBudget, 10) : 0;
      if (newBudget !== (editingPost.budget || 0)) data.budget = newBudget;
      if (editSpots !== (editingPost.spotsAvailable || 1)) data.spotsAvailable = editSpots;

      if (Object.keys(data).length === 0) {
        setEditingPost(null);
        return;
      }

      const updated = await postsApi.updatePost(editingPost.id, data);
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...updated } : p));
      showToast('Post updated successfully', 'success');
      setEditingPost(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update post', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Sort posts: promoted first, then sponsored, then regular
  const sortedPosts = [...posts].sort((a, b) => {
    const order = { promoted: 0, sponsored: 1, none: 2, undefined: 2 };
    const aOrder = order[a.promotionType as keyof typeof order] ?? 2;
    const bOrder = order[b.promotionType as keyof typeof order] ?? 2;
    return aOrder - bOrder;
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--lavender-400)] to-[var(--pink-400)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Manage Post Promotions</h2>
              <p className="text-sm text-neutral-500">Promote posts to keep them at the top of the feed</p>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500">No posts yet</p>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors",
                  post.promotionType === 'promoted' && "bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/5",
                  post.promotionType === 'sponsored' && "bg-[var(--lavender-50)] dark:bg-[var(--lavender-500)]/5"
                )}
              >
                {/* Post Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {getPromotionBadge(post.promotionType)}
                    <span className="text-xs text-neutral-500">
                      by {post.author?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {post.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {post.location}
                      </span>
                    )}
                    {post.budget && post.budget > 0 && (
                      <span className="text-[var(--lime-600)]">
                        ₦{post.budget.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {post.promotedBy && post.promotedAt && (
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Promoted by {post.promotedBy.name} on {new Date(post.promotedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(post); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-all"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {(!post.promotionType || post.promotionType === 'none') ? (
                    <button
                      onClick={() => setShowPromoteModal({ postId: post.id, currentType: post.promotionType || 'none' })}
                      disabled={promotingPostId === post.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--lime-300)] to-[var(--yellow-300)] text-[#212121] text-xs font-medium hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {promotingPostId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Promote
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDemote(post.id)}
                      disabled={promotingPostId === post.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 text-[var(--pink-600)] text-xs font-medium hover:bg-[var(--pink-200)] dark:hover:bg-[var(--pink-400)]/20 transition-all disabled:opacity-50"
                    >
                      {promotingPostId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Promote Modal */}
      <AnimatePresence>
        {showPromoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPromoteModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Choose Promotion Type
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handlePromote(showPromoteModal.postId, 'promoted')}
                  disabled={promotingPostId !== null}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-[var(--lime-400)] bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/10 transition-all disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#212121]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Promoted</p>
                    <p className="text-xs text-neutral-500">Featured at the very top of the feed</p>
                  </div>
                </button>
                <button
                  onClick={() => handlePromote(showPromoteModal.postId, 'sponsored')}
                  disabled={promotingPostId !== null}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-[var(--lavender-400)] bg-[var(--lavender-50)] dark:bg-[var(--lavender-500)]/10 transition-all disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--lavender-200)] dark:bg-[var(--lavender-400)]/20 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-[var(--lavender-600)]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Sponsored</p>
                    <p className="text-xs text-neutral-500">Marked as sponsored, appears after promoted</p>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowPromoteModal(null)}
                className="w-full mt-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Post Modal */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setEditingPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg sm:mx-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-neutral-900 px-5 py-4 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Edit Post</h3>
                <button
                  onClick={() => setEditingPost(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Content */}
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm resize-none"
                  />
                </div>

                {/* Location */}
                {editingPost.postType !== 'announcement' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> Location
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. Lekki Phase 1, Lagos"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                  </div>
                )}

                {/* Budget */}
                {editingPost.postType !== 'announcement' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                      <span className="inline text-xs font-bold mr-1">₦</span> Budget (Yearly, ₦)
                    </label>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100 text-sm"
                    />
                  </div>
                )}

                {/* Spots */}
                {editingPost.postType !== 'announcement' && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2 block">
                      Spots Available
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditSpots(Math.max(1, editSpots - 1))}
                        className="w-10 h-10 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 flex items-center justify-center text-lg font-semibold text-neutral-600 dark:text-neutral-400"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 w-8 text-center">{editSpots}</span>
                      <button
                        onClick={() => setEditSpots(Math.min(10, editSpots + 1))}
                        className="w-10 h-10 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 flex items-center justify-center text-lg font-semibold text-neutral-600 dark:text-neutral-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-neutral-900 px-5 py-4 border-t border-[var(--peach-200)] dark:border-neutral-800 flex gap-3">
                <button
                  onClick={() => setEditingPost(null)}
                  className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="flex-1 py-3 rounded-xl btn-primary text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// Settings Tab Content
// ============================================

// ============================================
// Support Tab Component
// ============================================

function SupportTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const confirm = useConfirm();
  const [mode, setMode] = useState<'select' | 'all'>('select');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async (p: number, search?: string) => {
    setIsLoadingUsers(true);
    try {
      const response = await usersApi.admin.getAllUsers(p, 20, search || undefined);
      setUsers(response.data.filter(u => u.role !== 'admin'));
      setTotalPages(response.meta.totalPages);
      setTotalUsers(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'select') {
      fetchUsers(page, searchQuery);
    }
  }, [mode, page, fetchUsers]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, value);
    }, 300);
  }, [fetchUsers]);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Select/deselect all on page
  const selectAllOnPage = () => {
    const nonAdminIds = users.filter(u => u.role !== 'admin').map(u => u.id);
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      nonAdminIds.forEach(id => next.add(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Send support message
  const handleSend = async () => {
    if (!messageContent.trim()) return;

    if (mode === 'all') {
      const confirmed = await confirm({
        title: 'Send to All Users',
        message: `Are you sure you want to send this support message to ALL users? This action cannot be undone.`,
        confirmText: 'Send to All',
        type: 'danger',
      });
      if (!confirmed) return;
    }

    if (mode === 'select' && selectedUserIds.size === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }

    setIsSending(true);
    try {
      const data = mode === 'all'
        ? { sendToAll: true, content: messageContent.trim() }
        : { recipientIds: Array.from(selectedUserIds), content: messageContent.trim() };

      const result = await chatApi.sendSupportMessage(data);
      showToast(`Support message sent to ${result.sentCount} user${result.sentCount !== 1 ? 's' : ''}`, 'success');
      setMessageContent('');
      setSelectedUserIds(new Set());
    } catch (error) {
      console.error('Failed to send support message:', error);
      showToast('Failed to send support message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const canSend = messageContent.trim().length > 0 && (mode === 'all' || selectedUserIds.size > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass overflow-hidden"
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Support Messaging
              </h2>
              <p className="text-sm text-neutral-500">
                Send messages as &quot;{PLATFORM_NAME} Support&quot; to users
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recipient Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass overflow-hidden"
      >
        <div className="p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Recipients
          </h3>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setMode('select'); setSelectedUserIds(new Set()); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                mode === 'select'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-white/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
              )}
            >
              <UserCheck className="w-4 h-4" />
              Select Users
            </button>
            <button
              onClick={() => { setMode('all'); setSelectedUserIds(new Set()); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                mode === 'all'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-white/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
              )}
            >
              <UsersRound className="w-4 h-4" />
              All Users
            </button>
          </div>

          {/* Mode Content */}
          {mode === 'all' ? (
            <div className="bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10 rounded-xl p-4 border border-[var(--teal-200)] dark:border-[var(--teal-500)]/20">
              <div className="flex items-center gap-2 text-[var(--teal-700)] dark:text-[var(--teal-300)]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  This will send the message to all non-admin users on the platform.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="search-input mb-4">
                <Search className="w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-neutral-100"
                />
                {searchQuery && (
                  <button onClick={() => handleSearch('')}>
                    <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                  </button>
                )}
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllOnPage}
                    className="text-xs text-[var(--teal-600)] dark:text-[var(--teal-400)] hover:underline font-medium"
                  >
                    Select all on page
                  </button>
                  {selectedUserIds.size > 0 && (
                    <>
                      <span className="text-xs text-neutral-400">|</span>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-red-500 hover:underline font-medium"
                      >
                        Clear selection
                      </button>
                    </>
                  )}
                </div>
                {selectedUserIds.size > 0 && (
                  <span className="badge badge-teal text-xs">
                    {selectedUserIds.size} selected
                  </span>
                )}
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--teal-500)]" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-8">
                    No users found
                  </p>
                ) : (
                  users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                        selectedUserIds.has(u.id)
                          ? 'bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10 ring-1 ring-[var(--teal-300)] dark:ring-[var(--teal-500)]/30'
                          : 'hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800'
                      )}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        selectedUserIds.has(u.id)
                          ? 'bg-[var(--teal-500)] border-[var(--teal-500)]'
                          : 'border-neutral-300 dark:border-neutral-600'
                      )}>
                        {selectedUserIds.has(u.id) && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={u.avatar || ''} alt={u.name} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--peach-300)] to-[var(--pink-300)]">
                          {u.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {u.name}
                          </span>
                          {u.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-[var(--teal-500)] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate">
                          {u.email || u.phone}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--peach-200)] dark:border-neutral-700">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-xs text-neutral-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Message Composition */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-glass overflow-hidden"
      >
        <div className="p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Message
          </h3>

          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Type your support message here..."
            rows={4}
            className="w-full p-4 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[var(--teal-400)] transition-all resize-none"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-400">
              {messageContent.length} characters
            </span>
          </div>

          {/* Preview */}
          {messageContent.trim() && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-500)]/5 dark:to-[var(--lime-500)]/5 border border-[var(--teal-200)] dark:border-[var(--teal-500)]/20">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                Preview — how users will see this message:
              </p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center flex-shrink-0">
                  <img src={PLATFORM_LOGO} alt={PLATFORM_NAME} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)]">
                      {PLATFORM_NAME} Support
                    </span>
                    <Shield className="w-3.5 h-3.5 text-[var(--teal-500)]" />
                  </div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {messageContent.trim()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Send Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleSend}
          disabled={!canSend || isSending}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all',
            canSend && !isSending
              ? 'bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
          )}
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {mode === 'all'
                ? 'Send to All Users'
                : `Send to ${selectedUserIds.size} User${selectedUserIds.size !== 1 ? 's' : ''}`}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// Settings Tab
// ============================================

interface SettingsTabProps {
  notifyOnNewPosts: boolean;
  broadcastSponsored: boolean;
  premiumEnabledWeb: boolean;
  premiumEnabledMobile: boolean;
  isLoading: boolean;
  isTogglingNotifications: boolean;
  isTogglingBroadcast: boolean;
  isTogglingPremiumWeb: boolean;
  isTogglingPremiumMobile: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onToggleBroadcast: (enabled: boolean) => void;
  onTogglePremiumWeb: (enabled: boolean) => void;
  onTogglePremiumMobile: (enabled: boolean) => void;
  lastUpdated: string | null;
}

function SettingsTab({
  notifyOnNewPosts,
  broadcastSponsored,
  premiumEnabledWeb,
  premiumEnabledMobile,
  isLoading,
  isTogglingNotifications,
  isTogglingBroadcast,
  isTogglingPremiumWeb,
  isTogglingPremiumMobile,
  onToggleNotifications,
  onToggleBroadcast,
  onTogglePremiumWeb,
  onTogglePremiumMobile,
  lastUpdated
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass overflow-hidden"
      >
        {/* Section Header */}
        <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Email Notifications
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Control how email notifications are sent to users across the platform
          </p>
        </div>

        {/* Settings Content */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* New Post Notifications Toggle */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--peach-50)] dark:bg-neutral-800/50 border border-[var(--peach-100)] dark:border-neutral-700/50">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  notifyOnNewPosts
                    ? "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10"
                    : "bg-neutral-100 dark:bg-neutral-700"
                )}>
                  {notifyOnNewPosts ? (
                    <Bell className="w-6 h-6 text-[var(--teal-600)]" />
                  ) : (
                    <BellOff className="w-6 h-6 text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        New Post Email Alerts
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                        When enabled, all users who have opted in will receive a styled email notification
                        every time someone publishes a new post. The email includes the post details,
                        author info, and a direct link to the listing.
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => onToggleNotifications(!notifyOnNewPosts)}
                      disabled={isTogglingNotifications}
                      className={cn(
                        "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--teal-400)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        notifyOnNewPosts ? "bg-[var(--teal-500)]" : "bg-neutral-300 dark:bg-neutral-600"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                          notifyOnNewPosts ? "translate-x-5" : "translate-x-0"
                        )}
                      >
                        {isTogglingNotifications && (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--teal-500)] absolute top-1 left-1" />
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      notifyOnNewPosts
                        ? "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-700)] dark:text-[var(--lime-400)]"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        notifyOnNewPosts ? "bg-[var(--lime-500)]" : "bg-neutral-400"
                      )} />
                      {notifyOnNewPosts ? 'Active' : 'Disabled'}
                    </span>
                    {lastUpdated && (
                      <span className="text-xs text-neutral-400">
                        Last changed {new Date(lastUpdated).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="p-4 rounded-xl bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/5 border border-[var(--teal-100)] dark:border-[var(--teal-500)]/10">
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-[var(--teal-500)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--teal-700)] dark:text-[var(--teal-400)] mb-1">
                      How it works
                    </p>
                    <p className="text-sm text-[var(--teal-600)] dark:text-[var(--teal-300)]/80 leading-relaxed">
                      When a user creates a new post, an email is sent to all other users who have individually
                      enabled new post alerts in their settings. This admin toggle acts as a master switch —
                      disabling it will stop all new post emails regardless of individual user preferences.
                      Emails are sent in batches with rate limiting to avoid spam triggers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Broadcast Sponsored Posts Toggle */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--lavender-50)] dark:bg-[var(--lavender-500)]/5 border border-[var(--lavender-100)] dark:border-[var(--lavender-500)]/20">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  broadcastSponsored
                    ? "bg-[var(--lavender-100)] dark:bg-[var(--lavender-500)]/10"
                    : "bg-neutral-100 dark:bg-neutral-700"
                )}>
                  <Megaphone className={cn(
                    "w-6 h-6",
                    broadcastSponsored ? "text-[var(--lavender-600)]" : "text-neutral-400"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Broadcast Sponsored Posts
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                        When enabled, every time you mark a post as "Sponsored", all users will receive
                        an in-app notification about the sponsored listing. This helps maximize
                        visibility for sponsored content.
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => onToggleBroadcast(!broadcastSponsored)}
                      disabled={isTogglingBroadcast}
                      className={cn(
                        "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--lavender-400)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        broadcastSponsored ? "bg-[var(--lavender-500)]" : "bg-neutral-300 dark:bg-neutral-600"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                          broadcastSponsored ? "translate-x-5" : "translate-x-0"
                        )}
                      >
                        {isTogglingBroadcast && (
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--lavender-500)] absolute top-1 left-1" />
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      broadcastSponsored
                        ? "bg-[var(--lavender-100)] dark:bg-[var(--lavender-500)]/10 text-[var(--lavender-700)] dark:text-[var(--lavender-400)]"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        broadcastSponsored ? "bg-[var(--lavender-500)]" : "bg-neutral-400"
                      )} />
                      {broadcastSponsored ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sponsored Info Card */}
              <div className="p-4 rounded-xl bg-[var(--lavender-50)] dark:bg-[var(--lavender-500)]/5 border border-[var(--lavender-100)] dark:border-[var(--lavender-500)]/10">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--lavender-500)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--lavender-700)] dark:text-[var(--lavender-400)] mb-1">
                      Sponsored vs Promoted
                    </p>
                    <p className="text-sm text-[var(--lavender-600)] dark:text-[var(--lavender-300)]/80 leading-relaxed">
                      <strong>Promoted</strong> posts appear at the top of the feed but don't send notifications.
                      <strong> Sponsored</strong> posts also appear at the top and, when this setting is enabled,
                      will notify all users about the listing. Use sponsored for maximum reach.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Premium Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-glass overflow-hidden"
      >
        <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Premium Features
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Control the premium subscription system across the entire platform
          </p>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Web Premium Toggle */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  premiumEnabledWeb
                    ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                    : "bg-neutral-100 dark:bg-neutral-700"
                )}>
                  <Star className={cn(
                    "w-6 h-6",
                    premiumEnabledWeb ? "text-white" : "text-neutral-400"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Premium on Web
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                        Toggle premium features on the web platform. When disabled, premium
                        subscriptions, boosts, and all premium perks are hidden on the website.
                      </p>
                    </div>

                    <button
                      onClick={() => onTogglePremiumWeb(!premiumEnabledWeb)}
                      disabled={isTogglingPremiumWeb}
                      className={cn(
                        "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        premiumEnabledWeb ? "bg-gradient-to-r from-amber-400 to-yellow-500" : "bg-neutral-300 dark:bg-neutral-600"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                          premiumEnabledWeb ? "translate-x-5" : "translate-x-0"
                        )}
                      >
                        {isTogglingPremiumWeb && (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500 absolute top-1 left-1" />
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      premiumEnabledWeb
                        ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        premiumEnabledWeb ? "bg-amber-500" : "bg-neutral-400"
                      )} />
                      {premiumEnabledWeb ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Premium Toggle */}
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  premiumEnabledMobile
                    ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                    : "bg-neutral-100 dark:bg-neutral-700"
                )}>
                  <Star className={cn(
                    "w-6 h-6",
                    premiumEnabledMobile ? "text-white" : "text-neutral-400"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Premium on Mobile
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                        Toggle premium features on the mobile app. When disabled, premium
                        subscriptions, boosts, and all premium perks are hidden in the app.
                      </p>
                    </div>

                    <button
                      onClick={() => onTogglePremiumMobile(!premiumEnabledMobile)}
                      disabled={isTogglingPremiumMobile}
                      className={cn(
                        "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        premiumEnabledMobile ? "bg-gradient-to-r from-amber-400 to-yellow-500" : "bg-neutral-300 dark:bg-neutral-600"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                          premiumEnabledMobile ? "translate-x-5" : "translate-x-0"
                        )}
                      >
                        {isTogglingPremiumMobile && (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500 absolute top-1 left-1" />
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      premiumEnabledMobile
                        ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        premiumEnabledMobile ? "bg-amber-500" : "bg-neutral-400"
                      )} />
                      {premiumEnabledMobile ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Premium Info Card */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                <div className="flex gap-3">
                  <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                      What this controls
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-300/80 leading-relaxed">
                      Each toggle controls premium features independently per platform.
                      When <strong>enabled</strong>: users can subscribe for ₦5,000/month to get
                      priority interest placement, premium badges, post viewer insights, advanced filters,
                      and one free post boost per month. When <strong>disabled</strong>: all premium features
                      are hidden and no new subscriptions can be made on that platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// Adverts Tab
// ============================================

function AdvertsTab({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New advert form
  const [newText, setNewText] = useState('');
  const [newLink, setNewLink] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editLink, setEditLink] = useState('');

  const fetchAdverts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await advertsApi.admin.getAll();
      setAdverts(data);
    } catch (err: any) {
      showToast('Failed to load adverts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAdverts();
  }, [fetchAdverts]);

  const handleCreate = async () => {
    if (!newText.trim() || newText.trim().length < 5) {
      showToast('Advert text must be at least 5 characters', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const advert = await advertsApi.admin.create({
        text: newText.trim(),
        link: newLink.trim() || undefined,
        position: adverts.length,
      });
      setAdverts(prev => [...prev, advert]);
      setNewText('');
      setNewLink('');
      setShowForm(false);
      showToast('Advert created successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create advert', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await advertsApi.admin.update(id, { isActive: !isActive });
      setAdverts(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a));
      showToast(`Advert ${!isActive ? 'enabled' : 'disabled'}`, 'success');
    } catch (err: any) {
      showToast('Failed to update advert', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await advertsApi.admin.remove(id);
      setAdverts(prev => prev.filter(a => a.id !== id));
      showToast('Advert deleted', 'success');
    } catch (err: any) {
      showToast('Failed to delete advert', 'error');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...adverts];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setAdverts(newOrder);
    try {
      await advertsApi.admin.reorder(newOrder.map(a => a.id));
    } catch (err: any) {
      showToast('Failed to reorder', 'error');
      fetchAdverts();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === adverts.length - 1) return;
    const newOrder = [...adverts];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setAdverts(newOrder);
    try {
      await advertsApi.admin.reorder(newOrder.map(a => a.id));
    } catch (err: any) {
      showToast('Failed to reorder', 'error');
      fetchAdverts();
    }
  };

  const startEdit = (advert: Advert) => {
    setEditingId(advert.id);
    setEditText(advert.text);
    setEditLink(advert.link || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditLink('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim() || editText.trim().length < 5) {
      showToast('Text must be at least 5 characters', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await advertsApi.admin.update(editingId, {
        text: editText.trim(),
        link: editLink.trim() || null,
      });
      setAdverts(prev => prev.map(a => a.id === editingId ? updated : a));
      cancelEdit();
      showToast('Advert updated', 'success');
    } catch (err: any) {
      showToast('Failed to update advert', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--lime-400)] to-[var(--yellow-400)] flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Marquee Adverts</h2>
                <p className="text-sm text-neutral-500">Manage scrolling adverts shown on homepage & explore</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-sm font-semibold text-neutral-800 hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Advert</span>
            </button>
          </div>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/5 border-b border-[var(--peach-200)] dark:border-neutral-800">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Advert Text</label>
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="e.g. Join 12,000+ people finding roommates on LetsGoHalf"
                      maxLength={200}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[var(--teal-400)] placeholder:text-neutral-400"
                    />
                    <span className="text-xs text-neutral-400 mt-1 block">{newText.length}/200</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">Link (optional)</label>
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="/explore or https://..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[var(--teal-400)] placeholder:text-neutral-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCreate}
                      disabled={isSaving || newText.trim().length < 5}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-white text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setNewText(''); setNewLink(''); }}
                      className="px-4 py-2 rounded-full text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Adverts List */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
            </div>
          ) : adverts.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-500">No adverts yet</p>
              <p className="text-xs text-neutral-400 mt-1">Create your first advert to show in the marquee banner</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adverts.map((advert, index) => (
                <motion.div
                  key={advert.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    advert.isActive
                      ? "border-[var(--lime-200)] dark:border-[var(--lime-500)]/20 bg-white dark:bg-neutral-800/50"
                      : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 opacity-60"
                  )}
                >
                  {editingId === advert.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={200}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[var(--teal-400)]"
                      />
                      <div className="flex items-center gap-2">
                        <Link className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          placeholder="Link (optional)"
                          className="flex-1 px-3 py-2 rounded-lg bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[var(--teal-400)]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-full bg-[var(--teal-500)] text-white text-xs font-semibold hover:bg-[var(--teal-600)] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-1.5 rounded-full text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center gap-3">
                      {/* Reorder controls */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === adverts.length - 1}
                          className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-3 h-3 text-[var(--lime-500)] flex-shrink-0" />
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{advert.text}</p>
                        </div>
                        {advert.link && (
                          <div className="flex items-center gap-1.5">
                            <Link className="w-3 h-3 text-neutral-400" />
                            <span className="text-xs text-neutral-400 truncate">{advert.link}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(advert.id, advert.isActive)}
                          className={cn(
                            "relative w-10 h-6 rounded-full transition-colors",
                            advert.isActive
                              ? "bg-[var(--lime-500)]"
                              : "bg-neutral-300 dark:bg-neutral-600"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                            advert.isActive ? "left-[18px]" : "left-0.5"
                          )} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => startEdit(advert)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-[var(--teal-500)] hover:bg-[var(--teal-50)] dark:hover:bg-[var(--teal-500)]/10 transition-colors"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(advert.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Preview Banner */}
      {adverts.filter(a => a.isActive).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass overflow-hidden"
        >
          <div className="p-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Live Preview</span>
            </div>
          </div>
          <div className="marquee-container bg-gradient-to-r from-[var(--lime-100)] via-[var(--peach-100)] to-[var(--lavender-100)] dark:from-[var(--lime-600)]/20 dark:via-[var(--peach-200)]/10 dark:to-[var(--lavender-400)]/15">
            <div className="flex items-center h-10">
              <div className="flex-shrink-0 flex items-center justify-center w-9 h-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)]">
                <Megaphone className="w-3.5 h-3.5 text-neutral-800" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="marquee-track">
                  {[...adverts.filter(a => a.isActive), ...adverts.filter(a => a.isActive)].map((advert, i) => (
                    <div key={`${advert.id}-${i}`} className="flex items-center">
                      {i > 0 && <div className="marquee-separator bg-neutral-400" />}
                      <span className="marquee-item text-neutral-700 dark:text-neutral-200">
                        <Sparkles className="w-3 h-3 text-[var(--lime-500)] flex-shrink-0" />
                        <span>{advert.text}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// Partners Tab
// ============================================

interface PartnersTabProps {
  applications: AdminPartnerApplication[];
  isLoadingApps: boolean;
  appFilter: 'all' | PartnerApplicationStatus;
  setAppFilter: (f: 'all' | PartnerApplicationStatus) => void;
  pendingCount: number;
  onViewApp: (app: AdminPartnerApplication) => void;
  onReviewApp: (id: string, status: 'approved' | 'rejected', rejectionReason?: string, adminNotes?: string) => void;
  isReviewing: boolean;
  selectedApp: AdminPartnerApplication | null;
  showDetail: boolean;
  onCloseDetail: () => void;
  commissions: PartnerCommission[];
  isLoadingCommissions: boolean;
  commissionFilter: 'all' | 'pending' | 'paid';
  setCommissionFilter: (f: 'all' | 'pending' | 'paid') => void;
  onMarkPaid: (id: string) => void;
  payouts: PartnerPayoutRequest[];
  isLoadingPayouts: boolean;
  payoutFilter: 'all' | 'pending' | 'processing' | 'completed' | 'rejected';
  setPayoutFilter: (f: 'all' | 'pending' | 'processing' | 'completed' | 'rejected') => void;
  onProcessPayout: (id: string, status: 'completed' | 'rejected', adminNotes?: string, rejectionReason?: string) => void;
  commissionSettings: CommissionSettings | null;
  setCommissionSettings: (s: CommissionSettings) => void;
  onSaveCommissionSettings: () => void;
  isSavingCommissionSettings: boolean;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

function PartnersTab({
  applications, isLoadingApps, appFilter, setAppFilter, pendingCount,
  onViewApp, onReviewApp, isReviewing, selectedApp, showDetail, onCloseDetail,
  commissions, isLoadingCommissions, commissionFilter, setCommissionFilter, onMarkPaid,
  payouts, isLoadingPayouts, payoutFilter, setPayoutFilter, onProcessPayout,
  commissionSettings, setCommissionSettings, onSaveCommissionSettings, isSavingCommissionSettings,
  showToast,
}: PartnersTabProps) {
  const [partnerSubTab, setPartnerSubTab] = useState<'applications' | 'commissions' | 'payouts' | 'settings'>('applications');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const appFilterOptions: { id: 'all' | PartnerApplicationStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const commissionFilterOptions: { id: 'all' | 'pending' | 'paid'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Paid' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Partner Management</h2>
          <p className="text-sm text-neutral-500">Manage applications, commissions, and payouts</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['applications', 'commissions', 'payouts', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPartnerSubTab(tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              partnerSubTab === tab
                ? "bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white"
                : "bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700"
            )}
          >
            {tab === 'applications' && `Applications${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            {tab === 'commissions' && 'Commissions'}
            {tab === 'payouts' && 'Payouts'}
            {tab === 'settings' && 'Commission Settings'}
          </button>
        ))}
      </div>

      {/* Applications sub-tab */}
      {partnerSubTab === 'applications' && (
        <div className="card-glass overflow-hidden">
          <div className="p-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
            <div className="flex flex-wrap gap-2">
              {appFilterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAppFilter(opt.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    appFilter === opt.id
                      ? "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-700)] dark:text-[var(--teal-300)]"
                      : "bg-[var(--peach-50)] dark:bg-neutral-800 text-neutral-500 hover:bg-[var(--peach-100)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingApps ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center">
              <Handshake className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No applications found</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => onViewApp(app)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors text-left"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={app.user?.avatar} />
                    <AvatarFallback className="bg-[var(--teal-100)] text-[var(--teal-700)] text-xs">
                      {app.fullName?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{app.fullName}</p>
                    <p className="text-xs text-neutral-500 truncate">{app.email} - {app.locationName || 'No location'}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    app.status === 'approved' ? "bg-[var(--lime-100)] text-[var(--lime-700)]" :
                    app.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {app.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Application Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={onCloseDetail}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[var(--peach-200)] dark:border-neutral-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Partner Application</h3>
                <button onClick={onCloseDetail} className="p-2 rounded-lg hover:bg-[var(--peach-100)] dark:hover:bg-neutral-800">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedApp.user?.avatar} />
                    <AvatarFallback className="bg-[var(--teal-100)] text-[var(--teal-700)]">
                      {selectedApp.fullName?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedApp.fullName}</p>
                    <p className="text-sm text-neutral-500">{selectedApp.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-neutral-500">Phone:</span> <span className="text-neutral-900 dark:text-neutral-100">{selectedApp.phone}</span></div>
                  <div><span className="text-neutral-500">Location:</span> <span className="text-neutral-900 dark:text-neutral-100">{selectedApp.locationName || 'N/A'}</span></div>
                  <div><span className="text-neutral-500">Hear about:</span> <span className="text-neutral-900 dark:text-neutral-100">{selectedApp.hearAbout}</span></div>
                  <div><span className="text-neutral-500">Status:</span> <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    selectedApp.status === 'approved' ? "bg-[var(--lime-100)] text-[var(--lime-700)]" :
                    selectedApp.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>{selectedApp.status}</span></div>
                </div>

                {selectedApp.experience && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Experience</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-[var(--peach-50)] dark:bg-neutral-800 p-3 rounded-xl">{selectedApp.experience}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Why become a partner?</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-[var(--peach-50)] dark:bg-neutral-800 p-3 rounded-xl">{selectedApp.whyPartner}</p>
                </div>

                {selectedApp.status === 'pending' && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Admin notes (optional)"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-sm outline-none text-neutral-900 dark:text-neutral-100"
                    />
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason (required if rejecting)"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-sm outline-none text-neutral-900 dark:text-neutral-100"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onReviewApp(selectedApp.id, 'rejected', rejectionReason, adminNotes)}
                        disabled={isReviewing || !rejectionReason.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onReviewApp(selectedApp.id, 'approved', undefined, adminNotes)}
                        disabled={isReviewing}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Approve
                      </button>
                    </div>
                  </div>
                )}

                {selectedApp.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700 dark:text-red-400">{selectedApp.rejectionReason}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Commissions sub-tab */}
      {partnerSubTab === 'commissions' && (
        <div className="card-glass overflow-hidden">
          <div className="p-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
            <div className="flex flex-wrap gap-2">
              {commissionFilterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCommissionFilter(opt.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    commissionFilter === opt.id
                      ? "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-700)] dark:text-[var(--teal-300)]"
                      : "bg-[var(--peach-50)] dark:bg-neutral-800 text-neutral-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingCommissions ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : commissions.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-3xl font-bold text-neutral-300 dark:text-neutral-600 mx-auto mb-3 block text-center">₦</span>
              <p className="text-sm text-neutral-500">No commissions found</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
              {commissions.map((c) => (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    c.type === 'post_creation' ? "bg-blue-100 dark:bg-blue-500/10" : "bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10"
                  )}>
                    {c.type === 'post_creation' ? (
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-[var(--lime-600)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {c.type === 'post_creation' ? 'Post Creation' : 'Match'} - {c.partner?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-neutral-500">{c.post?.location || 'Unknown'} | Referred: {c.referredUser?.name || 'Unknown'}</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--teal-600)]">{c.amount.toLocaleString()}</p>
                  {c.status === 'pending' ? (
                    <button
                      onClick={() => onMarkPaid(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white text-xs font-medium"
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--lime-100)] text-[var(--lime-700)] font-medium">paid</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payouts sub-tab */}
      {partnerSubTab === 'payouts' && (
        <div className="card-glass overflow-hidden">
          <div className="p-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPayoutFilter(opt)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    payoutFilter === opt
                      ? "bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/20 text-[var(--teal-700)] dark:text-[var(--teal-300)]"
                      : "bg-[var(--peach-50)] dark:bg-neutral-800 text-neutral-500"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {isLoadingPayouts ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : payouts.length === 0 ? (
            <div className="py-12 text-center">
              <Banknote className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No payout requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
              {payouts.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    p.status === 'completed' ? "bg-[var(--lime-100)]" :
                    p.status === 'rejected' ? "bg-red-100" :
                    "bg-amber-100"
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
                      {p.partner?.name || 'Unknown'} - {Number(p.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">{p.bankName} {p.accountNumber}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                    p.status === 'completed' ? "bg-[var(--lime-100)] text-[var(--lime-700)]" :
                    p.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {p.status}
                  </span>
                  {(p.status === 'pending' || p.status === 'processing') && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onProcessPayout(p.id, 'rejected')}
                        className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onProcessPayout(p.id, 'completed')}
                        className="px-2 py-1 rounded-lg bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white text-xs font-medium"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commission Settings sub-tab */}
      {partnerSubTab === 'settings' && commissionSettings && (
        <div className="card-glass p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Commission Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-500 mb-2 block">Commission Mode</label>
                <div className="flex gap-2">
                  {(['fixed', 'percentage'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setCommissionSettings({ ...commissionSettings, commissionMode: mode })}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all",
                        commissionSettings.commissionMode === mode
                          ? "bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white"
                          : "bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-500 mb-2 block">
                  Post Creation Commission {commissionSettings.commissionMode === 'percentage' ? '(%)' : '(Fixed Amount)'}
                </label>
                <input
                  type="number"
                  value={commissionSettings.postCreationCommission}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, postCreationCommission: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-500 mb-2 block">
                  Match Commission {commissionSettings.commissionMode === 'percentage' ? '(%)' : '(Fixed Amount)'}
                </label>
                <input
                  type="number"
                  value={commissionSettings.matchCommission}
                  onChange={(e) => setCommissionSettings({ ...commissionSettings, matchCommission: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 outline-none text-sm"
                />
              </div>

              <button
                onClick={onSaveCommissionSettings}
                disabled={isSavingCommissionSettings}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingCommissionSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Admin Page
// ============================================

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);

  // User management state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Verification state
  const [verifications, setVerifications] = useState<AdminVerificationRequest[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(true);
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedVerification, setSelectedVerification] = useState<AdminVerificationRequest | null>(null);
  const [showVerificationDetail, setShowVerificationDetail] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Agent verification state
  const [agentVerifications, setAgentVerifications] = useState<AdminAgentVerificationRequest[]>([]);
  const [isLoadingAgentVerifications, setIsLoadingAgentVerifications] = useState(true);
  const [agentVerificationFilter, setAgentVerificationFilter] = useState<AgentVerificationFilter>('all');
  const [agentPendingCount, setAgentPendingCount] = useState(0);
  const [selectedAgentVerification, setSelectedAgentVerification] = useState<AdminAgentVerificationRequest | null>(null);
  const [showAgentVerificationDetail, setShowAgentVerificationDetail] = useState(false);
  const [isReviewingAgent, setIsReviewingAgent] = useState(false);

  // Partners state
  const [partnerApplications, setPartnerApplications] = useState<AdminPartnerApplication[]>([]);
  const [isLoadingPartnerApps, setIsLoadingPartnerApps] = useState(true);
  const [partnerAppFilter, setPartnerAppFilter] = useState<'all' | PartnerApplicationStatus>('all');
  const [partnerPendingCount, setPartnerPendingCount] = useState(0);
  const [partnerCommissions, setPartnerCommissions] = useState<PartnerCommission[]>([]);
  const [isLoadingPartnerCommissions, setIsLoadingPartnerCommissions] = useState(true);
  const [partnerCommissionFilter, setPartnerCommissionFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [partnerPayouts, setPartnerPayouts] = useState<PartnerPayoutRequest[]>([]);
  const [isLoadingPartnerPayouts, setIsLoadingPartnerPayouts] = useState(true);
  const [partnerPayoutFilter, setPartnerPayoutFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all');
  const [selectedPartnerApp, setSelectedPartnerApp] = useState<AdminPartnerApplication | null>(null);
  const [showPartnerAppDetail, setShowPartnerAppDetail] = useState(false);
  const [isReviewingPartner, setIsReviewingPartner] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings | null>(null);
  const [isSavingCommissionSettings, setIsSavingCommissionSettings] = useState(false);

  // Testimonials state
  const [pendingTestimonials, setPendingTestimonials] = useState<any[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [testimonialFilter, setTestimonialFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
  const [updatingTestimonialId, setUpdatingTestimonialId] = useState<string | null>(null);

  // Settings state
  const [notifyOnNewPosts, setNotifyOnNewPosts] = useState(true);
  const [broadcastSponsored, setBroadcastSponsored] = useState(false);
  const [premiumEnabledWeb, setPremiumEnabledWeb] = useState(false);
  const [premiumEnabledMobile, setPremiumEnabledMobile] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [isTogglingBroadcast, setIsTogglingBroadcast] = useState(false);
  const [isTogglingPremiumWeb, setIsTogglingPremiumWeb] = useState(false);
  const [isTogglingPremiumMobile, setIsTogglingPremiumMobile] = useState(false);
  const [settingsLastUpdated, setSettingsLastUpdated] = useState<string | null>(null);

  // Debounce ref for user search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const LIMIT = 15;

  // ============================================
  // Fetch functions
  // ============================================

  const fetchStats = useCallback(async () => {
    try {
      const data = await usersApi.admin.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await usersApi.admin.getAllUsers(userPage, LIMIT, userSearch || undefined);
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalUsers(response.meta.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userPage, userSearch, showToast]);

  const fetchVerifications = useCallback(async () => {
    setIsLoadingVerifications(true);
    try {
      const status = verificationFilter === 'all' ? undefined : verificationFilter;
      const data = await verificationApi.admin.getAll(status);
      setVerifications(data);
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
      showToast('Failed to load verifications', 'error');
    } finally {
      setIsLoadingVerifications(false);
    }
  }, [verificationFilter, showToast]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const data = await verificationApi.admin.getPending();
      setPendingCount(data.length);
    } catch (err) {
      console.error('Failed to fetch pending count:', err);
    }
  }, []);

  const fetchAgentVerifications = useCallback(async () => {
    setIsLoadingAgentVerifications(true);
    try {
      const status = agentVerificationFilter === 'all' ? undefined : agentVerificationFilter;
      const data = await agentVerificationApi.admin.getAll(status);
      setAgentVerifications(data);
    } catch (err) {
      console.error('Failed to fetch agent verifications:', err);
      showToast('Failed to load agent verifications', 'error');
    } finally {
      setIsLoadingAgentVerifications(false);
    }
  }, [agentVerificationFilter, showToast]);

  const fetchAgentPendingCount = useCallback(async () => {
    try {
      const data = await agentVerificationApi.admin.getPending();
      setAgentPendingCount(data.length);
    } catch (err) {
      console.error('Failed to fetch agent pending count:', err);
    }
  }, []);

  const fetchPartnerApplications = useCallback(async () => {
    setIsLoadingPartnerApps(true);
    try {
      const status = partnerAppFilter === 'all' ? undefined : partnerAppFilter;
      const data = await partnersApi.admin.getAllApplications(status);
      setPartnerApplications(data);
    } catch (err) {
      console.error('Failed to fetch partner applications:', err);
    } finally {
      setIsLoadingPartnerApps(false);
    }
  }, [partnerAppFilter]);

  const fetchPartnerPendingCount = useCallback(async () => {
    try {
      const data = await partnersApi.admin.getPendingApplications();
      setPartnerPendingCount(data.length);
    } catch (err) {
      console.error('Failed to fetch partner pending count:', err);
    }
  }, []);

  const fetchPartnerCommissions = useCallback(async () => {
    setIsLoadingPartnerCommissions(true);
    try {
      const status = partnerCommissionFilter === 'all' ? undefined : partnerCommissionFilter as any;
      const data = await partnersApi.admin.getAllCommissions(status);
      setPartnerCommissions(data);
    } catch (err) {
      console.error('Failed to fetch partner commissions:', err);
    } finally {
      setIsLoadingPartnerCommissions(false);
    }
  }, [partnerCommissionFilter]);

  const fetchPartnerPayouts = useCallback(async () => {
    setIsLoadingPartnerPayouts(true);
    try {
      const status = partnerPayoutFilter === 'all' ? undefined : partnerPayoutFilter as any;
      const data = await partnersApi.admin.getAllPayoutRequests(status);
      setPartnerPayouts(data);
    } catch (err) {
      console.error('Failed to fetch partner payouts:', err);
    } finally {
      setIsLoadingPartnerPayouts(false);
    }
  }, [partnerPayoutFilter]);

  const fetchCommissionSettings = useCallback(async () => {
    try {
      const data = await partnersApi.admin.getCommissionSettings();
      setCommissionSettings(data);
    } catch (err) {
      console.error('Failed to fetch commission settings:', err);
    }
  }, []);

  const handleReviewPartnerApp = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string, adminNotes?: string) => {
    setIsReviewingPartner(true);
    try {
      await partnersApi.admin.reviewApplication(id, { status, rejectionReason, adminNotes });
      showToast(`Application ${status}`, 'success');
      setShowPartnerAppDetail(false);
      setSelectedPartnerApp(null);
      fetchPartnerApplications();
      fetchPartnerPendingCount();
    } catch (err: any) {
      showToast(err.message || 'Failed to review application', 'error');
    } finally {
      setIsReviewingPartner(false);
    }
  };

  const handleMarkCommissionPaid = async (id: string) => {
    try {
      await partnersApi.admin.markCommissionPaid(id);
      showToast('Commission marked as paid', 'success');
      fetchPartnerCommissions();
    } catch (err: any) {
      showToast(err.message || 'Failed to mark commission as paid', 'error');
    }
  };

  const handleProcessPayout = async (id: string, status: 'completed' | 'rejected', adminNotes?: string, rejectionReason?: string) => {
    try {
      await partnersApi.admin.processPayoutRequest(id, { status, adminNotes, rejectionReason });
      showToast(`Payout ${status}`, 'success');
      fetchPartnerPayouts();
    } catch (err: any) {
      showToast(err.message || 'Failed to process payout', 'error');
    }
  };

  const handleSaveCommissionSettings = async () => {
    if (!commissionSettings) return;
    setIsSavingCommissionSettings(true);
    try {
      await partnersApi.admin.updateCommissionSettings(commissionSettings);
      showToast('Commission settings saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSavingCommissionSettings(false);
    }
  };

  const fetchTestimonials = useCallback(async () => {
    setIsLoadingTestimonials(true);
    try {
      const status = testimonialFilter === 'all' ? undefined : testimonialFilter;
      const data = await testimonialsApi.getAll(status);
      setAllTestimonials(data);
      if (testimonialFilter === 'pending') {
        setPendingTestimonials(data);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
    } finally {
      setIsLoadingTestimonials(false);
    }
  }, [testimonialFilter]);

  const handleTestimonialAction = async (id: string, status: 'approved' | 'rejected', isFeatured?: boolean) => {
    setUpdatingTestimonialId(id);
    try {
      await testimonialsApi.updateStatus(id, status, isFeatured);
      showToast(`Testimonial ${status}`, 'success');
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to update testimonial:', err);
      showToast('Failed to update testimonial', 'error');
    } finally {
      setUpdatingTestimonialId(null);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Testimonial',
      message: 'Are you sure you want to delete this testimonial?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;

    setUpdatingTestimonialId(id);
    try {
      await testimonialsApi.delete(id);
      showToast('Testimonial deleted', 'success');
      fetchTestimonials();
    } catch (err) {
      console.error('Failed to delete testimonial:', err);
      showToast('Failed to delete testimonial', 'error');
    } finally {
      setUpdatingTestimonialId(null);
    }
  };

  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const data = await settingsApi.admin.getSettings();
      setNotifyOnNewPosts(data.notifyUsersOnNewPosts);
      setBroadcastSponsored(data.broadcastSponsoredPosts);
      setPremiumEnabledWeb(data.premiumEnabledWeb);
      setPremiumEnabledMobile(data.premiumEnabledMobile);
      setSettingsLastUpdated(data.updatedAt);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsTogglingNotifications(true);
    try {
      const result = await settingsApi.admin.toggleNewPostNotifications(enabled);
      setNotifyOnNewPosts(result.notifyUsersOnNewPosts);
      setSettingsLastUpdated(result.updatedAt);
      showToast(
        enabled ? 'New post email notifications enabled' : 'New post email notifications disabled',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
      showToast('Failed to update settings', 'error');
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const handleToggleBroadcast = async (enabled: boolean) => {
    setIsTogglingBroadcast(true);
    try {
      const result = await settingsApi.admin.toggleBroadcastSponsored(enabled);
      setBroadcastSponsored(result.broadcastSponsoredPosts);
      setSettingsLastUpdated(result.updatedAt);
      showToast(
        enabled ? 'Broadcast sponsored posts enabled' : 'Broadcast sponsored posts disabled',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle broadcast:', err);
      showToast('Failed to update settings', 'error');
    } finally {
      setIsTogglingBroadcast(false);
    }
  };

  const handleTogglePremiumWeb = async (enabled: boolean) => {
    setIsTogglingPremiumWeb(true);
    try {
      const result = await settingsApi.admin.togglePremiumEnabled('web', enabled);
      setPremiumEnabledWeb(result.premiumEnabledWeb);
      setPremiumEnabledMobile(result.premiumEnabledMobile);
      showToast(
        enabled ? 'Premium features enabled on web' : 'Premium features disabled on web',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle web premium:', err);
      showToast('Failed to update premium settings', 'error');
    } finally {
      setIsTogglingPremiumWeb(false);
    }
  };

  const handleTogglePremiumMobile = async (enabled: boolean) => {
    setIsTogglingPremiumMobile(true);
    try {
      const result = await settingsApi.admin.togglePremiumEnabled('mobile', enabled);
      setPremiumEnabledWeb(result.premiumEnabledWeb);
      setPremiumEnabledMobile(result.premiumEnabledMobile);
      showToast(
        enabled ? 'Premium features enabled on mobile' : 'Premium features disabled on mobile',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle mobile premium:', err);
      showToast('Failed to update premium settings', 'error');
    } finally {
      setIsTogglingPremiumMobile(false);
    }
  };

  // ============================================
  // Admin access guard
  // ============================================

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin') {
        showToast('Access denied. Admin only.', 'error');
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router, showToast]);

  // ============================================
  // Initial data fetch
  // ============================================

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchPendingCount();
      fetchAgentPendingCount();
      fetchPartnerPendingCount();
      fetchSettings();
    }
  }, [user, fetchStats, fetchPendingCount, fetchAgentPendingCount, fetchPartnerPendingCount, fetchSettings]);

  // Fetch users when on users tab or when search/page changes
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'users') {
      fetchUsers();
    }
  }, [user, activeTab, fetchUsers]);

  // Fetch verifications when on verifications tab or when filter changes
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'verifications') {
      fetchVerifications();
    }
  }, [user, activeTab, fetchVerifications]);

  // Fetch agent verifications when on agent-verifications tab or when filter changes
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'agent-verifications') {
      fetchAgentVerifications();
    }
  }, [user, activeTab, fetchAgentVerifications]);

  // Fetch partner data when on partners tab or when filters change
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'partners') {
      fetchPartnerApplications();
      fetchPartnerCommissions();
      fetchPartnerPayouts();
      fetchCommissionSettings();
    }
  }, [user, activeTab, fetchPartnerApplications, fetchPartnerCommissions, fetchPartnerPayouts, fetchCommissionSettings]);

  // Fetch testimonials when on testimonials tab or when filter changes
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'testimonials') {
      fetchTestimonials();
    }
  }, [user, activeTab, fetchTestimonials]);

  // Debounced user search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setUserPage(1);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [userSearch]);

  // ============================================
  // User handlers
  // ============================================

  const handleViewUser = async (adminUser: AdminUser) => {
    setUserDetailLoading(true);
    setShowUserModal(true);
    try {
      const detail = await usersApi.admin.getUserById(adminUser.id);
      setSelectedUser(detail);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      showToast('Failed to load user details', 'error');
      setShowUserModal(false);
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string, verify: boolean) => {
    const action = verify ? 'verify' : 'remove verification from';

    const confirmed = await confirm({
      title: verify ? 'Verify User' : 'Remove Verification',
      message: `Are you sure you want to ${action} this user?`,
      confirmText: verify ? 'Verify' : 'Remove',
      type: !verify ? 'danger' : undefined,
    });

    if (!confirmed) return;

    setUpdatingUserId(userId);
    try {
      await usersApi.admin.updateUser(userId, { isVerified: verify });

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isVerified: verify } : u
      ));

      // Update selected user if viewing
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, isVerified: verify } : null);
      }

      // Update stats
      fetchStats();

      showToast(
        verify ? 'User verified successfully' : 'Verification removed',
        'success'
      );
    } catch (err) {
      console.error('Failed to update user:', err);
      showToast('Failed to update user', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId) || selectedUser;
    const userName = user?.name || 'this user';

    const confirmed = await confirm({
      title: 'Delete User Permanently',
      message: `Are you sure you want to permanently delete ${userName}? This will remove all their posts, comments, messages, and data. This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });

    if (!confirmed) return;

    setDeletingUserId(userId);
    try {
      const result = await usersApi.admin.deleteUser(userId);

      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userId));

      // Close modal if viewing this user
      if (selectedUser?.id === userId) {
        setShowUserModal(false);
        setSelectedUser(null);
      }

      // Update stats
      fetchStats();

      showToast(result.message || 'User deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  // ============================================
  // Verification handlers
  // ============================================

  const handleViewVerification = (v: AdminVerificationRequest) => {
    setSelectedVerification(v);
    setShowVerificationDetail(true);
  };

  const handleReviewVerification = async (
    id: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
    adminNotes?: string
  ) => {
    // Skip extra confirm when rejecting from the detail modal (user already confirmed via the reject form)
    if (status === 'approved' || !rejectionReason) {
      const action = status === 'approved' ? 'approve' : 'reject';
      const confirmed = await confirm({
        title: status === 'approved' ? 'Approve Verification' : 'Reject Verification',
        message: `Are you sure you want to ${action} this verification request?`,
        confirmText: status === 'approved' ? 'Approve' : 'Reject',
        type: status === 'rejected' ? 'danger' : undefined,
      });
      if (!confirmed) return;
    }

    setIsReviewing(true);
    try {
      const updated = await verificationApi.admin.review(id, {
        status,
        rejectionReason,
        adminNotes,
      });

      // Update local state
      setVerifications(prev =>
        prev.map(v => v.id === id ? { ...v, ...updated } : v)
      );

      // Update pending count
      fetchPendingCount();

      // Update stats (verified user count may have changed)
      fetchStats();

      // Close detail modal
      setShowVerificationDetail(false);
      setSelectedVerification(null);

      showToast(
        status === 'approved'
          ? 'Verification approved successfully'
          : 'Verification rejected',
        'success'
      );

      // Refresh the list
      fetchVerifications();
    } catch (err) {
      console.error('Failed to review verification:', err);
      showToast('Failed to process review', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  // ============================================
  // Agent verification handlers
  // ============================================

  const handleViewAgentVerification = (v: AdminAgentVerificationRequest) => {
    setSelectedAgentVerification(v);
    setShowAgentVerificationDetail(true);
  };

  const handleReviewAgentVerification = async (
    id: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
    adminNotes?: string
  ) => {
    // Skip extra confirm when rejecting from the detail modal (user already confirmed via the reject form)
    if (status === 'approved' || !rejectionReason) {
      const action = status === 'approved' ? 'approve' : 'reject';
      const confirmed = await confirm({
        title: status === 'approved' ? 'Approve Agent Verification' : 'Reject Agent Verification',
        message: `Are you sure you want to ${action} this agent verification request?`,
        confirmText: status === 'approved' ? 'Approve' : 'Reject',
        type: status === 'rejected' ? 'danger' : undefined,
      });
      if (!confirmed) return;
    }

    setIsReviewingAgent(true);
    try {
      const updated = await agentVerificationApi.admin.review(id, {
        status,
        rejectionReason,
        adminNotes,
      });

      setAgentVerifications(prev =>
        prev.map(v => v.id === id ? { ...v, ...updated } : v)
      );

      fetchAgentPendingCount();
      fetchStats();

      setShowAgentVerificationDetail(false);
      setSelectedAgentVerification(null);

      showToast(
        status === 'approved'
          ? 'Agent verification approved successfully'
          : 'Agent verification rejected',
        'success'
      );

      fetchAgentVerifications();
    } catch (err) {
      console.error('Failed to review agent verification:', err);
      showToast('Failed to process review', 'error');
    } finally {
      setIsReviewingAgent(false);
    }
  };

  // ============================================
  // Loading state
  // ============================================

  if (authLoading || (isAuthenticated && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  // ============================================
  // Tab definitions
  // ============================================

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verifications', label: 'Verifications', icon: ShieldCheck, badge: pendingCount },
    { id: 'agent-verifications', label: 'Agents', icon: Briefcase, badge: agentPendingCount },
    { id: 'partners', label: 'Partners', icon: Handshake, badge: partnerPendingCount },
    { id: 'posts', label: 'Post', icon: PenSquare },
    { id: 'adverts', label: 'Adverts', icon: Megaphone },
    { id: 'testimonials', label: 'Testimonials', icon: Star },
    { id: 'support', label: 'Support', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Admin
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 hidden sm:block">Manage users and platform</p>
              </div>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 flex items-center justify-center flex-shrink-0">
              <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--lavender-500)]" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-full w-full sm:w-fit overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--pink-400)] text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <OverviewTab
                stats={stats}
                pendingVerificationsCount={pendingCount}
              />
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <UsersTab
                users={users}
                isLoading={isLoadingUsers}
                search={userSearch}
                setSearch={setUserSearch}
                totalUsers={totalUsers}
                page={userPage}
                totalPages={totalPages}
                setPage={setUserPage}
                onViewUser={handleViewUser}
                onVerifyUser={handleVerifyUser}
                updatingUserId={updatingUserId}
              />
            </motion.div>
          )}

          {activeTab === 'verifications' && (
            <motion.div
              key="verifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <VerificationsTab
                verifications={verifications}
                isLoading={isLoadingVerifications}
                filter={verificationFilter}
                setFilter={setVerificationFilter}
                onView={handleViewVerification}
                pendingCount={pendingCount}
              />
            </motion.div>
          )}

          {activeTab === 'agent-verifications' && (
            <motion.div
              key="agent-verifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AgentVerificationsTab
                verifications={agentVerifications}
                isLoading={isLoadingAgentVerifications}
                filter={agentVerificationFilter}
                setFilter={setAgentVerificationFilter}
                onView={handleViewAgentVerification}
                pendingCount={agentPendingCount}
              />
            </motion.div>
          )}

          {activeTab === 'partners' && (
            <motion.div
              key="partners"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PartnersTab
                applications={partnerApplications}
                isLoadingApps={isLoadingPartnerApps}
                appFilter={partnerAppFilter}
                setAppFilter={setPartnerAppFilter}
                pendingCount={partnerPendingCount}
                onViewApp={(app) => { setSelectedPartnerApp(app); setShowPartnerAppDetail(true); }}
                onReviewApp={handleReviewPartnerApp}
                isReviewing={isReviewingPartner}
                selectedApp={selectedPartnerApp}
                showDetail={showPartnerAppDetail}
                onCloseDetail={() => { setShowPartnerAppDetail(false); setSelectedPartnerApp(null); }}
                commissions={partnerCommissions}
                isLoadingCommissions={isLoadingPartnerCommissions}
                commissionFilter={partnerCommissionFilter}
                setCommissionFilter={setPartnerCommissionFilter}
                onMarkPaid={handleMarkCommissionPaid}
                payouts={partnerPayouts}
                isLoadingPayouts={isLoadingPartnerPayouts}
                payoutFilter={partnerPayoutFilter}
                setPayoutFilter={setPartnerPayoutFilter}
                onProcessPayout={handleProcessPayout}
                commissionSettings={commissionSettings}
                setCommissionSettings={setCommissionSettings}
                onSaveCommissionSettings={handleSaveCommissionSettings}
                isSavingCommissionSettings={isSavingCommissionSettings}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PostsTab showToast={showToast} />
            </motion.div>
          )}

          {activeTab === 'adverts' && (
            <motion.div
              key="adverts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdvertsTab showToast={showToast} />
            </motion.div>
          )}

          {activeTab === 'testimonials' && (
            <motion.div
              key="testimonials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TestimonialsTab
                testimonials={allTestimonials}
                isLoading={isLoadingTestimonials}
                filter={testimonialFilter}
                setFilter={setTestimonialFilter}
                onApprove={(id) => handleTestimonialAction(id, 'approved')}
                onReject={(id) => handleTestimonialAction(id, 'rejected')}
                onFeature={(id, featured) => handleTestimonialAction(id, 'approved', featured)}
                onDelete={handleDeleteTestimonial}
                updatingId={updatingTestimonialId}
              />
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SupportTab showToast={showToast} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsTab
                notifyOnNewPosts={notifyOnNewPosts}
                broadcastSponsored={broadcastSponsored}
                premiumEnabledWeb={premiumEnabledWeb}
                premiumEnabledMobile={premiumEnabledMobile}
                isLoading={isLoadingSettings}
                isTogglingNotifications={isTogglingNotifications}
                isTogglingBroadcast={isTogglingBroadcast}
                isTogglingPremiumWeb={isTogglingPremiumWeb}
                isTogglingPremiumMobile={isTogglingPremiumMobile}
                onToggleNotifications={handleToggleNotifications}
                onToggleBroadcast={handleToggleBroadcast}
                onTogglePremiumWeb={handleTogglePremiumWeb}
                onTogglePremiumMobile={handleTogglePremiumMobile}
                lastUpdated={settingsLastUpdated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserModal && (
          <UserDetailModal
            user={selectedUser}
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            onVerify={handleVerifyUser}
            onDelete={handleDeleteUser}
            isUpdating={updatingUserId === selectedUser?.id}
            isDeleting={deletingUserId === selectedUser?.id}
          />
        )}
      </AnimatePresence>

      {/* Verification Detail Modal */}
      <AnimatePresence>
        {showVerificationDetail && selectedVerification && (
          <VerificationDetail
            verification={selectedVerification}
            onClose={() => {
              setShowVerificationDetail(false);
              setSelectedVerification(null);
            }}
            onReview={handleReviewVerification}
            isReviewing={isReviewing}
          />
        )}
      </AnimatePresence>

      {/* Agent Verification Detail Modal */}
      <AnimatePresence>
        {showAgentVerificationDetail && selectedAgentVerification && (
          <AgentVerificationDetail
            verification={selectedAgentVerification}
            onClose={() => {
              setShowAgentVerificationDetail(false);
              setSelectedAgentVerification(null);
            }}
            onReview={handleReviewAgentVerification}
            isReviewing={isReviewingAgent}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay for user detail */}
      {userDetailLoading && showUserModal && !selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)] mx-auto" />
            <p className="text-neutral-600 dark:text-neutral-400 mt-4">Loading user details...</p>
          </div>
        </div>
      )}
    </div>
  );
}
