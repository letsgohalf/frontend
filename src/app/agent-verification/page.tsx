'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Briefcase,
  Home,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Loader2,
  AlertCircle,
  ChevronRight,
  FileText,
  CreditCard,
  Building2,
  MapPinned,
  ScrollText,
  Camera,
  IdCard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import agentVerificationApi, {
  AgentTier,
  AgentDocumentType,
  AgentVerificationStatusResponse,
  AgentVerificationRequest,
} from '@/lib/api/agent-verification';
import AgentBadge from '@/components/AgentBadge';
import { cn } from '@/lib/utils';

// Tier definitions
const tiers = [
  {
    id: 'licensed_pro' as AgentTier,
    icon: Shield,
    label: 'Licensed Professional',
    description: 'Licensed estate surveyors, valuers, and real estate professionals',
    color: 'blue',
    documents: ['ESVARBON License', 'NIESV Certificate', 'LASRERA Certificate'],
  },
  {
    id: 'registered_agent' as AgentTier,
    icon: Briefcase,
    label: 'Registered Agent',
    description: 'Registered real estate agents and agency members',
    color: 'purple',
    documents: ['CAC Registration', 'ERCAAN Membership', 'REDAN Membership'],
  },
  {
    id: 'property_owner' as AgentTier,
    icon: Home,
    label: 'Property Owner',
    description: 'Property owners with documented proof of ownership',
    color: 'amber',
    documents: ['C of O', "Governor's Consent", 'Deed of Assignment', 'Survey Plan', 'Excision & Gazette'],
  },
  {
    id: 'house_owner' as AgentTier,
    icon: Building,
    label: 'House Owner',
    description: 'House owners with available spaces for tenants — verify with your ID and house photos',
    color: 'teal',
    documents: ['Valid ID', 'House Photos'],
  },
];

// Document types per tier
const documentTypesByTier: Record<AgentTier, { id: AgentDocumentType; label: string; icon: React.ElementType; description: string }[]> = {
  licensed_pro: [
    { id: 'esvarbon_license', label: 'ESVARBON License', icon: CreditCard, description: 'Estate Surveyors and Valuers Registration Board of Nigeria' },
    { id: 'niesv_certificate', label: 'NIESV Certificate', icon: FileText, description: 'Nigerian Institution of Estate Surveyors and Valuers' },
    { id: 'lasrera_certificate', label: 'LASRERA Certificate', icon: FileText, description: 'Lagos State Real Estate Regulatory Authority' },
  ],
  registered_agent: [
    { id: 'cac_certificate', label: 'CAC Registration', icon: Building2, description: 'Corporate Affairs Commission registration certificate' },
    { id: 'ercaan_membership', label: 'ERCAAN Membership', icon: CreditCard, description: 'Estate and Rental Consultants Association of Nigeria' },
    { id: 'redan_membership', label: 'REDAN Membership', icon: CreditCard, description: 'Real Estate Developers Association of Nigeria' },
  ],
  property_owner: [
    { id: 'certificate_of_occupancy', label: 'Certificate of Occupancy (C of O)', icon: ScrollText, description: 'Government-issued certificate of land occupancy' },
    { id: 'governors_consent', label: "Governor's Consent", icon: ScrollText, description: "Governor's consent for land transaction" },
    { id: 'deed_of_assignment', label: 'Deed of Assignment', icon: FileText, description: 'Legal deed transferring property ownership' },
    { id: 'survey_plan', label: 'Survey Plan', icon: MapPinned, description: 'Registered survey plan of the property' },
    { id: 'excision_gazette', label: 'Excision & Gazette', icon: ScrollText, description: 'Government excision and gazette publication' },
  ],
  house_owner: [
    { id: 'valid_id', label: 'Valid ID', icon: IdCard, description: 'A valid government-issued ID (NIN, driver\'s license, international passport, voter\'s card)' },
    { id: 'house_photos', label: 'House Photos', icon: Camera, description: 'Clear photos of the house(s) you have available for tenants' },
  ],
};

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
    label: 'Pending Review',
    description: 'Your agent verification is being reviewed. This usually takes 24-48 hours.',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-500/10',
    label: 'Verified',
    description: 'Your agent credentials have been verified successfully.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-500/10',
    label: 'Rejected',
    description: 'Your verification was rejected. You can submit a new request.',
  },
};

export default function AgentVerificationPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, promptAuth } = useAuth();

  const [status, setStatus] = useState<AgentVerificationStatusResponse | null>(null);
  const [history, setHistory] = useState<AgentVerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-step form state
  const [step, setStep] = useState(1); // 1=tier, 2=docType, 3=details, 4=review
  const [selectedTier, setSelectedTier] = useState<AgentTier | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<AgentDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [supportingImage, setSupportingImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // File input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      promptAuth('Sign in to verify as an agent or property owner');
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router, promptAuth]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const [statusData, historyData] = await Promise.all([
          agentVerificationApi.getStatus(),
          agentVerificationApi.getHistory(),
        ]);
        setStatus(statusData);
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to fetch agent verification data:', err);
        setError('Failed to load verification data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const compressImage = async (file: File): Promise<string> => {
    const sizeMB = file.size / (1024 * 1024);
    const maxWidth = sizeMB > 10 ? 800 : sizeMB > 5 ? 1000 : 1200;
    const quality = sizeMB > 10 ? 0.5 : sizeMB > 5 ? 0.6 : 0.7;

    const bitmap = await createImageBitmap(file);

    let width = bitmap.width;
    let height = bitmap.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      throw new Error('Canvas not supported');
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return canvas.toDataURL('image/jpeg', quality);
  };

  const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

  const handleFileChange = async (type: 'front' | 'back' | 'supporting', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setSubmitError('Unsupported image format. Please use a JPEG, PNG, or WebP file.');
      return;
    }
    try {
      const compressed = await compressImage(file);
      if (type === 'front') setFrontImage(compressed);
      else if (type === 'back') setBackImage(compressed);
      else setSupportingImage(compressed);
      setSubmitError(null);
    } catch (err: any) {
      console.error('Failed to compress image:', err);
      setSubmitError(err?.message || 'Failed to process image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedTier || !selectedDocType || !frontImage) {
      setSubmitError('Please complete all required fields');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await agentVerificationApi.submit({
        tier: selectedTier,
        documentType: selectedDocType,
        documentNumber: documentNumber || undefined,
        businessName: businessName || undefined,
        licenseNumber: licenseNumber || undefined,
        documentFrontImage: frontImage,
        documentBackImage: backImage || undefined,
        supportingDocumentImage: supportingImage || undefined,
      });
      const newStatus = await agentVerificationApi.getStatus();
      setStatus(newStatus);
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedTier(null);
    setSelectedDocType(null);
    setDocumentNumber('');
    setBusinessName('');
    setLicenseNumber('');
    setFrontImage(null);
    setBackImage(null);
    setSupportingImage(null);
  };

  const canSubmit = status?.canSubmit ?? false;

  const tierColorClasses = (color: string, selected: boolean) => {
    const base: Record<string, string> = {
      blue: selected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
        : 'border-transparent bg-white/70 dark:bg-neutral-800/70 hover:border-blue-200 dark:hover:border-blue-500/30',
      purple: selected
        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
        : 'border-transparent bg-white/70 dark:bg-neutral-800/70 hover:border-purple-200 dark:hover:border-purple-500/30',
      amber: selected
        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
        : 'border-transparent bg-white/70 dark:bg-neutral-800/70 hover:border-amber-200 dark:hover:border-amber-500/30',
      teal: selected
        ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
        : 'border-transparent bg-white/70 dark:bg-neutral-800/70 hover:border-teal-200 dark:hover:border-teal-500/30',
    };
    return base[color] || base.blue;
  };

  const tierIconBg = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-500/20',
      purple: 'bg-purple-100 dark:bg-purple-500/20',
      amber: 'bg-amber-100 dark:bg-amber-500/20',
      teal: 'bg-teal-100 dark:bg-teal-500/20',
    };
    return map[color] || map.blue;
  };

  const tierIconColor = (color: string) => {
    const map: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      amber: 'text-amber-600 dark:text-amber-400',
      teal: 'text-teal-600 dark:text-teal-400',
    };
    return map[color] || map.blue;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="sticky top-0 z-50 px-5 py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-[var(--peach-200)] dark:border-neutral-800">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <button
            onClick={() => showForm && step > 1 ? setStep(step - 1) : showForm ? (setShowForm(false), resetForm()) : router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Agent / Owner Verification
            </h1>
            {showForm && (
              <p className="text-xs text-neutral-500">Step {step} of 4</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-10">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
            <button onClick={() => router.back()} className="btn-primary mt-4">Go Back</button>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass p-6 mb-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center",
                  status?.isAgentVerified
                    ? "bg-green-100 dark:bg-green-500/10"
                    : status?.hasPendingRequest
                      ? "bg-yellow-100 dark:bg-yellow-500/10"
                      : "bg-[var(--peach-100)] dark:bg-neutral-800"
                )}>
                  {status?.isAgentVerified && status.agentTier ? (
                    <AgentBadge tier={status.agentTier} size="lg" />
                  ) : status?.hasPendingRequest ? (
                    <Clock className="w-8 h-8 text-yellow-600" />
                  ) : (
                    <Briefcase className="w-8 h-8 text-neutral-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {status?.isAgentVerified
                      ? 'You\'re a Verified ' + (
                          status.agentTier === 'licensed_pro' ? 'Licensed Professional'
                          : status.agentTier === 'registered_agent' ? 'Registered Agent'
                          : status.agentTier === 'house_owner' ? 'House Owner'
                          : 'Property Owner')
                      : status?.hasPendingRequest
                        ? 'Verification Pending'
                        : 'Not Verified'}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {status?.isAgentVerified
                      ? 'Your credentials have been verified. You have the agent badge on your profile.'
                      : status?.hasPendingRequest
                        ? 'Your agent verification is being reviewed. This usually takes 24-48 hours.'
                        : 'Verify your professional credentials to build trust with clients.'}
                  </p>
                </div>
              </div>

              {/* Show rejection reason */}
              {status?.latestRequest?.status === 'rejected' && status.latestRequest.rejectionReason && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-500 dark:text-red-300">{status.latestRequest.rejectionReason}</p>
                </div>
              )}

              {canSubmit && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full btn-primary py-4 mt-2"
                >
                  <Briefcase className="w-5 h-5 mr-2 inline" />
                  Get Verified
                </button>
              )}
            </motion.div>

            {/* Multi-step Form */}
            {showForm && canSubmit && (
              <AnimatePresence mode="wait">
                {/* Step 1: Tier Selection */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card-glass p-6 mb-6"
                  >
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      Select Your Category
                    </h3>
                    <p className="text-sm text-neutral-500 mb-5">
                      Choose the category that best describes your professional role.
                    </p>

                    <div className="space-y-3">
                      {tiers.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => {
                            setSelectedTier(tier.id);
                            setSelectedDocType(null);
                          }}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 transition-all text-left",
                            tierColorClasses(tier.color, selectedTier === tier.id)
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", tierIconBg(tier.color))}>
                              <tier.icon className={cn("w-6 h-6", tierIconColor(tier.color))} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{tier.label}</p>
                                {selectedTier === tier.id && (
                                  <CheckCircle2 className="w-5 h-5 text-[var(--teal-500)] flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">{tier.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {tier.documents.map((doc) => (
                                  <span key={doc} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => selectedTier && setStep(2)}
                      disabled={!selectedTier}
                      className={cn(
                        "w-full py-3 rounded-xl font-medium mt-5 flex items-center justify-center gap-2",
                        selectedTier ? "btn-primary" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                      )}
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Document Type Selection */}
                {step === 2 && selectedTier && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card-glass p-6 mb-6"
                  >
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      Select Document Type
                    </h3>
                    <p className="text-sm text-neutral-500 mb-5">
                      Choose which document you want to submit for verification.
                    </p>

                    <div className="space-y-2">
                      {documentTypesByTier[selectedTier].map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDocType(doc.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                            selectedDocType === doc.id
                              ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30 dark:bg-[var(--teal-500)]/10"
                              : "border-transparent bg-white/70 dark:bg-neutral-800/70"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--peach-100)] dark:bg-neutral-700 flex items-center justify-center">
                            <doc.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{doc.label}</p>
                            <p className="text-xs text-neutral-500">{doc.description}</p>
                          </div>
                          {selectedDocType === doc.id && (
                            <CheckCircle2 className="w-5 h-5 text-[var(--teal-500)] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => selectedDocType && setStep(3)}
                      disabled={!selectedDocType}
                      className={cn(
                        "w-full py-3 rounded-xl font-medium mt-5 flex items-center justify-center gap-2",
                        selectedDocType ? "btn-primary" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                      )}
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step 3: Details & Upload */}
                {step === 3 && selectedTier && selectedDocType && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card-glass p-6 mb-6"
                  >
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      Document Details
                    </h3>
                    <p className="text-sm text-neutral-500 mb-5">
                      Provide your document details and upload clear photos.
                    </p>

                    {/* Document/License Number */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                        Document / License Number
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder="Enter your document or license number"
                        className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none focus:border-[var(--teal-500)] text-base text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    {/* License Number (separate field) */}
                    {(selectedDocType === 'esvarbon_license' || selectedDocType === 'niesv_certificate' || selectedDocType === 'lasrera_certificate') && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                          License Number
                        </label>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="Enter your license number"
                          className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none focus:border-[var(--teal-500)] text-base text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                    )}

                    {/* Business Name (CAC only) */}
                    {selectedDocType === 'cac_certificate' && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Enter your registered business name"
                          className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none focus:border-[var(--teal-500)] text-base text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                    )}

                    {/* Image Uploads */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 block">
                        Upload Document Images
                      </label>

                      <input ref={frontInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileChange('front', e)} />
                      <input ref={backInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileChange('back', e)} />
                      <input ref={supportingInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileChange('supporting', e)} />

                      <div className="grid grid-cols-3 gap-3">
                        {/* Front Image — Required */}
                        <div>
                          <button
                            type="button"
                            onClick={() => frontInputRef.current?.click()}
                            className={cn(
                              "w-full aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
                              frontImage
                                ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30"
                                : "border-neutral-300 dark:border-neutral-700 hover:border-[var(--teal-400)]"
                            )}
                          >
                            {frontImage ? (
                              <img src={frontImage} alt="Front" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-neutral-400" />
                                <span className="text-[11px] text-neutral-400 text-center px-1">Front</span>
                              </>
                            )}
                          </button>
                          <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                            Front <span className="text-[var(--pink-400)]">*</span>
                          </p>
                        </div>

                        {/* Back Image — Optional */}
                        <div>
                          <button
                            type="button"
                            onClick={() => backInputRef.current?.click()}
                            className={cn(
                              "w-full aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
                              backImage
                                ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30"
                                : "border-neutral-300 dark:border-neutral-700 hover:border-[var(--teal-400)]"
                            )}
                          >
                            {backImage ? (
                              <img src={backImage} alt="Back" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-neutral-400" />
                                <span className="text-[11px] text-neutral-400 text-center px-1">Back</span>
                              </>
                            )}
                          </button>
                          <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                            Back <span className="text-neutral-400">(optional)</span>
                          </p>
                        </div>

                        {/* Supporting Document — Optional */}
                        <div>
                          <button
                            type="button"
                            onClick={() => supportingInputRef.current?.click()}
                            className={cn(
                              "w-full aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
                              supportingImage
                                ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30"
                                : "border-neutral-300 dark:border-neutral-700 hover:border-[var(--teal-400)]"
                            )}
                          >
                            {supportingImage ? (
                              <img src={supportingImage} alt="Supporting" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-neutral-400" />
                                <span className="text-[11px] text-neutral-400 text-center px-1">Supporting</span>
                              </>
                            )}
                          </button>
                          <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                            Extra <span className="text-neutral-400">(optional)</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                      </div>
                    )}

                    <button
                      onClick={() => frontImage && setStep(4)}
                      disabled={!frontImage}
                      className={cn(
                        "w-full py-3 rounded-xl font-medium mt-2 flex items-center justify-center gap-2",
                        frontImage ? "btn-primary" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                      )}
                    >
                      Review & Submit <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && selectedTier && selectedDocType && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card-glass p-6 mb-6"
                  >
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      Review Your Submission
                    </h3>
                    <p className="text-sm text-neutral-500 mb-5">
                      Please review the details below before submitting.
                    </p>

                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-sm text-neutral-500">Category</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {tiers.find(t => t.id === selectedTier)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-sm text-neutral-500">Document</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {documentTypesByTier[selectedTier].find(d => d.id === selectedDocType)?.label}
                        </span>
                      </div>
                      {documentNumber && (
                        <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                          <span className="text-sm text-neutral-500">Document Number</span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{documentNumber}</span>
                        </div>
                      )}
                      {licenseNumber && (
                        <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                          <span className="text-sm text-neutral-500">License Number</span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{licenseNumber}</span>
                        </div>
                      )}
                      {businessName && (
                        <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
                          <span className="text-sm text-neutral-500">Business Name</span>
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{businessName}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-neutral-500">Images</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {[frontImage, backImage, supportingImage].filter(Boolean).length} uploaded
                        </span>
                      </div>
                    </div>

                    {/* Preview images */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {frontImage && (
                        <div className="aspect-[3/4] rounded-xl overflow-hidden">
                          <img src={frontImage} alt="Front" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {backImage && (
                        <div className="aspect-[3/4] rounded-xl overflow-hidden">
                          <img src={backImage} alt="Back" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {supportingImage && (
                        <div className="aspect-[3/4] rounded-xl overflow-hidden">
                          <img src={supportingImage} alt="Supporting" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {submitError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 btn-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit for Review'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Benefits Section (when not showing form) */}
            {!showForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-glass p-6 mb-6"
              >
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Why Get Agent Verified?
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Shield, label: 'Professional badge on your profile and posts' },
                    { icon: CheckCircle2, label: 'Increased trust from potential clients' },
                    { icon: Briefcase, label: 'Stand out as a verified professional' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--teal-100)] dark:bg-[var(--teal-500)]/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-[var(--teal-600)]" />
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Verification History */}
            {history.length > 0 && !showForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-glass p-6"
              >
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Verification History
                </h3>
                <div className="space-y-3">
                  {history.map((req) => {
                    const sc = statusConfig[req.status];
                    return (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-neutral-800/50"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", sc.bgColor)}>
                          <sc.icon className={cn("w-4 h-4", sc.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {tiers.find(t => t.id === req.tier)?.label || req.tier}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(req.createdAt).toLocaleDateString()} - {sc.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
