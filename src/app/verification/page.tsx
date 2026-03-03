'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Camera,
  FileText,
  CreditCard,
  Loader2,
  AlertCircle,
  ChevronRight,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import verificationApi, {
  VerificationDocumentType,
  VerificationStatusResponse,
  VerificationRequest
} from '@/lib/api/verification';
import { cn } from '@/lib/utils';

const documentTypes = [
  { id: 'nin' as const, label: 'National ID (NIN)', icon: CreditCard, description: 'Nigerian National Identity Number slip or card' },
  { id: 'drivers_license' as const, label: "Driver's License", icon: CreditCard, description: 'Valid Nigerian driving license' },
  { id: 'passport' as const, label: 'International Passport', icon: FileText, description: 'Valid Nigerian passport' },
  { id: 'voters_card' as const, label: "Voter's Card", icon: CreditCard, description: 'Permanent Voter Card (PVC)' },
];

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/10',
    label: 'Pending Review',
    description: 'Your verification is being reviewed. This usually takes 24-48 hours.'
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-500/10',
    label: 'Verified',
    description: 'Your identity has been verified successfully.'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-500/10',
    label: 'Rejected',
    description: 'Your verification was rejected. You can submit a new request.'
  },
};

export default function VerificationPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, promptAuth } = useAuth();

  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [history, setHistory] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // File input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      promptAuth('Sign in to verify your identity');
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router, promptAuth]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const [statusData, historyData] = await Promise.all([
          verificationApi.getStatus(),
          verificationApi.getHistory(),
        ]);
        setStatus(statusData);
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to fetch verification data:', err);
        setError('Failed to load verification data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleImageUpload = (type: 'front' | 'back' | 'selfie') => {
    // Trigger the appropriate file input
    if (type === 'front') frontInputRef.current?.click();
    else if (type === 'back') backInputRef.current?.click();
    else selfieInputRef.current?.click();
  };

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

  const handleFileChange = async (type: 'front' | 'back' | 'selfie', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_TYPES.includes(file.type)) {
      setSubmitError('Unsupported image format. Please use a JPEG, PNG, or WebP file.');
      return;
    }

    try {
      // Compress: max 1200px wide, 70% JPEG quality → typically < 200KB
      const compressed = await compressImage(file);

      if (type === 'front') setFrontImage(compressed);
      else if (type === 'back') setBackImage(compressed);
      else setSelfieImage(compressed);
      setSubmitError(null);
    } catch (err: any) {
      console.error('Failed to compress image:', err);
      setSubmitError(err?.message || 'Failed to process image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedDocType || !frontImage || !selfieImage) {
      setSubmitError('Please select a document type, upload the front of your ID, and take a selfie holding your document');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await verificationApi.submit({
        documentType: selectedDocType,
        documentNumber: documentNumber || undefined,
        documentFrontImage: frontImage,
        documentBackImage: backImage || undefined,
        selfieImage: selfieImage || undefined,
      });

      // Refresh status
      const newStatus = await verificationApi.getStatus();
      setStatus(newStatus);
      setShowForm(false);

      // Reset form
      setSelectedDocType(null);
      setDocumentNumber('');
      setFrontImage(null);
      setBackImage(null);
      setSelfieImage(null);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !status?.isVerified && !status?.hasPendingRequest;

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
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Identity Verification
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-10">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
            <button onClick={() => router.back()} className="btn-primary mt-4">
              Go Back
            </button>
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
                  status?.isVerified
                    ? "bg-green-100 dark:bg-green-500/10"
                    : status?.hasPendingRequest
                      ? "bg-yellow-100 dark:bg-yellow-500/10"
                      : "bg-[var(--peach-100)] dark:bg-neutral-800"
                )}>
                  {status?.isVerified ? (
                    <BadgeCheck className="w-8 h-8 text-green-600" />
                  ) : status?.hasPendingRequest ? (
                    <Clock className="w-8 h-8 text-yellow-600" />
                  ) : (
                    <Shield className="w-8 h-8 text-neutral-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {status?.isVerified
                      ? 'You\'re Verified!'
                      : status?.hasPendingRequest
                        ? 'Verification Pending'
                        : 'Not Verified'}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {status?.isVerified
                      ? 'Your identity has been verified. You have full access to all features.'
                      : status?.hasPendingRequest
                        ? 'Your verification is being reviewed. This usually takes 24-48 hours.'
                        : 'Verify your identity to build trust and unlock all features.'}
                  </p>
                </div>
              </div>

              {canSubmit && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full btn-primary py-4 mt-2"
                >
                  <Shield className="w-5 h-5 mr-2 inline" />
                  Start Verification
                </button>
              )}
            </motion.div>

            {/* Verification Form */}
            {showForm && canSubmit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-glass p-6 mb-6"
              >
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Submit Verification
                </h3>

                {/* Document Type Selection */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-neutral-500 mb-3 block">
                    Select Document Type
                  </label>
                  <div className="space-y-2">
                    {documentTypes.map((doc) => (
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
                          <CheckCircle2 className="w-5 h-5 text-[var(--teal-500)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Number */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-neutral-500 mb-2 block">
                    Document Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Enter your document number"
                    className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 outline-none focus:border-[var(--teal-500)] text-base text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Image Uploads */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-neutral-500 mb-3 block">
                    Upload Document Images
                  </label>

                  {/* Hidden file inputs */}
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange('front', e)}
                  />
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange('back', e)}
                  />
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFileChange('selfie', e)}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    {/* Front Image — Required */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleImageUpload('front')}
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
                            <span className="text-[11px] text-neutral-400 text-center px-1">Front of ID</span>
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
                        onClick={() => handleImageUpload('back')}
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
                            <span className="text-[11px] text-neutral-400 text-center px-1">Back of ID</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                        Back <span className="text-neutral-400">(optional)</span>
                      </p>
                    </div>

                    {/* Selfie with Card — Required */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleImageUpload('selfie')}
                        className={cn(
                          "w-full aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden",
                          selfieImage
                            ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30"
                            : "border-neutral-300 dark:border-neutral-700 hover:border-[var(--teal-400)]"
                        )}
                      >
                        {selfieImage ? (
                          <img src={selfieImage} alt="Selfie with ID" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6 text-neutral-400" />
                            <span className="text-[11px] text-neutral-400 text-center px-1">You + ID</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                        Selfie <span className="text-[var(--pink-400)]">*</span>
                      </p>
                    </div>
                  </div>

                  {/* Selfie explanation */}
                  <div className="mt-3 p-3 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800/70 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[var(--teal-600)] dark:text-[var(--teal-400)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      <strong className="text-neutral-800 dark:text-neutral-200">Selfie with ID</strong> — Take a photo of yourself clearly holding your document next to your face. This proves the ID belongs to you.
                    </p>
                  </div>
                </div>

                {submitError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedDocType || !frontImage || !selfieImage || isSubmitting}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2",
                      selectedDocType && frontImage && selfieImage && !isSubmitting
                        ? "btn-primary"
                        : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Benefits */}
            {!status?.isVerified && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-glass p-6 mb-6"
              >
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Why Verify?
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Build Trust', description: 'Verified profiles get 3x more responses' },
                    { title: 'Priority Matching', description: 'Get matched with other verified users first' },
                    { title: 'Secure Badge', description: 'Display a verification badge on your profile' },
                    { title: 'Full Access', description: 'Unlock all messaging and connection features' },
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--lime-200)] dark:bg-[var(--lime-500)]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-[var(--lime-600)]" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{benefit.title}</p>
                        <p className="text-sm text-neutral-500">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Verification History */}
            {history.length > 0 && (
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
                  {history.map((request) => {
                    const config = statusConfig[request.status];
                    const StatusIcon = config.icon;
                    return (
                      <div
                        key={request.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/50 dark:bg-neutral-800/50"
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                          <StatusIcon className={cn("w-5 h-5", config.color)} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                            {documentTypes.find(d => d.id === request.documentType)?.label || request.documentType}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(request.createdAt).toLocaleDateString('en-NG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={cn("text-xs font-medium", config.color)}>
                          {config.label}
                        </span>
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
