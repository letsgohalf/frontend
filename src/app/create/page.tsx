'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Image,
  MapPin,
  DollarSign,
  Users,
  X,
  Camera,
  Home,
  Building2,
  Bed,
  Check,
  Loader2,
  Sparkles,
  Shield,
  Globe,
  Target,
  Repeat2,
  ShoppingBasket,
  Handshake,
  CheckCircle2,
  XCircle,
  Car,
  Navigation,
  Clock,
  CreditCard,
  Video,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/AppLayout';
import VerificationRequiredModal from '@/components/VerificationRequiredModal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import postsApi, { CreatePostData } from '@/lib/api/posts';
import partnersApi from '@/lib/api/partners';
import authApi from '@/lib/api/auth';
import apiClient from '@/lib/api/client';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import PreferredLocationsModal from '@/components/PreferredLocationsModal';
import { useToast } from '@/contexts/ToastContext';
import { playSound } from '@/lib/sounds';
import { containsPhoneNumber, PHONE_NUMBER_ERROR } from '@/lib/utils/content-filter';

// Post type options
const postTypes = [
  {
    id: 'looking-for-roommate',
    icon: Users,
    label: 'Looking for Roommate',
    description: 'I have a place and need someone to share it with',
    color: 'peach'
  },
  {
    id: 'looking-for-place',
    icon: Building2,
    label: 'Looking for Place',
    description: "I need a place to stay and I'm open to sharing",
    color: 'lavender'
  },
  {
    id: 'have-spare-room',
    icon: Bed,
    label: 'Have Spare Room',
    description: 'I have an extra room available for rent',
    color: 'lime'
  },
  {
    id: 'subscription-split',
    icon: Repeat2,
    label: 'Split Subscription',
    description: 'Split Netflix, Spotify, etc. with others',
    color: 'violet'
  },
  {
    id: 'grocery-split',
    icon: ShoppingBasket,
    label: 'Split Groceries',
    description: 'Split bulk buys like food, livestock, etc.',
    color: 'green'
  },
  {
    id: 'carpool-offer',
    icon: Car,
    label: 'Offer a Ride',
    description: 'I have a car and want to share my ride',
    color: 'sky'
  },
  {
    id: 'carpool-request',
    icon: Navigation,
    label: 'Find a Ride',
    description: "I need a ride and I'm willing to share cost",
    color: 'amber'
  },
];

// Budget presets with numeric values
const budgetPresets = [
  { label: '$50 - 100', value: 75 },
  { label: '$100 - 250', value: 175 },
  { label: '$250 - 500', value: 375 },
  { label: '$500 - 1,000', value: 750 },
  { label: '$1,000+', value: 1500 },
];

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user, promptAuth } = useAuth();
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetLabel, setBudgetLabel] = useState('');
  const [spots, setSpots] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [video, setVideo] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionName, setSubscriptionName] = useState('');
  const [subscriptionTotalCost, setSubscriptionTotalCost] = useState<number | null>(null);
  const [groceryItemName, setGroceryItemName] = useState('');
  const [groceryTotalCost, setGroceryTotalCost] = useState<number | null>(null);
  // Carpool state
  const [carpoolOriginData, setCarpoolOriginData] = useState<LocationResult | null>(null);
  const [carpoolDestinationData, setCarpoolDestinationData] = useState<LocationResult | null>(null);
  const [carpoolMeetupPoint, setCarpoolMeetupPoint] = useState('');
  const [carpoolDepartureTime, setCarpoolDepartureTime] = useState('');
  const [carpoolCarType, setCarpoolCarType] = useState('');
  const [carpoolSeatsAvailable, setCarpoolSeatsAvailable] = useState(1);
  const [carpoolCostPerSeat, setCarpoolCostPerSeat] = useState<number | null>(null);
  const [carpoolPaymentMode, setCarpoolPaymentMode] = useState('');
  const [carpoolIsScheduled, setCarpoolIsScheduled] = useState(false);

  const [visibility, setVisibility] = useState<'everyone' | 'verified-only'>('everyone');
  const [visibleRadiusKm, setVisibleRadiusKm] = useState<number | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralPartnerName, setReferralPartnerName] = useState('');
  const [validatingReferral, setValidatingReferral] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const referralTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      promptAuth('Sign in to create a post and find your perfect roommate');
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router, promptAuth]);

  // Pre-select post type from query params
  useEffect(() => {
    const type = searchParams.get('type');
    if (!type) return;

    const typeMap: Record<string, string> = {
      'house-listing': 'have-spare-room',
      'looking-for-roommate': 'looking-for-roommate',
    };

    if (type === 'subscription-split') {
      setSelectedType('subscription-split');
      return;
    }

    if (type === 'grocery-split') {
      setSelectedType('grocery-split');
      return;
    }

    if (type === 'carpool-offer') {
      setSelectedType('carpool-offer');
      return;
    }

    if (type === 'carpool-request') {
      setSelectedType('carpool-request');
      return;
    }

    const mapped = typeMap[type];
    if (mapped) {
      setSelectedType(mapped);
    }
  }, [searchParams, showToast]);

  // Auto-fill referral code from URL (?ref=) or localStorage (30-day expiry)
  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    let refFromStorage: string | null = null;
    try {
      const raw = localStorage.getItem('partner-referral-code');
      if (raw) {
        const data = JSON.parse(raw);
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        if (data.code && Date.now() - data.timestamp < THIRTY_DAYS) {
          refFromStorage = data.code;
        } else {
          localStorage.removeItem('partner-referral-code');
        }
      }
    } catch {}
    const code = refFromUrl?.trim() || refFromStorage?.trim();
    if (code && !referralCode) {
      handleReferralCodeChange(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounced referral code validation
  const handleReferralCodeChange = (value: string) => {
    setReferralCode(value);
    setReferralValid(null);
    setReferralPartnerName('');
    if (referralTimeoutRef.current) clearTimeout(referralTimeoutRef.current);
    if (value.trim().length >= 7) {
      setValidatingReferral(true);
      referralTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await partnersApi.validateReferral(value.trim());
          setReferralValid(result.valid);
          if (result.valid && result.partnerName) setReferralPartnerName(result.partnerName);
        } catch {
          setReferralValid(false);
        } finally {
          setValidatingReferral(false);
        }
      }, 500);
    }
  };

  const handleMediaClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (!user?.isVerified) {
      setShowVerificationModal(true);
      return;
    }
    inputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          setError('Image must be under 5MB');
          continue;
        }
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }

        const result = await apiClient.uploadFile<{ url: string }>('/upload/image', file, { folder: 'posts' });
        setImages(prev => [...prev, result.url]);
        setImageFiles(prev => [...prev, file]);
      }
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('Video must be under 25MB');
      return;
    }
    if (!file.type.startsWith('video/')) {
      setError('Only video files are allowed');
      return;
    }

    setUploadingVideo(true);
    setError(null);

    try {
      const result = await apiClient.uploadFile<{ url: string }>('/upload/video', file, { folder: 'posts' });
      setVideo(result.url);
    } catch (err: any) {
      console.error('Failed to upload video:', err);
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const isSubscriptionSplit = selectedType === 'subscription-split';
  const isGrocerySplit = selectedType === 'grocery-split';
  const isCarpoolOffer = selectedType === 'carpool-offer';
  const isCarpoolRequest = selectedType === 'carpool-request';
  const isCarpool = isCarpoolOffer || isCarpoolRequest;
  const canSubmit = selectedType && content.trim().length >= 20 && (
    isSubscriptionSplit
      ? (subscriptionName && subscriptionTotalCost && subscriptionTotalCost > 0)
      : isGrocerySplit
      ? (groceryItemName && groceryTotalCost && groceryTotalCost > 0)
      : isCarpool
      ? (carpoolOriginData && carpoolDestinationData)
      : (location && budget)
  );

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    // Verification gate for subscription-split, grocery-split, and carpool
    if ((isSubscriptionSplit || isGrocerySplit || isCarpool) && !user?.isVerified) {
      setShowVerificationModal(true);
      return;
    }

    // Block phone numbers in post content
    if (containsPhoneNumber(content)) {
      setError(PHONE_NUMBER_ERROR);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const postData: CreatePostData = {
        content: content.trim(),
        location: isSubscriptionSplit ? '' : isCarpool ? (carpoolOriginData?.name || '') : (locationData?.name || location),
        latitude: isSubscriptionSplit ? undefined : isCarpool ? carpoolOriginData?.latitude : locationData?.latitude,
        longitude: isSubscriptionSplit ? undefined : isCarpool ? carpoolOriginData?.longitude : locationData?.longitude,
        budget: (isSubscriptionSplit || isGrocerySplit) ? 0 : isCarpool ? (carpoolCostPerSeat || 0) : budget!,
        spotsAvailable: isCarpool ? (isCarpoolOffer ? carpoolSeatsAvailable : 1) : spots,
        postType: selectedType as CreatePostData['postType'],
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
        visibility,
        visibleRadiusKm: visibleRadiusKm ?? undefined,
        ...(isSubscriptionSplit ? {
          subscriptionName,
          subscriptionTotalCost: subscriptionTotalCost!,
          subscriptionCostPerPerson: Math.ceil(subscriptionTotalCost! / (spots + 1)),
        } : {}),
        ...(isGrocerySplit ? {
          groceryItemName,
          groceryTotalCost: groceryTotalCost!,
          groceryCostPerPerson: Math.ceil(groceryTotalCost! / (spots + 1)),
        } : {}),
        ...(isCarpool ? {
          carpoolOrigin: carpoolOriginData?.name,
          carpoolOriginLat: carpoolOriginData?.latitude,
          carpoolOriginLng: carpoolOriginData?.longitude,
          carpoolDestination: carpoolDestinationData?.name,
          carpoolDestinationLat: carpoolDestinationData?.latitude,
          carpoolDestinationLng: carpoolDestinationData?.longitude,
          ...(carpoolMeetupPoint ? { carpoolMeetupPoint } : {}),
          ...(carpoolIsScheduled && carpoolDepartureTime ? { carpoolDepartureTime } : {}),
          ...(isCarpoolOffer && carpoolCarType ? { carpoolCarType } : {}),
          ...(isCarpoolOffer ? { carpoolSeatsAvailable } : {}),
          ...(carpoolCostPerSeat ? { carpoolCostPerSeat } : {}),
          ...(carpoolPaymentMode ? { carpoolPaymentMode } : {}),
          carpoolIsScheduled,
        } : {}),
        ...(referralCode.trim() && referralValid ? { referralCode: referralCode.trim() } : {}),
      };

      await postsApi.createPost(postData);
      playSound('success');

      // If user hasn't set preferred locations, prompt them
      const hasPreferredLocations = user?.preferredLocations && user.preferredLocations.length > 0;
      if (!hasPreferredLocations) {
        setShowLocationsModal(true);
        return;
      }

      // Success - redirect to home
      router.push('/');
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBudgetSelect = (preset: typeof budgetPresets[0]) => {
    setBudget(preset.value);
    setBudgetLabel(preset.label);
  };

  // Show loading or redirect if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--teal-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            Create Post
          </h1>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 flex-shrink-0",
              canSubmit && !isSubmitting
                ? "bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121]"
                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
            )}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Post
          </button>
        </div>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Create Post
              </h1>
              <p className="text-neutral-500 text-sm">Share your listing with the community</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              canSubmit && !isSubmitting
                ? "bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121]"
                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
            )}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </header>

      <div className="content-container py-6">
        <div className="create-form-container space-y-6">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--lime-400)] to-[var(--yellow-400)]">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user?.name || 'User'}</p>
            <p className="text-sm text-neutral-500">Posting publicly</p>
          </div>
        </motion.div>

        {/* Post Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            What type of post is this?
          </label>
          <div className="space-y-3">
            {postTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                  selectedType === type.id
                    ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30 dark:bg-[var(--teal-500)]/10"
                    : "border-transparent bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  type.color === 'peach' && "bg-[var(--peach-200)]",
                  type.color === 'lavender' && "bg-[var(--lavender-200)]",
                  type.color === 'lime' && "bg-[var(--lime-200)]",
                  type.color === 'violet' && "bg-violet-200 dark:bg-violet-500/20",
                  type.color === 'green' && "bg-green-200 dark:bg-green-500/20",
                  type.color === 'sky' && "bg-sky-200 dark:bg-sky-500/20",
                  type.color === 'amber' && "bg-amber-200 dark:bg-amber-500/20"
                )}>
                  <type.icon className="w-6 h-6 text-neutral-700" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {type.label}
                  </h4>
                  <p className="text-sm text-neutral-500">{type.description}</p>
                </div>
                {selectedType === type.id && (
                  <div className="w-6 h-6 rounded-full bg-[var(--teal-500)] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            {selectedType === 'carpool-offer'
              ? 'Describe your ride'
              : selectedType === 'carpool-request'
              ? 'Describe your trip'
              : selectedType === 'subscription-split'
              ? 'Describe the subscription split'
              : selectedType === 'grocery-split'
              ? 'Describe what you want to split'
              : selectedType === 'house-listing'
              ? 'Describe the property'
              : selectedType === 'have-spare-room'
              ? 'Describe the spare room'
              : selectedType === 'looking-for-place'
              ? "Describe what you're looking for"
              : "Describe what you're looking for"}
          </label>
          <div className="card-glass p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                selectedType === 'carpool-offer'
                  ? "Share details about your ride — route, timing, preferences, anything riders should know..."
                  : selectedType === 'carpool-request'
                  ? "Describe your trip — where you're going, when, and any preferences..."
                  : selectedType === 'subscription-split'
                  ? "Which plan are you on? How many slots are available? Any rules for the split..."
                  : selectedType === 'grocery-split'
                  ? "What are you buying? Where from? When do you plan to purchase..."
                  : selectedType === 'house-listing'
                  ? "Describe the property — rooms, amenities, neighborhood, rules, move-in date..."
                  : selectedType === 'have-spare-room'
                  ? "Describe the room — size, furnishing, shared areas, house rules, ideal tenant..."
                  : selectedType === 'looking-for-place'
                  ? "Describe what you're looking for — area, budget, move-in date, lifestyle preferences..."
                  : "Tell potential roommates about yourself, your lifestyle, preferences, and what you're looking for..."
              }
              rows={5}
              className="w-full bg-transparent outline-none text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--peach-100)] dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => handleMediaClick(cameraInputRef)}
                  disabled={uploadingImage || images.length >= 5}
                  className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
                >
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-neutral-500" /> : <Camera className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => handleMediaClick(fileInputRef)}
                  disabled={uploadingImage || images.length >= 5}
                  className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
                >
                  <Image className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => handleMediaClick(videoInputRef)}
                  disabled={uploadingVideo || !!video}
                  className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors disabled:opacity-40"
                  title="Add video"
                >
                  {uploadingVideo ? <Loader2 className="w-5 h-5 animate-spin text-neutral-500" /> : <Video className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
                </button>
                {images.length > 0 && (
                  <span className="text-xs text-neutral-500">{images.length}/5 photos</span>
                )}
              </div>
              <span className={cn(
                "text-sm",
                content.length < 20 ? "text-neutral-400" : "text-[var(--teal-600)]"
              )}>
                {content.length}/500
              </span>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--peach-100)] dark:border-neutral-700 overflow-x-auto">
                {images.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group">
                    <img
                      src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${img}`}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Video Preview */}
            {video && (
              <div className="relative mt-3 pt-3 border-t border-[var(--peach-100)] dark:border-neutral-700">
                <div className="relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <video
                    src={video.startsWith('http') ? video : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${video}`}
                    controls
                    preload="metadata"
                    className="w-full max-h-48 object-contain rounded-xl"
                  />
                  <button
                    onClick={() => setVideo(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Subscription Service Picker — only for subscription-split */}
        {isSubscriptionSplit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Which service are you splitting?
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Netflix', 'Spotify', 'YouTube Premium', 'Apple Music', 'Disney+', 'HBO Max', 'Amazon Prime', 'Showmax', 'Apple TV+', 'DSTV'].map((service) => (
              <button
                key={service}
                onClick={() => setSubscriptionName(service)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                  subscriptionName === service
                    ? "bg-gradient-to-r from-violet-300 to-purple-300 dark:from-violet-500/30 dark:to-purple-500/30 text-violet-900 dark:text-violet-200"
                    : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
                )}
              >
                {service}
              </button>
            ))}
            <button
              onClick={() => setSubscriptionName('Other')}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                subscriptionName === 'Other' || (subscriptionName && !['Netflix', 'Spotify', 'YouTube Premium', 'Apple Music', 'Disney+', 'HBO Max', 'Amazon Prime', 'Showmax', 'Apple TV+', 'DSTV'].includes(subscriptionName))
                  ? "bg-gradient-to-r from-violet-300 to-purple-300 dark:from-violet-500/30 dark:to-purple-500/30 text-violet-900 dark:text-violet-200"
                  : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
              )}
            >
              Other
            </button>
          </div>
          {(subscriptionName === 'Other' || (subscriptionName && !['Netflix', 'Spotify', 'YouTube Premium', 'Apple Music', 'Disney+', 'HBO Max', 'Amazon Prime', 'Showmax', 'Apple TV+', 'DSTV'].includes(subscriptionName))) && (
            <input
              type="text"
              placeholder="Enter service name..."
              value={subscriptionName === 'Other' ? '' : subscriptionName}
              onChange={(e) => setSubscriptionName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-violet-400"
            />
          )}
        </motion.div>
        )}

        {/* Subscription Total Cost — only for subscription-split */}
        {isSubscriptionSplit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Total monthly cost (Naira)
          </label>
          <div className="card-glass p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-neutral-500">₦</span>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={subscriptionTotalCost ?? ''}
                onChange={(e) => setSubscriptionTotalCost(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 bg-transparent outline-none text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                min={0}
              />
            </div>
            {subscriptionTotalCost && subscriptionTotalCost > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--peach-100)] dark:border-neutral-700">
                <p className="text-sm text-neutral-500">
                  Cost per person: <span className="font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                    ₦{Math.ceil(subscriptionTotalCost / (spots + 1)).toLocaleString()}
                  </span>
                  <span className="text-neutral-400"> ({spots + 1} people total)</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
        )}

        {/* Grocery Item Name — only for grocery-split */}
        {isGrocerySplit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            What are you splitting?
          </label>
          <div className="card-glass p-4">
            <input
              type="text"
              placeholder='e.g. "A cow", "Baskets of pepper", "Bag of rice"'
              value={groceryItemName}
              onChange={(e) => setGroceryItemName(e.target.value)}
              className="w-full bg-transparent outline-none text-lg font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 placeholder:font-normal"
            />
          </div>
        </motion.div>
        )}

        {/* Grocery Total Cost — only for grocery-split */}
        {isGrocerySplit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Total cost (Naira)
          </label>
          <div className="card-glass p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-neutral-500">₦</span>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={groceryTotalCost ?? ''}
                onChange={(e) => setGroceryTotalCost(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 bg-transparent outline-none text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                min={0}
              />
            </div>
            {groceryTotalCost && groceryTotalCost > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--peach-100)] dark:border-neutral-700">
                <p className="text-sm text-neutral-500">
                  Cost per person: <span className="font-semibold text-[var(--lime-600)] dark:text-[var(--lime-400)]">
                    ₦{Math.ceil(groceryTotalCost / (spots + 1)).toLocaleString()}
                  </span>
                  <span className="text-neutral-400"> ({spots + 1} people total)</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
        )}

        {/* ─── Carpool Form Sections ─── */}
        {isCarpool && (
        <>
          {/* Origin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <LocationPicker
              value={carpoolOriginData}
              onChange={(loc) => setCarpoolOriginData(loc)}
              label="Where are you starting from?"
              subtitle="Your pickup / departure point"
              placeholder="e.g. Lekki Phase 1, Lagos"
            />
          </motion.div>

          {/* Destination */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LocationPicker
              value={carpoolDestinationData}
              onChange={(loc) => setCarpoolDestinationData(loc)}
              label="Where are you going?"
              subtitle="Your destination"
              placeholder="e.g. Victoria Island, Lagos"
            />
          </motion.div>

          {/* When? */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-3 block">
              When are you leaving?
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => { setCarpoolIsScheduled(false); setCarpoolDepartureTime(''); }}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  !carpoolIsScheduled
                    ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30 dark:bg-[var(--teal-500)]/10"
                    : "border-transparent bg-white/70 dark:bg-neutral-800/70"
                )}
              >
                <Clock className={cn("w-5 h-5 mb-1", !carpoolIsScheduled ? "text-[var(--teal-500)]" : "text-neutral-400")} />
                <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Right Now</p>
                <p className="text-xs text-neutral-500">Leaving immediately</p>
              </button>
              <button
                onClick={() => setCarpoolIsScheduled(true)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left",
                  carpoolIsScheduled
                    ? "border-[var(--teal-500)] bg-[var(--teal-100)]/30 dark:bg-[var(--teal-500)]/10"
                    : "border-transparent bg-white/70 dark:bg-neutral-800/70"
                )}
              >
                <Clock className={cn("w-5 h-5 mb-1", carpoolIsScheduled ? "text-[var(--teal-500)]" : "text-neutral-400")} />
                <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Schedule</p>
                <p className="text-xs text-neutral-500">Set a departure time</p>
              </button>
            </div>
            {carpoolIsScheduled && (
              <input
                type="datetime-local"
                value={carpoolDepartureTime}
                onChange={(e) => setCarpoolDepartureTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-[var(--teal-400)]"
              />
            )}
          </motion.div>

          {/* Car Details — offer only */}
          {isCarpoolOffer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-3 block">
              Car type
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Sedan', 'SUV', 'Minivan', 'Hatchback', 'Pickup'].map((type) => (
                <button
                  key={type}
                  onClick={() => setCarpoolCarType(type)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                    carpoolCarType === type
                      ? "bg-gradient-to-r from-sky-300 to-blue-300 dark:from-sky-500/30 dark:to-blue-500/30 text-sky-900 dark:text-sky-200"
                      : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type your car model, e.g. Toyota Camry"
              value={!['Sedan', 'SUV', 'Minivan', 'Hatchback', 'Pickup'].includes(carpoolCarType) ? carpoolCarType : ''}
              onChange={(e) => setCarpoolCarType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 border border-[var(--peach-200)] dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-sky-400"
            />
          </motion.div>
          )}

          {/* Available Seats — offer only */}
          {isCarpoolOffer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-3 block">
              Available seats
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCarpoolSeatsAvailable(Math.max(1, carpoolSeatsAvailable - 1))}
                className="w-12 h-12 rounded-xl bg-white/70 dark:bg-neutral-800/70 flex items-center justify-center text-2xl font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
              >
                -
              </button>
              <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 w-12 text-center">
                {carpoolSeatsAvailable}
              </span>
              <button
                onClick={() => setCarpoolSeatsAvailable(Math.min(7, carpoolSeatsAvailable + 1))}
                className="w-12 h-12 rounded-xl bg-white/70 dark:bg-neutral-800/70 flex items-center justify-center text-2xl font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
              >
                +
              </button>
              <span className="text-sm text-neutral-500 ml-2">
                seat{carpoolSeatsAvailable !== 1 ? 's' : ''} available
              </span>
            </div>
          </motion.div>
          )}

          {/* Cost per seat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-3 block">
              {isCarpoolOffer ? 'Cost per seat (Naira)' : 'How much are you willing to pay? (Naira)'}
            </label>
            <div className="card-glass p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-neutral-500">₦</span>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={carpoolCostPerSeat ?? ''}
                  onChange={(e) => setCarpoolCostPerSeat(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 bg-transparent outline-none text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                  min={0}
                />
              </div>
            </div>
          </motion.div>

          {/* Payment Mode — offer only */}
          {isCarpoolOffer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-3 block">
              Payment method
            </label>
            <div className="flex gap-2">
              {[
                { label: 'Cash', value: 'cash' },
                { label: 'Transfer', value: 'transfer' },
                { label: 'Both', value: 'both' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCarpoolPaymentMode(opt.value)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                    carpoolPaymentMode === opt.value
                      ? "bg-gradient-to-r from-[var(--lime-300)] to-[var(--yellow-300)] text-[#212121]"
                      : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
          )}

          {/* Meetup Point (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="text-sm font-medium text-neutral-500 mb-3 block">
              Meetup point <span className="text-neutral-400">(optional)</span>
            </label>
            <div className="card-glass p-4">
              <input
                type="text"
                placeholder="e.g. Lekki toll gate, Shoprite bus stop"
                value={carpoolMeetupPoint}
                onChange={(e) => setCarpoolMeetupPoint(e.target.value)}
                className="w-full bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
              />
            </div>
          </motion.div>
        </>
        )}

        {/* Location — hidden for subscription-split and carpool, visible for grocery-split (pickup location) */}
        {!isSubscriptionSplit && !isCarpool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <LocationPicker
            value={locationData}
            onChange={(loc) => {
              setLocationData(loc);
              setLocation(loc?.name || '');
            }}
            label="Where is this place?"
            subtitle="Help people find places near them"
            placeholder="e.g. Lekki Phase 1, Lagos"
            allowManualEntry
          />
        </motion.div>
        )}

        {/* Budget — hidden for subscription-split, grocery-split, and carpool */}
        {!isSubscriptionSplit && !isGrocerySplit && !isCarpool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Budget (Monthly)
          </label>
          <div className="card-glass p-4 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-neutral-500">₦</span>
              <input
                type="number"
                placeholder="Enter exact amount"
                value={budget ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setBudget(val);
                  setBudgetLabel(val ? `₦${val.toLocaleString()}` : '');
                }}
                className="flex-1 bg-transparent outline-none text-lg font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 placeholder:font-normal"
                min={0}
              />
            </div>
            {budget != null && budget > 0 && (
              <p className="text-sm text-[var(--lime-600)] dark:text-[var(--lime-400)] mt-2 font-medium">
                ₦{budget.toLocaleString()}/month
              </p>
            )}
          </div>
          {/* <p className="text-xs text-neutral-400 mb-2">Quick select:</p>
          <div className="flex flex-wrap gap-2">
            {budgetPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleBudgetSelect(preset)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                  budget === preset.value
                    ? "bg-gradient-to-r from-[var(--lime-300)] to-[var(--yellow-300)] text-[#212121]"
                    : "bg-white/70 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div> */}
        </motion.div>
        )}

        {/* Spots Available — hidden for carpool (has its own seats stepper) */}
        {!isCarpool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Spots Available
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSpots(Math.max(1, spots - 1))}
              className="w-12 h-12 rounded-xl bg-white/70 dark:bg-neutral-800/70 flex items-center justify-center text-2xl font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            >
              -
            </button>
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 w-12 text-center">
              {spots}
            </span>
            <button
              onClick={() => setSpots(Math.min(5, spots + 1))}
              className="w-12 h-12 rounded-xl bg-white/70 dark:bg-neutral-800/70 flex items-center justify-center text-2xl font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            >
              +
            </button>
            <span className="text-sm text-neutral-500 ml-2">
              {isSubscriptionSplit ? 'partner' : isGrocerySplit ? 'person' : 'roommate'}{spots !== 1 ? 's' : ''} needed
            </span>
          </div>
        </motion.div>
        )}

        {/* Visibility Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Who can see this post?
          </label>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setVisibility('everyone')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-left",
                visibility === 'everyone'
                  ? "border-[var(--teal-400)] bg-[var(--teal-50)] dark:bg-[var(--teal-500)]/10"
                  : "border-[var(--peach-200)] dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70"
              )}
            >
              <Globe className={cn(
                "w-6 h-6 mb-2",
                visibility === 'everyone' ? "text-[var(--teal-500)]" : "text-neutral-400"
              )} />
              <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Everyone</p>
              <p className="text-xs text-neutral-500 mt-0.5">All users can see this</p>
            </button>
            <button
              onClick={() => setVisibility('verified-only')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-left",
                visibility === 'verified-only'
                  ? "border-[var(--lavender-400)] bg-[var(--lavender-50)] dark:bg-[var(--lavender-400)]/10"
                  : "border-[var(--peach-200)] dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70"
              )}
            >
              <Shield className={cn(
                "w-6 h-6 mb-2",
                visibility === 'verified-only' ? "text-[var(--lavender-500)]" : "text-neutral-400"
              )} />
              <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Verified Only</p>
              <p className="text-xs text-neutral-500 mt-0.5">Only verified users</p>
            </button>
          </div>

          {/* Area restriction */}
          <label className="text-sm font-medium text-neutral-500 mb-3 block">
            Limit to nearby users? <span className="text-neutral-400">(optional)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'No limit', value: null },
              { label: '5 km', value: 5 },
              { label: '10 km', value: 10 },
              { label: '25 km', value: 25 },
              { label: '50 km', value: 50 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setVisibleRadiusKm(opt.value)}
                className={cn(
                  "filter-chip py-2.5 px-4 rounded-xl flex items-center gap-1.5",
                  visibleRadiusKm === opt.value ? 'selected' : ''
                )}
              >
                {opt.value ? <Target className="w-3.5 h-3.5" /> : null}
                {opt.label}
              </button>
            ))}
          </div>
          {visibleRadiusKm && (
            <p className="text-xs text-neutral-500 mt-2">
              Only users within {visibleRadiusKm}km of your post location will see it. Make sure you set a location above.
            </p>
          )}
        </motion.div>

        {/* Referral Code (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[var(--teal-600)] dark:text-[var(--teal-400)]" />
            Referral Code
            <span className="text-xs text-neutral-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => handleReferralCodeChange(e.target.value.toUpperCase())}
              placeholder="e.g. LGH-ABCD12"
              maxLength={10}
              className={cn(
                "w-full px-4 py-3 rounded-xl border bg-white dark:bg-neutral-800 text-sm transition-colors",
                referralValid === true
                  ? "border-green-400 dark:border-green-600 focus:ring-green-400/30"
                  : referralValid === false
                  ? "border-red-400 dark:border-red-600 focus:ring-red-400/30"
                  : "border-[var(--peach-200)] dark:border-neutral-700 focus:ring-[var(--peach-300)]",
                "focus:outline-none focus:ring-2"
              )}
            />
            {validatingReferral && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              </div>
            )}
            {!validatingReferral && referralValid === true && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            )}
            {!validatingReferral && referralValid === false && referralCode.length >= 7 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
          {referralValid === true && referralPartnerName && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Referred by <span className="font-medium">{referralPartnerName}</span>
            </p>
          )}
          {referralValid === false && referralCode.length >= 7 && (
            <p className="text-xs text-red-500 dark:text-red-400">
              Invalid referral code. Please check and try again.
            </p>
          )}
          <p className="text-xs text-neutral-400">
            If someone referred you to LetsGoHalf, enter their referral code here.
          </p>
        </motion.div>

        {/* Validation Hints — show what's missing */}
        {selectedType && !canSubmit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50"
          >
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">To publish, please complete:</p>
            <ul className="space-y-1 text-sm text-amber-600 dark:text-amber-400/80">
              {content.trim().length < 20 && (
                <li>• Write at least 20 characters of description ({20 - content.trim().length} more needed)</li>
              )}
              {isSubscriptionSplit && !subscriptionName && (
                <li>• Select or enter a subscription service</li>
              )}
              {isSubscriptionSplit && (!subscriptionTotalCost || subscriptionTotalCost <= 0) && (
                <li>• Enter the total monthly cost</li>
              )}
              {isGrocerySplit && !groceryItemName && (
                <li>• Enter what you are splitting</li>
              )}
              {isGrocerySplit && (!groceryTotalCost || groceryTotalCost <= 0) && (
                <li>• Enter the total cost</li>
              )}
              {isCarpool && !carpoolOriginData && (
                <li>• Set your starting location (select from suggestions or use current location)</li>
              )}
              {isCarpool && !carpoolDestinationData && (
                <li>• Set your destination (select from suggestions)</li>
              )}
              {!isSubscriptionSplit && !isCarpool && !location && (
                <li>• Set a location (select from suggestions or tap &quot;Use Current Location&quot;)</li>
              )}
              {!isSubscriptionSplit && !isGrocerySplit && !isCarpool && !budget && (
                <li>• Enter your budget</li>
              )}
            </ul>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

          {/* Submit Button (Mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 lg:hidden"
          >
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-2",
                canSubmit && !isSubmitting
                  ? "btn-primary"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Home className="w-5 h-5" />
                  Publish Post
                </>
              )}
            </button>
          </motion.div>

          {/* Tips Card - Desktop only */}
          <div className="hidden lg:block">
            <div className="card-glass p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--yellow-500)]" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Tips for a Great Post
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--lime-500)] mt-0.5" />
                  <span>Be specific about location and amenities</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--lime-500)] mt-0.5" />
                  <span>Mention your lifestyle and preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--lime-500)] mt-0.5" />
                  <span>Add photos of the space for more engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--lime-500)] mt-0.5" />
                  <span>Be transparent about budget expectations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Required Modal for Media Uploads */}
      <VerificationRequiredModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title={isSubscriptionSplit ? "Verify to Split Subscriptions" : isGrocerySplit ? "Verify to Split Groceries" : isCarpool ? "Verify to Use Carpool" : "Verify to Add Photos"}
        description={isSubscriptionSplit
          ? "Only verified users can create subscription splits. Verify your identity to get started."
          : isGrocerySplit
          ? "Only verified users can create grocery splits. Verify your identity to get started."
          : isCarpool
          ? "Only verified users can create carpool posts. Verify your identity to get started."
          : "Only verified users can attach photos or videos to their posts. Verify your identity to unlock media uploads."}
        verifyRoute="/verification"
        verifyLabel="Get Verified"
      />

      {/* Preferred Locations Modal - shown after first post if no locations set */}
      <PreferredLocationsModal
        isOpen={showLocationsModal}
        onClose={() => {
          setShowLocationsModal(false);
          router.push('/');
        }}
        onSave={async (locations) => {
          await authApi.updateProfile({ preferredLocations: locations } as any);
          setShowLocationsModal(false);
          router.push('/');
        }}
      />
    </AppLayout>
  );
}
