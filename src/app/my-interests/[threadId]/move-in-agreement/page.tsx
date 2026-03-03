'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Shield,
  Home,
  Camera,
  X,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Check,
  ThumbsUp,
  ThumbsDown,
  Crown,
  UserPlus,
  FileDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import moveInAgreementsApi, {
  MoveInAgreement,
  SubmitMoveInAgreementData,
  SubmitPosterDetailsData,
} from '@/lib/api/move-in-agreements';
import { cn } from '@/lib/utils';

const RELATIONSHIPS = ['Parent', 'Sibling', 'Spouse', 'Uncle/Aunt', 'Friend', 'Employer', 'Other'];
const DURATIONS = ['3 months', '6 months', '1 year', '2 years', 'Flexible'];

// ─── Reusable field components (defined outside to prevent remounting on re-render) ───

function FieldInput({ label, field, value, onChange, disabled, type = 'text', placeholder, required, errors }: {
  label: string; field: string; value: string; onChange: (field: string, value: any) => void;
  disabled: boolean; type?: string; placeholder?: string; required?: boolean; errors?: Record<string, string>;
}) {
  const error = errors?.[field];
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-neutral-800/50 transition-colors',
          error
            ? 'border-red-300 dark:border-red-500/30 focus:ring-red-500'
            : 'border-neutral-200 dark:border-neutral-700 focus:ring-[var(--teal-500)] focus:border-[var(--teal-500)]',
          disabled && 'opacity-70 cursor-not-allowed',
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FieldSelect({ label, field, value, onChange, disabled, options, required, errors }: {
  label: string; field: string; value: string; onChange: (field: string, value: any) => void;
  disabled: boolean; options: string[] | { value: string; label: string }[]; required?: boolean; errors?: Record<string, string>;
}) {
  const error = errors?.[field];
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-neutral-800/50 transition-colors',
          error ? 'border-red-300 dark:border-red-500/30' : 'border-neutral-200 dark:border-neutral-700',
          disabled && 'opacity-70 cursor-not-allowed',
        )}
      >
        <option value="">Select...</option>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lab = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FieldToggle({ label, field, value, onChange, disabled, description }: {
  label: string; field: string; value: boolean; onChange: (field: string, value: any) => void;
  disabled: boolean; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(field, !value)}
        disabled={disabled}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          value ? 'bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)]' : 'bg-neutral-300 dark:bg-neutral-600',
        )}
      >
        <div className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-[22px]' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      <p className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5">{value || 'N/A'}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--teal-400)] to-[var(--lime-400)] flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{title}</h3>
      </div>
      {badge && (
        <span className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
          badge === 'Submitted' ? 'bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-700)] dark:text-[var(--lime-400)]'
            : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
        )}>
          {badge}
        </span>
      )}
    </div>
  );
}

async function compressImage(file: File): Promise<string> {
  const sizeMB = file.size / (1024 * 1024);
  const maxDim = sizeMB > 10 ? 800 : sizeMB > 5 ? 1000 : 1200;
  const quality = sizeMB > 10 ? 0.5 : sizeMB > 5 ? 0.6 : 0.7;

  const bitmap = await createImageBitmap(file);

  let w = bitmap.width;
  let h = bitmap.height;
  if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
  else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); throw new Error('Canvas not supported'); }

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', quality);
}

export default function MoveInAgreementPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreement, setAgreement] = useState<MoveInAgreement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Review action states
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [landlordNotes, setLandlordNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Poster form data
  const [posterForm, setPosterForm] = useState({
    posterFullName: '',
    posterPhone: '',
    posterEmail: '',
    posterDateOfBirth: '',
    posterOccupation: '',
    posterEmployer: '',
  });

  // Interested party form data
  const [tenantForm, setTenantForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    occupation: '',
    employer: '',
    guarantorFullName: '',
    guarantorPhone: '',
    guarantorEmail: '',
    guarantorAddress: '',
    guarantorRelationship: '',
    guarantorOccupation: '',
    guarantorIdImage: null as string | null,
    preferredMoveInDate: '',
    durationOfStay: '',
    numberOfOccupants: 1,
    hasPets: false,
    petDetails: '',
    isSmoker: false,
    specialRequirements: '',
  });

  const guarantorIdInputRef = useRef<HTMLInputElement>(null);

  const updatePosterForm = useCallback((field: string, value: any) => {
    setPosterForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const updateTenantForm = useCallback((field: string, value: any) => {
    setTenantForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  // Load existing agreement
  useEffect(() => {
    if (!threadId) return;
    moveInAgreementsApi.get(threadId)
      .then((data) => {
        setAgreement(data);

        // Pre-fill poster form
        if (data.posterFullName) {
          setPosterForm({
            posterFullName: data.posterFullName || '',
            posterPhone: data.posterPhone || '',
            posterEmail: data.posterEmail || '',
            posterDateOfBirth: data.posterDateOfBirth ? data.posterDateOfBirth.split('T')[0] : '',
            posterOccupation: data.posterOccupation || '',
            posterEmployer: data.posterEmployer || '',
          });
        } else if (user && user.id === data.landlordId) {
          setPosterForm(prev => ({
            ...prev,
            posterFullName: user.name || '',
            posterPhone: user.phone || '',
            posterEmail: user.email || '',
          }));
        }

        // Pre-fill tenant form
        if (data.fullName) {
          setTenantForm({
            fullName: data.fullName || '',
            phone: data.phone || '',
            email: data.email || '',
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
            occupation: data.occupation || '',
            employer: data.employer || '',
            guarantorFullName: data.guarantorFullName || '',
            guarantorPhone: data.guarantorPhone || '',
            guarantorEmail: data.guarantorEmail || '',
            guarantorAddress: data.guarantorAddress || '',
            guarantorRelationship: data.guarantorRelationship || '',
            guarantorOccupation: data.guarantorOccupation || '',
            guarantorIdImage: null,
            preferredMoveInDate: data.preferredMoveInDate ? data.preferredMoveInDate.split('T')[0] : '',
            durationOfStay: data.durationOfStay || '',
            numberOfOccupants: data.numberOfOccupants || 1,
            hasPets: data.hasPets || false,
            petDetails: data.petDetails || '',
            isSmoker: data.isSmoker || false,
            specialRequirements: data.specialRequirements || '',
          });
        } else if (user && user.id === data.tenantId) {
          setTenantForm(prev => ({
            ...prev,
            fullName: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
          }));
        }
      })
      .catch((err: any) => {
        const msg = err?.message || 'Failed to load agreement';
        showToast(msg, 'error');
      })
      .finally(() => setLoading(false));
  }, [threadId]);

  const isAdmin = user?.role === 'admin';
  const isPoster = agreement?.landlordId === user?.id || isAdmin;
  const isTenant = agreement?.tenantId === user?.id;
  const posterHasSubmitted = !!agreement?.posterSubmittedAt;
  const tenantHasSubmitted = !!agreement?.submittedAt;
  const isApproved = agreement?.status === 'approved';
  const isCompleted = agreement?.status === 'completed';

  // Each party can edit their own section only
  // Poster can edit if they are poster (or admin) and haven't submitted
  const posterCanEdit = isPoster && !posterHasSubmitted && !isApproved;
  // Tenant can edit if they are tenant and haven't submitted
  // Admin can also edit the tenant section on behalf of the tenant
  const tenantCanEdit = (isTenant || isAdmin) && !tenantHasSubmitted && !isApproved;

  // Show poster section: if user is poster, or admin
  const showPosterSection = isPoster || isAdmin;
  // Show tenant section: if user is tenant, or admin
  const showTenantSection = isTenant || isAdmin;

  const validatePosterForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!posterForm.posterFullName.trim()) errs.posterFullName = 'Full name is required';
    if (!posterForm.posterPhone.trim()) errs.posterPhone = 'Phone is required';
    if (!posterForm.posterEmail.trim()) errs.posterEmail = 'Email is required';
    if (!posterForm.posterDateOfBirth) errs.posterDateOfBirth = 'Date of birth is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateTenantForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!tenantForm.fullName.trim()) errs.fullName = 'Full name is required';
    if (!tenantForm.phone.trim()) errs.phone = 'Phone is required';
    if (!tenantForm.email.trim()) errs.email = 'Email is required';
    if (!tenantForm.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    // Guarantor is compulsory
    if (!tenantForm.guarantorFullName.trim()) errs.guarantorFullName = 'Guarantor name is required';
    if (!tenantForm.guarantorPhone.trim()) errs.guarantorPhone = 'Guarantor phone is required';
    if (!tenantForm.guarantorEmail.trim()) errs.guarantorEmail = 'Guarantor email is required';
    if (!tenantForm.guarantorAddress.trim()) errs.guarantorAddress = 'Guarantor address is required';
    if (!tenantForm.guarantorRelationship) errs.guarantorRelationship = 'Relationship is required';
    if (!tenantForm.guarantorOccupation.trim()) errs.guarantorOccupation = 'Guarantor occupation is required';
    if (!tenantForm.guarantorIdImage && !agreement?.guarantorIdImageUrl) errs.guarantorIdImage = 'Guarantor ID photo is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePosterSubmit = async () => {
    if (!validatePosterForm() || submitting) return;
    setSubmitting(true);
    try {
      const data: SubmitPosterDetailsData = {
        posterFullName: posterForm.posterFullName,
        posterPhone: posterForm.posterPhone,
        posterEmail: posterForm.posterEmail,
        posterDateOfBirth: posterForm.posterDateOfBirth,
        posterOccupation: posterForm.posterOccupation || undefined,
        posterEmployer: posterForm.posterEmployer || undefined,
      };
      const result = await moveInAgreementsApi.submitPoster(threadId, data);
      setAgreement(result);
      showToast('Your details have been submitted!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTenantSubmit = async () => {
    if (!validateTenantForm() || submitting) return;
    setSubmitting(true);
    try {
      const data: SubmitMoveInAgreementData = {
        fullName: tenantForm.fullName,
        phone: tenantForm.phone,
        email: tenantForm.email,
        dateOfBirth: tenantForm.dateOfBirth,
        occupation: tenantForm.occupation || undefined,
        employer: tenantForm.employer || undefined,
        guarantorFullName: tenantForm.guarantorFullName,
        guarantorPhone: tenantForm.guarantorPhone,
        guarantorEmail: tenantForm.guarantorEmail,
        guarantorAddress: tenantForm.guarantorAddress,
        guarantorRelationship: tenantForm.guarantorRelationship,
        guarantorOccupation: tenantForm.guarantorOccupation,
        guarantorIdImage: tenantForm.guarantorIdImage || undefined,
        preferredMoveInDate: tenantForm.preferredMoveInDate || undefined,
        durationOfStay: tenantForm.durationOfStay || undefined,
        numberOfOccupants: tenantForm.numberOfOccupants,
        hasPets: tenantForm.hasPets,
        petDetails: tenantForm.petDetails || undefined,
        isSmoker: tenantForm.isSmoker,
        specialRequirements: tenantForm.specialRequirements || undefined,
      };
      const result = await moveInAgreementsApi.submit(threadId, data);
      setAgreement(result);
      showToast('Your details have been submitted!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (action: 'approved' | 'rejected') => {
    if (reviewLoading || !agreement) return;
    setReviewLoading(true);
    try {
      const result = await moveInAgreementsApi.updateStatus(agreement.id, action, landlordNotes || undefined);
      setAgreement(result);
      setReviewAction(null);
      showToast(action === 'approved' ? 'Agreement approved!' : 'Agreement rejected.', action === 'approved' ? 'success' : 'error');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDownloadPartyPdf = async (party: 'poster' | 'tenant') => {
    if (!agreement || downloadingPdf) return;
    setDownloadingPdf(party);
    try {
      const result = await moveInAgreementsApi.getPartyPdf(agreement.id, party);
      window.open(result.pdfUrl, '_blank');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate PDF', 'error');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(file.type)) { showToast('Unsupported format. Please use a JPEG, PNG, or WebP image.', 'error'); return; }
    try {
      const compressed = await compressImage(file);
      updateTenantForm('guarantorIdImage', compressed);
    } catch {
      showToast('Failed to process image', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-300 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Agreement Not Available</h2>
        <p className="text-sm text-neutral-500 mb-6">This thread needs to be matched before a move-in agreement can be created.</p>
        <button onClick={() => router.back()} className="text-sm text-[var(--teal-600)] font-medium">Go Back</button>
      </div>
    );
  }

  // ─── Download PDF button component ───
  const DownloadPdfButton = ({ party, label }: { party: 'poster' | 'tenant'; label: string }) => {
    const hasSubmitted = party === 'poster' ? posterHasSubmitted : tenantHasSubmitted;
    if (!hasSubmitted) return null;
    return (
      <button
        onClick={() => handleDownloadPartyPdf(party)}
        disabled={!!downloadingPdf}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
      >
        {downloadingPdf === party ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
        {label}
      </button>
    );
  };

  // ─── Status banner ───
  const StatusBanner = () => {
    if (agreement.status === 'pending') {
      const oneSubmitted = posterHasSubmitted || tenantHasSubmitted;
      if (!oneSubmitted) return null;
      const who = posterHasSubmitted ? 'Host' : 'Interested party';
      return (
        <div className="p-4 rounded-2xl border mb-6 bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 mt-0.5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Waiting for the other party</p>
              <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-400/70">{who} has submitted. Waiting for the other party to complete their section.</p>
            </div>
          </div>
        </div>
      );
    }

    const config = {
      completed: { icon: Clock, color: 'amber', label: 'Both Parties Submitted', desc: 'The agreement can now be approved.' },
      approved: { icon: CheckCircle, color: 'lime', label: 'Approved', desc: 'This agreement has been approved.' },
      rejected: { icon: XCircle, color: 'red', label: 'Needs Changes', desc: agreement.landlordNotes || 'Changes have been requested.' },
    }[agreement.status];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 rounded-2xl border mb-6',
          config.color === 'lime' && 'bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/5 border-[var(--lime-200)] dark:border-[var(--lime-500)]/20',
          config.color === 'amber' && 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20',
          config.color === 'red' && 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20',
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0',
            config.color === 'lime' && 'text-[var(--lime-600)]',
            config.color === 'amber' && 'text-amber-600',
            config.color === 'red' && 'text-red-600',
          )} />
          <div>
            <p className={cn('text-sm font-semibold',
              config.color === 'lime' && 'text-[var(--lime-700)] dark:text-[var(--lime-400)]',
              config.color === 'amber' && 'text-amber-700 dark:text-amber-400',
              config.color === 'red' && 'text-red-700 dark:text-red-400',
            )}>{config.label}</p>
            <p className={cn('text-xs mt-0.5',
              config.color === 'lime' && 'text-[var(--lime-600)] dark:text-[var(--lime-400)]/70',
              config.color === 'amber' && 'text-amber-600 dark:text-amber-400/70',
              config.color === 'red' && 'text-red-600 dark:text-red-400/70',
            )}>{config.desc}</p>
          </div>
        </div>
        {agreement.pdfUrl && (
          <a href={agreement.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Full PDF
          </a>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Move-In Agreement</h1>
            <p className="text-xs text-neutral-500 truncate">
              {isAdmin ? 'Viewing as Admin — both parties visible' : isPoster ? 'Fill in your details as the host' : 'Fill in your details'}
            </p>
          </div>
          {agreement.pdfUrl && (
            <a href={agreement.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Download className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <StatusBanner />

        {/* ══════════════ POSTER (HOST) SECTION ══════════════ */}
        {showPosterSection && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-glass overflow-hidden">
            <div className="p-5">
              <SectionHeader icon={Crown} title="Host / Poster Details" badge={posterHasSubmitted ? 'Submitted' : 'Pending'} />

              {posterHasSubmitted && !posterCanEdit ? (
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField label="Full Name" value={agreement.posterFullName} />
                    <ReadOnlyField label="Phone" value={agreement.posterPhone} />
                    <ReadOnlyField label="Email" value={agreement.posterEmail} />
                    <ReadOnlyField label="Date of Birth" value={agreement.posterDateOfBirth ? new Date(agreement.posterDateOfBirth).toLocaleDateString() : null} />
                    <ReadOnlyField label="Occupation" value={agreement.posterOccupation} />
                    <ReadOnlyField label="Employer" value={agreement.posterEmployer} />
                  </div>
                  <DownloadPdfButton party="poster" label="Download My Details (PDF)" />
                </div>
              ) : (
                <div className="space-y-3">
                  <FieldInput label="Full Name" field="posterFullName" value={posterForm.posterFullName} onChange={updatePosterForm} disabled={!posterCanEdit} placeholder="Enter your full name" required errors={errors} />
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="Phone Number" field="posterPhone" value={posterForm.posterPhone} onChange={updatePosterForm} disabled={!posterCanEdit} type="tel" placeholder="+234..." required errors={errors} />
                    <FieldInput label="Email" field="posterEmail" value={posterForm.posterEmail} onChange={updatePosterForm} disabled={!posterCanEdit} type="email" placeholder="you@email.com" required errors={errors} />
                  </div>
                  <FieldInput label="Date of Birth" field="posterDateOfBirth" value={posterForm.posterDateOfBirth} onChange={updatePosterForm} disabled={!posterCanEdit} type="date" required errors={errors} />
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="Occupation" field="posterOccupation" value={posterForm.posterOccupation} onChange={updatePosterForm} disabled={!posterCanEdit} placeholder="e.g. Software Developer" errors={errors} />
                    <FieldInput label="Employer" field="posterEmployer" value={posterForm.posterEmployer} onChange={updatePosterForm} disabled={!posterCanEdit} placeholder="Company name" errors={errors} />
                  </div>
                  {posterCanEdit && (
                    <button onClick={handlePosterSubmit} disabled={submitting}
                      className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-sm font-semibold text-white hover:shadow-lg hover:shadow-[var(--teal-500)]/20 transition-all flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Submit My Details
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════ INTERESTED PARTY SECTION ══════════════ */}
        {showTenantSection && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-glass overflow-hidden">
            <div className="p-5">
              <SectionHeader icon={UserPlus} title="Interested Party Details" badge={tenantHasSubmitted ? 'Submitted' : 'Pending'} />

              {tenantHasSubmitted && !tenantCanEdit ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Personal Info</p>
                    <div className="grid grid-cols-2 gap-3">
                      <ReadOnlyField label="Full Name" value={agreement.fullName} />
                      <ReadOnlyField label="Phone" value={agreement.phone} />
                      <ReadOnlyField label="Email" value={agreement.email} />
                      <ReadOnlyField label="Date of Birth" value={agreement.dateOfBirth ? new Date(agreement.dateOfBirth).toLocaleDateString() : null} />
                      <ReadOnlyField label="Occupation" value={agreement.occupation} />
                      <ReadOnlyField label="Employer" value={agreement.employer} />
                    </div>
                  </div>
                  {agreement.guarantorFullName && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Guarantor</p>
                      <div className="grid grid-cols-2 gap-3">
                        <ReadOnlyField label="Full Name" value={agreement.guarantorFullName} />
                        <ReadOnlyField label="Phone" value={agreement.guarantorPhone} />
                        <ReadOnlyField label="Email" value={agreement.guarantorEmail} />
                        <ReadOnlyField label="Relationship" value={agreement.guarantorRelationship} />
                        <ReadOnlyField label="Occupation" value={agreement.guarantorOccupation} />
                        <ReadOnlyField label="Address" value={agreement.guarantorAddress} />
                      </div>
                      {agreement.guarantorIdImageUrl && (
                        <img src={agreement.guarantorIdImageUrl} alt="Guarantor ID" className="mt-3 w-full max-w-xs h-40 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700" />
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] mb-2 flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Move-In Preferences</p>
                    <div className="grid grid-cols-2 gap-3">
                      <ReadOnlyField label="Move-In Date" value={agreement.preferredMoveInDate ? new Date(agreement.preferredMoveInDate).toLocaleDateString() : 'Flexible'} />
                      <ReadOnlyField label="Duration" value={agreement.durationOfStay} />
                      <ReadOnlyField label="Occupants" value={agreement.numberOfOccupants?.toString()} />
                      <ReadOnlyField label="Pets" value={agreement.hasPets ? (agreement.petDetails || 'Yes') : 'None'} />
                      <ReadOnlyField label="Smoker" value={agreement.isSmoker ? 'Yes' : 'No'} />
                    </div>
                    {agreement.specialRequirements && <div className="mt-2"><ReadOnlyField label="Special Requirements" value={agreement.specialRequirements} /></div>}
                  </div>
                  <DownloadPdfButton party="tenant" label="Download My Details (PDF)" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Personal Info */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Personal Info</p>
                    <FieldInput label="Full Name" field="fullName" value={tenantForm.fullName} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="Enter your full name" required errors={errors} />
                    <div className="grid grid-cols-2 gap-3">
                      <FieldInput label="Phone Number" field="phone" value={tenantForm.phone} onChange={updateTenantForm} disabled={!tenantCanEdit} type="tel" placeholder="+234..." required errors={errors} />
                      <FieldInput label="Email" field="email" value={tenantForm.email} onChange={updateTenantForm} disabled={!tenantCanEdit} type="email" placeholder="you@email.com" required errors={errors} />
                    </div>
                    <FieldInput label="Date of Birth" field="dateOfBirth" value={tenantForm.dateOfBirth} onChange={updateTenantForm} disabled={!tenantCanEdit} type="date" required errors={errors} />
                    <div className="grid grid-cols-2 gap-3">
                      <FieldInput label="Occupation" field="occupation" value={tenantForm.occupation} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="e.g. Software Developer" errors={errors} />
                      <FieldInput label="Employer" field="employer" value={tenantForm.employer} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="Company name" errors={errors} />
                    </div>
                  </div>

                  {/* Guarantor */}
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Guarantor <span className="text-red-400 font-normal">(required)</span></p>
                    <FieldInput label="Guarantor Full Name" field="guarantorFullName" value={tenantForm.guarantorFullName} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="Full name" required errors={errors} />
                    <div className="grid grid-cols-2 gap-3">
                      <FieldInput label="Phone" field="guarantorPhone" value={tenantForm.guarantorPhone} onChange={updateTenantForm} disabled={!tenantCanEdit} type="tel" placeholder="+234..." required errors={errors} />
                      <FieldInput label="Email" field="guarantorEmail" value={tenantForm.guarantorEmail} onChange={updateTenantForm} disabled={!tenantCanEdit} type="email" placeholder="email@..." required errors={errors} />
                    </div>
                    <FieldSelect label="Relationship" field="guarantorRelationship" value={tenantForm.guarantorRelationship} onChange={updateTenantForm} disabled={!tenantCanEdit} options={RELATIONSHIPS} required errors={errors} />
                    <FieldInput label="Occupation" field="guarantorOccupation" value={tenantForm.guarantorOccupation} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="e.g. Civil Servant" required errors={errors} />
                    <FieldInput label="Address" field="guarantorAddress" value={tenantForm.guarantorAddress} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="Home or office address" required errors={errors} />
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Guarantor ID Photo <span className="text-red-400">*</span></label>
                      <input ref={guarantorIdInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                      {tenantForm.guarantorIdImage ? (
                        <div className="relative">
                          <img src={tenantForm.guarantorIdImage} alt="Uploaded" className="w-full h-40 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700" />
                          {tenantCanEdit && (
                            <button onClick={() => updateTenantForm('guarantorIdImage', null)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : agreement.guarantorIdImageUrl ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--lime-50)] dark:bg-[var(--lime-500)]/5 border border-[var(--lime-200)] dark:border-[var(--lime-500)]/20">
                          <Check className="w-4 h-4 text-[var(--lime-600)]" />
                          <span className="text-xs text-[var(--lime-700)] dark:text-[var(--lime-400)]">Document uploaded</span>
                        </div>
                      ) : tenantCanEdit ? (
                        <button onClick={() => guarantorIdInputRef.current?.click()}
                          className="w-full py-6 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-[var(--teal-400)] dark:hover:border-[var(--teal-500)] transition-colors flex flex-col items-center gap-2 text-neutral-400 hover:text-[var(--teal-600)]">
                          <Camera className="w-6 h-6" />
                          <span className="text-xs font-medium">Tap to upload photo</span>
                        </button>
                      ) : (
                        <p className="text-xs text-neutral-400 italic">No document uploaded</p>
                      )}
                      {errors.guarantorIdImage && <p className="text-[11px] text-red-500 mt-1">{errors.guarantorIdImage}</p>}
                    </div>
                  </div>

                  {/* Move-In Preferences */}
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-[var(--teal-600)] dark:text-[var(--teal-400)] flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Move-In Preferences</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldInput label="Preferred Move-In Date" field="preferredMoveInDate" value={tenantForm.preferredMoveInDate} onChange={updateTenantForm} disabled={!tenantCanEdit} type="date" errors={errors} />
                      <FieldSelect label="Duration of Stay" field="durationOfStay" value={tenantForm.durationOfStay} onChange={updateTenantForm} disabled={!tenantCanEdit} options={DURATIONS} errors={errors} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Number of Occupants</label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => tenantCanEdit && tenantForm.numberOfOccupants > 1 && updateTenantForm('numberOfOccupants', tenantForm.numberOfOccupants - 1)}
                          disabled={!tenantCanEdit}
                          className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">-</button>
                        <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 w-8 text-center">{tenantForm.numberOfOccupants}</span>
                        <button type="button" onClick={() => tenantCanEdit && updateTenantForm('numberOfOccupants', tenantForm.numberOfOccupants + 1)}
                          disabled={!tenantCanEdit}
                          className="w-9 h-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800">+</button>
                      </div>
                    </div>
                    <FieldToggle label="Do you have pets?" field="hasPets" value={tenantForm.hasPets} onChange={updateTenantForm} disabled={!tenantCanEdit} />
                    {tenantForm.hasPets && (
                      <FieldInput label="Pet Details" field="petDetails" value={tenantForm.petDetails} onChange={updateTenantForm} disabled={!tenantCanEdit} placeholder="e.g. 1 dog (medium size)" errors={errors} />
                    )}
                    <FieldToggle label="Are you a smoker?" field="isSmoker" value={tenantForm.isSmoker} onChange={updateTenantForm} disabled={!tenantCanEdit} />
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Special Requirements</label>
                      <textarea value={tenantForm.specialRequirements} onChange={(e) => updateTenantForm('specialRequirements', e.target.value)}
                        disabled={!tenantCanEdit} placeholder="Any special requirements or notes..." rows={3}
                        className={cn('w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-neutral-800/50 transition-colors resize-none border-neutral-200 dark:border-neutral-700', !tenantCanEdit && 'opacity-70 cursor-not-allowed')} />
                    </div>
                  </div>

                  {tenantCanEdit && (
                    <button onClick={handleTenantSubmit} disabled={submitting}
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-sm font-semibold text-white hover:shadow-lg hover:shadow-[var(--teal-500)]/20 transition-all flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Submit My Details
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════ APPROVE / REJECT ══════════════ */}
        {(isPoster || isAdmin) && isCompleted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glass overflow-hidden">
            <div className="p-5">
              {reviewAction ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {reviewAction === 'approve' ? 'Approve this agreement?' : 'Reject this agreement?'}
                  </p>
                  <textarea value={landlordNotes} onChange={(e) => setLandlordNotes(e.target.value)}
                    placeholder={reviewAction === 'approve' ? 'Optional notes...' : 'Reason for rejection (optional)...'}
                    rows={2} className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800/50" />
                  <div className="flex gap-2">
                    <button onClick={() => setReviewAction(null)}
                      className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={() => handleReview(reviewAction === 'approve' ? 'approved' : 'rejected')}
                      disabled={reviewLoading}
                      className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2',
                        reviewAction === 'approve' ? 'bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] hover:shadow-md' : 'bg-red-500 hover:bg-red-600')}>
                      {reviewLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setReviewAction('reject')}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2">
                    <ThumbsDown className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => setReviewAction('approve')}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--teal-500)] to-[var(--lime-500)] text-sm font-semibold text-white hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <ThumbsUp className="w-4 h-4" /> Approve
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
