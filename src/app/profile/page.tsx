'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Edit3,
  MapPin,
  Star,
  ChevronRight,
  Heart,
  Home,
  MessageSquare,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Camera,
  Sun,
  Moon,
  Monitor,
  Users,
  Eye,
  Bookmark,
  FileText,
  Sparkles,
  X,
  Loader2,
  Check,
  DollarSign,
  Briefcase,
  Calendar,
  Handshake
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import authApi, { User } from '@/lib/api/auth';
import usersApi from '@/lib/api/users';
import uploadApi from '@/lib/api/upload';
import { cn } from '@/lib/utils';
import AgentBadge from '@/components/AgentBadge';
import PartnerBadge from '@/components/PartnerBadge';
import PremiumBadge from '@/components/PremiumBadge';
import { usePremium } from '@/contexts/PremiumContext';
import { resolveImageUrl } from '@/lib/utils/image';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import { useToast } from '@/contexts/ToastContext';

// Edit Profile Modal
interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    occupation: user.occupation || '',
    age: user.age?.toString() || '',
    preferredLocations: user.preferredLocations?.join(', ') || '',
    budgetMin: user.budgetMin?.toString() || '',
    budgetMax: user.budgetMax?.toString() || '',
  });
  const [homeLocation, setHomeLocation] = useState<LocationResult | null>(
    user.homeLatitude != null && user.homeLongitude != null && user.homeLocationName
      ? { name: user.homeLocationName, latitude: user.homeLatitude, longitude: user.homeLongitude }
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        occupation: user.occupation || '',
        age: user.age?.toString() || '',
        preferredLocations: user.preferredLocations?.join(', ') || '',
        budgetMin: user.budgetMin?.toString() || '',
        budgetMax: user.budgetMax?.toString() || '',
      });
      setHomeLocation(
        user.homeLatitude != null && user.homeLongitude != null && user.homeLocationName
          ? { name: user.homeLocationName, latitude: user.homeLatitude, longitude: user.homeLongitude }
          : null
      );
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const updates: Partial<User> = {
        name: formData.name,
        bio: formData.bio || undefined,
        occupation: formData.occupation || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        preferredLocations: formData.preferredLocations
          ? formData.preferredLocations.split(',').map(l => l.trim()).filter(Boolean)
          : undefined,
        budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
        homeLatitude: homeLocation?.latitude,
        homeLongitude: homeLocation?.longitude,
        homeLocationName: homeLocation?.name,
      };

      await onSave(updates);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto overflow-x-hidden"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pb-24 space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-base text-neutral-900 dark:text-neutral-100"
              placeholder="Your full name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-base text-neutral-900 dark:text-neutral-100 resize-none"
              placeholder="Tell others about yourself..."
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Occupation
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-base text-neutral-900 dark:text-neutral-100"
              placeholder="What do you do?"
            />
          </div>

          {/* Age */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              <Calendar className="w-4 h-4 inline mr-1" />
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="18"
              max="100"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-base text-neutral-900 dark:text-neutral-100"
              placeholder="Your age"
            />
          </div>

          {/* Home Location */}
          <div>
            <LocationPicker
              value={homeLocation}
              onChange={setHomeLocation}
              label="Where are you based?"
              subtitle="This helps us show you listings nearby. Only your general area is visible to others."
              placeholder="Search your area..."
            />
          </div>

          {/* Preferred Locations */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              <MapPin className="w-4 h-4 inline mr-1" />
              Preferred Locations
            </label>
            <input
              type="text"
              value={formData.preferredLocations}
              onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-[16px] text-neutral-900 dark:text-neutral-100"
              placeholder="e.g., Lekki, Victoria Island, Ikeja"
            />
            <p className="text-xs text-neutral-500 mt-1">Separate multiple locations with commas</p>
          </div>

          {/* Budget Range */}
          <div>
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Budget Range (₦)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                className="flex-1 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-base text-neutral-900 dark:text-neutral-100"
                placeholder="Min"
              />
              <span className="flex items-center text-neutral-400">to</span>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                className="flex-1 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-base text-neutral-900 dark:text-neutral-100"
                placeholder="Max"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--pink-500)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !formData.name}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--lime-400)] to-[var(--teal-400)] text-[#212121] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
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
        </form>
      </motion.div>
    </div>
  );
}

// Right Sidebar for Desktop
function RightSidebar({ user }: { user: User | null }) {
  const calculateCompletion = () => {
    if (!user) return 0;
    let completed = 0;
    const total = 8;

    if (user.name) completed++;
    if (user.avatar) completed++;
    if (user.bio) completed++;
    if (user.occupation) completed++;
    if (user.age) completed++;
    if (user.preferredLocations?.length) completed++;
    if (user.budgetMin || user.budgetMax) completed++;
    if (user.isPhoneVerified || user.isEmailVerified) completed++;

    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  const getMissingItem = () => {
    if (!user) return 'Complete your profile';
    if (!user.avatar) return 'Add a profile photo';
    if (!user.bio) return 'Add a bio';
    if (!user.occupation) return 'Add your occupation';
    if (!user.preferredLocations?.length) return 'Add preferred locations';
    if (!user.isPhoneVerified && !user.isEmailVerified) return 'Verify your account';
    return 'Your profile is complete!';
  };

  return (
    <aside className="right-sidebar">
      <div className="card-glass p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--yellow-500)]" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Profile Tips
          </h3>
        </div>
        <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--lime-100)] dark:bg-[var(--lime-500)]/10 text-[var(--lime-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>Complete your profile to attract more potential roommates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--peach-100)] dark:bg-[var(--peach-500)]/10 text-[var(--peach-600)] flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Get verified to build trust with the community</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--lavender-100)] dark:bg-[var(--lavender-400)]/10 text-[var(--lavender-500)] flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Add photos of your space for better engagement</span>
          </li>
        </ul>
      </div>

      <div className="card-glass p-5">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Account Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Profile Complete</span>
            <span className={cn(
              "text-sm font-medium",
              completion >= 80 ? "text-[var(--lime-600)]" : completion >= 50 ? "text-[var(--yellow-600)]" : "text-[var(--peach-600)]"
            )}>{completion}%</span>
          </div>
          <div className="h-2 bg-[var(--peach-100)] dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--teal-400)] rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">{getMissingItem()}</p>
        </div>
      </div>
    </aside>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, preference, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();
  const toast = useToast();
  const { premiumEnabled } = usePremium();

  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  // Fetch total user count for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      usersApi.admin.getStats()
        .then((stats) => setTotalUsers(stats.totalUsers))
        .catch(() => {});
    }
  }, [user?.role]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(file.type)) {
      toast.warning('Unsupported format. Please use a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadApi.uploadAvatar(file);
      const updatedUser = await authApi.updateProfile({ avatar: result.url });
      const userWithResolvedAvatar = { ...updatedUser, avatar: resolveImageUrl(updatedUser.avatar) };
      setLocalUser(userWithResolvedAvatar);
      updateUser(updatedUser); // Update AuthContext so avatar persists across navigation
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileUpdate = async (updates: Partial<User>) => {
    const updatedUser = await authApi.updateProfile(updates);
    const userWithResolvedAvatar = { ...updatedUser, avatar: resolveImageUrl(updatedUser.avatar) };
    setLocalUser(userWithResolvedAvatar);
    updateUser(updatedUser); // Update AuthContext so changes persist across navigation
    toast.success('Profile updated!');
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
        </div>
      </AppLayout>
    );
  }

  if (!localUser) {
    return null;
  }

  const memberSince = new Date(localUser.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const menuSections = [
    {
      title: 'Activity',
      items: [
        { id: 'listings', icon: Home, label: 'My Listings', onClick: () => router.push('/my-listings') },
        { id: 'saved', icon: Bookmark, label: 'Saved Posts', onClick: () => router.push('/saved') },
        { id: 'interested', icon: Heart, label: 'Interested', onClick: () => router.push('/interested') },
        { id: 'views', icon: Eye, label: 'Profile Views', onClick: () => router.push('/views') },
      ]
    },
    {
      title: 'Account',
      items: [
        ...(premiumEnabled ? [{
          id: 'premium',
          icon: Star,
          label: localUser.subscriptionTier === 'premium' ? 'Premium (Active)' : 'Go Premium',
          badge: localUser.subscriptionTier === 'premium' ? 'Premium' as string : undefined,
          badgeColor: localUser.subscriptionTier === 'premium' ? 'lime' as const : undefined,
          onClick: () => router.push('/premium')
        }] : []),
        { id: 'notifications', icon: Bell, label: 'Notifications', onClick: () => router.push('/notifications') },
        {
          id: 'verification',
          icon: Shield,
          label: 'Verification',
          badge: localUser.isIdVerified ? 'Verified' : 'Not Verified',
          badgeColor: localUser.isIdVerified ? 'lime' as const : 'peach' as const,
          onClick: () => router.push('/verification')
        },
        {
          id: 'agent-verification',
          icon: Briefcase,
          label: 'Agent / Owner Verification',
          badge: localUser.isAgentVerified ? 'Verified' : undefined,
          badgeColor: localUser.isAgentVerified ? 'lime' as const : undefined,
          onClick: () => router.push('/agent-verification')
        },
        ...(localUser.isPartner ? [{
          id: 'partner-dashboard',
          icon: Handshake,
          label: 'Partner Dashboard',
          badge: 'Partner' as string,
          badgeColor: 'lime' as const,
          onClick: () => router.push('/partner-dashboard')
        }] : [{
          id: 'become-partner',
          icon: Handshake,
          label: 'Become a Partner',
          onClick: () => router.push('/become-partner')
        }]),
      ]
    },
    {
      title: 'Support',
      items: [
        { id: 'support', icon: MessageSquare, label: 'Chat with Support', onClick: () => router.push('/chat?support=true') },
        { id: 'advertise', icon: HelpCircle, label: 'Advertise with Us', onClick: () => router.push('/chat?support=true') },
      ]
    },
  ];

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <header className="header-mobile px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Account</p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Profile
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
            title={preference === 'system' ? 'Theme: System' : preference === 'midnight' ? 'Theme: Dark' : 'Theme: Light'}
          >
            {preference === 'system' ? (
              <Monitor className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            ) : preference === 'midnight' ? (
              <Moon className="w-5 h-5 text-[var(--lavender-400)]" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
          >
            <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </button>
        </div>
      </header>

      <header className="header-web">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Profile
            </h1>
            <p className="text-neutral-500 mt-1">Manage your account settings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="btn-secondary flex items-center gap-2"
            >
              {preference === 'system' ? (
                <>
                  <Monitor className="w-4 h-4" />
                  Auto
                </>
              ) : preference === 'midnight' ? (
                <>
                  <Moon className="w-4 h-4" />
                  Dark
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  Light
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </header>

      <div className="content-container">
        <div className="three-column-layout">
          <div className="main-feed pb-24 lg:pb-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <div className="card-glass p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 ring-4 ring-white dark:ring-neutral-700 shadow-lg">
                      <AvatarImage src={resolveImageUrl(localUser.avatar)} alt={localUser.name} />
                      <AvatarFallback className="bg-gradient-to-br from-[var(--lime-400)] to-[var(--yellow-400)] text-[#212121] text-xl font-bold">
                        {localUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-[var(--lime-400)] to-[var(--yellow-400)] flex items-center justify-center shadow-md disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 text-neutral-900 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-neutral-900" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        {localUser.name}
                      </h2>
                      {localUser.isAgentVerified && localUser.agentTier && (
                        <AgentBadge tier={localUser.agentTier} size="md" />
                      )}
                      {localUser.isPartner && (
                        <PartnerBadge size="md" />
                      )}
                      {localUser.subscriptionTier === 'premium' && (
                        <PremiumBadge size="md" />
                      )}
                    </div>
                    {localUser.preferredLocations?.length ? (
                      <div className="flex items-center gap-1 text-sm text-neutral-500 mb-2">
                        <MapPin className="w-4 h-4 text-[var(--teal-500)]" />
                        {localUser.preferredLocations[0]}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-neutral-400 mb-2">
                        <MapPin className="w-4 h-4" />
                        Add location
                      </div>
                    )}
                    <span className="badge badge-peach text-xs">
                      Member since {memberSince}
                    </span>
                  </div>
                </div>

                {localUser.bio ? (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                    {localUser.bio}
                  </p>
                ) : (
                  <p className="text-sm text-neutral-400 italic mb-4">
                    Add a bio to tell others about yourself
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {localUser.occupation && (
                    <span className="badge badge-lime text-xs flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {localUser.occupation}
                    </span>
                  )}
                  {localUser.age && (
                    <span className="badge badge-lavender text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {localUser.age} years old
                    </span>
                  )}
                  {(localUser.budgetMin || localUser.budgetMax) && (
                    <span className="badge badge-peach text-xs flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ₦{localUser.budgetMin?.toLocaleString() || '0'} - ₦{localUser.budgetMax?.toLocaleString() || '∞'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </motion.div>

            <div className="px-5 lg:px-0 mb-6">
              <div className={cn("grid gap-3", localUser.role === 'admin' && totalUsers !== null ? "grid-cols-5" : "grid-cols-4")}>
                {[
                  { id: 'listings', icon: Home, label: 'Listings', value: 0, color: 'peach' },
                  { id: 'interested', icon: Heart, label: 'Interested', value: 0, color: 'pink' },
                  { id: 'matches', icon: Users, label: 'Matches', value: 0, color: 'lime' },
                  { id: 'reviews', icon: Star, label: 'Reviews', value: 0, color: 'lavender' },
                  ...(localUser.role === 'admin' && totalUsers !== null
                    ? [{ id: 'users', icon: Users, label: 'Users', value: totalUsers, color: 'teal' }]
                    : []),
                ].map((stat, i) => (
                  <motion.button
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col items-center p-4 rounded-2xl bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm hover:bg-white dark:hover:bg-neutral-800 transition-all"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                      stat.color === 'peach' && "bg-[var(--peach-200)]",
                      stat.color === 'pink' && "bg-[var(--pink-200)]",
                      stat.color === 'lime' && "bg-[var(--lime-200)]",
                      stat.color === 'lavender' && "bg-[var(--lavender-200)]",
                      stat.color === 'teal' && "bg-[var(--teal-200)]"
                    )}>
                      <stat.icon className="w-5 h-5 text-neutral-700" />
                    </div>
                    <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {stat.value}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {stat.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {!localUser.isAgentVerified && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 lg:mx-0 mb-6"
              >
                <button
                  onClick={() => router.push('/agent-verification')}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-100 dark:border-blue-500/20 text-left hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Are you an agent or property owner?
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Get verified to build trust and stand out
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  </div>
                </button>
              </motion.div>
            )}

            <div className="px-5 lg:px-0 space-y-6">
              {menuSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + sectionIndex * 0.05 }}
                >
                  <h3 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                    {section.title}
                  </h3>
                  <div className="card-glass overflow-hidden">
                    {section.items.map((item, itemIndex) => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={cn(
                          "w-full flex items-center justify-between p-4 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors",
                          itemIndex !== section.items.length - 1 && "border-b border-[var(--peach-100)] dark:border-neutral-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          </div>
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {'badge' in item && item.badge && (
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              item.badgeColor === 'lime'
                                ? "bg-[var(--lime-200)] text-[var(--lime-700)]"
                                : "bg-[var(--peach-200)] text-neutral-700"
                            )}>
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10 hover:bg-[var(--pink-200)] dark:hover:bg-[var(--pink-400)]/20 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-[var(--pink-500)]" />
                  <span className="font-medium text-[var(--pink-600)] dark:text-[var(--pink-400)]">
                    Log Out
                  </span>
                </button>
              </motion.div>

              <p className="text-center text-xs text-neutral-400 pb-4">
                LetsGohalf v1.0.0
              </p>
            </div>
          </div>

          <RightSidebar user={localUser} />
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            user={localUser}
            onSave={handleProfileUpdate}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
