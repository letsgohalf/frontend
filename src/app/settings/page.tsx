'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Trash2,
  ChevronRight,
  Check,
  X,
  Loader2,
  Globe,
  AlertTriangle,
  Heart,
  Clock,
  MessageSquare,
  Users,
  FileText,
  Shield,
  UserCog,
  Megaphone,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import authApi from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { playSound, isSoundEnabled, setSoundEnabled } from '@/lib/sounds';

// Setting section component
interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  value?: string | boolean;
  onClick?: () => void;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
  badge?: string;
  badgeColor?: 'lime' | 'peach' | 'pink';
  loading?: boolean;
  disabled?: boolean;
}

function SettingItem({
  icon: Icon,
  label,
  description,
  value,
  onClick,
  toggle,
  onToggle,
  danger,
  badge,
  badgeColor = 'lime',
  loading,
  disabled
}: SettingItemProps) {
  return (
    <button
      onClick={toggle ? () => onToggle?.(!value) : onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full flex items-center justify-between p-4 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        danger && "hover:bg-[var(--pink-50)] dark:hover:bg-[var(--pink-400)]/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          danger
            ? "bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10"
            : "bg-[var(--peach-100)] dark:bg-neutral-800"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            danger
              ? "text-[var(--pink-500)]"
              : "text-neutral-600 dark:text-neutral-400"
          )} />
        </div>
        <div className="text-left">
          <span className={cn(
            "font-medium block",
            danger
              ? "text-[var(--pink-600)] dark:text-[var(--pink-400)]"
              : "text-neutral-800 dark:text-neutral-200"
          )}>
            {label}
          </span>
          {description && (
            <span className="text-xs text-neutral-500 block mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        )}
        {badge && !loading && (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            badgeColor === 'lime' && "bg-[var(--lime-200)] dark:bg-[var(--lime-500)]/20 text-[var(--lime-600)] dark:text-[var(--lime-400)]",
            badgeColor === 'peach' && "bg-[var(--peach-200)] dark:bg-[var(--peach-500)]/20 text-neutral-700 dark:text-neutral-300",
            badgeColor === 'pink' && "bg-[var(--pink-200)] dark:bg-[var(--pink-400)]/20 text-[var(--pink-500)] dark:text-[var(--pink-400)]"
          )}>
            {badge}
          </span>
        )}
        {toggle && !loading ? (
          <div className={cn(
            "w-12 h-7 rounded-full transition-colors relative",
            value
              ? "bg-[var(--lime-400)]"
              : "bg-neutral-300 dark:bg-neutral-600"
          )}>
            <div className={cn(
              "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
              value ? "translate-x-6" : "translate-x-1"
            )} />
          </div>
        ) : typeof value === 'string' && !loading ? (
          <>
            <span className="text-sm text-neutral-500 max-w-[150px] truncate">
              {value}
            </span>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </>
        ) : !toggle && !loading && (
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        )}
      </div>
    </button>
  );
}

// Modal component for editing
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function EditModal({ isOpen, onClose, title, children }: EditModalProps) {
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
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// Confirmation modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  loading?: boolean;
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  danger,
  loading
}: ConfirmModalProps) {
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
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-sm w-full p-6"
      >
        <div className={cn(
          "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
          danger
            ? "bg-[var(--pink-100)] dark:bg-[var(--pink-400)]/10"
            : "bg-[var(--peach-100)] dark:bg-neutral-800"
        )}>
          <AlertTriangle className={cn(
            "w-6 h-6",
            danger ? "text-[var(--pink-500)]" : "text-[var(--peach-500)]"
          )} />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 text-center mb-2">
          {title}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2",
              danger
                ? "bg-[var(--pink-500)] text-white"
                : "bg-[var(--lime-400)] text-[#212121]"
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, preference, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to notifications section if URL hash is #notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#notifications') {
      // Small delay to allow the page to render
      setTimeout(() => {
        notificationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, []);

  // Sound preference
  const [soundEnabled, setSoundEnabledState] = useState(true);
  useEffect(() => {
    setSoundEnabledState(isSoundEnabled());
  }, []);

  const handleSoundToggle = (value: boolean) => {
    // Play the sound before toggling off so user hears it
    playSound(value ? 'toggle' : 'toggleOff');
    setSoundEnabled(value);
    setSoundEnabledState(value);
  };

  // Notification preferences - loaded from user data
  const [notificationPrefs, setNotificationPrefs] = useState({
    notifyOnInterest: true,
    notifyOnMessage: true,
    notifyOnMatch: true
  });
  const [notifLoading, setNotifLoading] = useState<string | null>(null);

  // Privacy preferences - loaded from user data
  const [privacyPrefs, setPrivacyPrefs] = useState({
    showOnlineStatus: true,
    showLikes: true,
    showLastSeen: true,
    profileVisibility: 'matches' as 'public' | 'verified' | 'matches'
  });
  const [privacyLoading, setPrivacyLoading] = useState<string | null>(null);

  // Modal states
  const [editEmailModal, setEditEmailModal] = useState(false);
  const [editPhoneModal, setEditPhoneModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Load notification and privacy preferences from user data
  useEffect(() => {
    if (user) {
      setNotificationPrefs({
        notifyOnInterest: user.notifyOnInterest ?? true,
        notifyOnMessage: user.notifyOnMessage ?? true,
        notifyOnMatch: user.notifyOnMatch ?? true,
      });
      setPrivacyPrefs({
        showOnlineStatus: user.showOnlineStatus ?? true,
        showLikes: user.showLikes ?? true,
        showLastSeen: user.showLastSeen ?? true,
        profileVisibility: user.profileVisibility ?? 'matches',
      });
    }
  }, [user]);

  // Handle email update
  const handleEmailUpdate = async () => {
    if (!newEmail) return;

    setIsUpdating(true);
    setUpdateError('');

    try {
      await authApi.updateProfile({ email: newEmail });
      await refreshUser(); // Refresh user data to reflect the change
      setUpdateSuccess('Email updated successfully');
      setEditEmailModal(false);
      setNewEmail('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update email';
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle phone update
  const handlePhoneUpdate = async () => {
    if (!newPhone) return;

    setIsUpdating(true);
    setUpdateError('');

    try {
      await authApi.updateProfile({ phone: newPhone });
      await refreshUser(); // Refresh user data to reflect the change
      setUpdateSuccess('Phone number updated successfully');
      setEditPhoneModal(false);
      setNewPhone('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update phone';
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setLogoutModal(false);
  };

  // Handle delete account (placeholder - needs backend implementation)
  const handleDeleteAccount = async () => {
    setIsUpdating(true);
    // This would call an API endpoint to delete the account
    // For now, just logout
    setTimeout(() => {
      logout();
      setDeleteAccountModal(false);
      setIsUpdating(false);
    }, 1000);
  };

  // Update notification pref and save to backend
  const updateNotifPref = async (key: keyof typeof notificationPrefs, value: boolean) => {
    playSound(value ? 'toggle' : 'toggleOff');
    setNotifLoading(key);
    try {
      await authApi.updateProfile({ [key]: value });
      setNotificationPrefs(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      setUpdateError('Failed to update notification setting');
    } finally {
      setNotifLoading(null);
    }
  };

  // Update privacy pref and save to backend
  const updatePrivacyPref = async (key: keyof typeof privacyPrefs, value: boolean | string) => {
    playSound(value === true ? 'toggle' : value === false ? 'toggleOff' : 'toggle');
    setPrivacyLoading(key);
    try {
      await authApi.updateProfile({ [key]: value });
      setPrivacyPrefs(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      setUpdateError('Failed to update privacy setting');
    } finally {
      setPrivacyLoading(null);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => setUpdateSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  if (authLoading) {
    return (
      <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Mobile Header */}
      <header className="header-mobile px-5 pt-4 pb-2 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        </button>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
      </header>

      {/* Web Header */}
      <header className="header-web">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Settings
            </h1>
            <p className="text-neutral-500 mt-1">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      {/* Success Toast */}
      {updateSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--lime-400)] text-[#212121] px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {updateSuccess}
        </motion.div>
      )}

      <div className="content-container">
        <div className="three-column-layout">
          <div className="main-feed pb-24 lg:pb-8">
            {/* Admin Section - Only visible to admins */}
            {user.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 lg:mx-0 mb-6"
              >
                <h2 className="text-sm font-semibold text-[var(--lavender-500)] mb-3 px-1">
                  Administration
                </h2>
                <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800 ring-2 ring-[var(--lavender-200)] dark:ring-[var(--lavender-400)]/20">
                  <SettingItem
                    icon={UserCog}
                    label="Admin Dashboard"
                    description="Manage users, verify accounts, view statistics"
                    badge="Admin"
                    badgeColor="peach"
                    onClick={() => router.push('/admin')}
                  />
                </div>
              </motion.div>
            )}

            {/* Account Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Account
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={Mail}
                  label="Email"
                  value={user.email || 'Not set'}
                  badge={user.isEmailVerified ? 'Verified' : user.email ? 'Unverified' : undefined}
                  badgeColor={user.isEmailVerified ? 'lime' : 'peach'}
                  onClick={() => setEditEmailModal(true)}
                />
                <SettingItem
                  icon={Phone}
                  label="Phone"
                  value={user.phone || 'Not set'}
                  badge={user.isPhoneVerified ? 'Verified' : user.phone ? 'Unverified' : undefined}
                  badgeColor={user.isPhoneVerified ? 'lime' : 'peach'}
                  onClick={() => setEditPhoneModal(true)}
                />
                <SettingItem
                  icon={Lock}
                  label="Change Password"
                  description="Update your account password"
                  onClick={() => setChangePasswordModal(true)}
                />
              </div>
            </motion.div>

            {/* Notifications Section */}
            <motion.div
              ref={notificationsRef}
              id="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Notifications
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={Bell}
                  label="Interest Notifications"
                  description="Get notified when someone is interested in your listing"
                  toggle
                  value={notificationPrefs.notifyOnInterest}
                  onToggle={(v) => updateNotifPref('notifyOnInterest', v)}
                  loading={notifLoading === 'notifyOnInterest'}
                  disabled={notifLoading !== null}
                />
                <SettingItem
                  icon={MessageSquare}
                  label="Message Notifications"
                  description="Get notified when you receive a new message"
                  toggle
                  value={notificationPrefs.notifyOnMessage}
                  onToggle={(v) => updateNotifPref('notifyOnMessage', v)}
                  loading={notifLoading === 'notifyOnMessage'}
                  disabled={notifLoading !== null}
                />
                <SettingItem
                  icon={Users}
                  label="Match Notifications"
                  description="Get notified when you have a new match"
                  toggle
                  value={notificationPrefs.notifyOnMatch}
                  onToggle={(v) => updateNotifPref('notifyOnMatch', v)}
                  loading={notifLoading === 'notifyOnMatch'}
                  disabled={notifLoading !== null}
                />
              </div>
            </motion.div>

            {/* Privacy Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Privacy
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={Eye}
                  label="Show Online Status"
                  description="Let others see when you're online"
                  toggle
                  value={privacyPrefs.showOnlineStatus}
                  onToggle={(v) => updatePrivacyPref('showOnlineStatus', v)}
                  loading={privacyLoading === 'showOnlineStatus'}
                  disabled={privacyLoading !== null}
                />
                <SettingItem
                  icon={Heart}
                  label="Show Likes"
                  description="Let others see posts you've liked"
                  toggle
                  value={privacyPrefs.showLikes}
                  onToggle={(v) => updatePrivacyPref('showLikes', v)}
                  loading={privacyLoading === 'showLikes'}
                  disabled={privacyLoading !== null}
                />
                <SettingItem
                  icon={Clock}
                  label="Show Last Seen"
                  description="Display your last active time"
                  toggle
                  value={privacyPrefs.showLastSeen}
                  onToggle={(v) => updatePrivacyPref('showLastSeen', v)}
                  loading={privacyLoading === 'showLastSeen'}
                  disabled={privacyLoading !== null}
                />
                <SettingItem
                  icon={Globe}
                  label="Profile Visibility"
                  description="Control who can see your profile"
                  value={privacyPrefs.profileVisibility === 'public' ? 'Everyone' :
                         privacyPrefs.profileVisibility === 'verified' ? 'Verified Users' : 'Matches Only'}
                  onClick={() => {
                    const options: ('public' | 'verified' | 'matches')[] = ['public', 'verified', 'matches'];
                    const currentIndex = options.indexOf(privacyPrefs.profileVisibility);
                    const nextIndex = (currentIndex + 1) % options.length;
                    updatePrivacyPref('profileVisibility', options[nextIndex]);
                  }}
                  loading={privacyLoading === 'profileVisibility'}
                  disabled={privacyLoading !== null}
                />
              </div>
            </motion.div>

            {/* Appearance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Appearance
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={preference === 'system' ? Monitor : preference === 'midnight' ? Moon : Sun}
                  label="Theme"
                  description={
                    preference === 'system'
                      ? `Follows your device (currently ${theme === 'midnight' ? 'dark' : 'light'})`
                      : preference === 'midnight'
                        ? 'Dark mode'
                        : 'Light mode'
                  }
                  onClick={() => { playSound('toggle'); toggleTheme(); }}
                />
                <SettingItem
                  icon={Volume2}
                  label="Sound Effects"
                  description="Play sounds on button presses and interactions"
                  toggle
                  value={soundEnabled}
                  onToggle={handleSoundToggle}
                />
              </div>
            </motion.div>

            {/* Help & Support Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Help & Support
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={MessageSquare}
                  label="Chat with Support"
                  description="Get help from the LetsGoHalf team"
                  onClick={() => router.push('/chat?support=true')}
                />
                <SettingItem
                  icon={Megaphone}
                  label="Advertise with Us"
                  description="Promote your listings or services"
                  onClick={() => router.push('/chat?support=true')}
                />
                <SettingItem
                  icon={HelpCircle}
                  label="Report an Issue"
                  description="Let us know about any problems"
                  onClick={() => router.push('/chat?support=true')}
                />
              </div>
            </motion.div>

            {/* Legal Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Legal
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={FileText}
                  label="Terms of Service"
                  description="Read our terms and conditions"
                  onClick={() => router.push('/terms')}
                />
                <SettingItem
                  icon={Shield}
                  label="Privacy Policy"
                  description="How we handle your data"
                  onClick={() => router.push('/privacy')}
                />
              </div>
            </motion.div>

            {/* Account Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mx-5 lg:mx-0 mb-6"
            >
              <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                Account Actions
              </h2>
              <div className="card-glass overflow-hidden divide-y divide-[var(--peach-100)] dark:divide-neutral-800">
                <SettingItem
                  icon={LogOut}
                  label="Log Out"
                  description="Sign out of your account"
                  danger
                  onClick={() => setLogoutModal(true)}
                />
                <SettingItem
                  icon={Trash2}
                  label="Delete Account"
                  description="Permanently delete your account and data"
                  danger
                  onClick={() => setDeleteAccountModal(true)}
                />
              </div>
            </motion.div>

            {/* App Version */}
            <p className="text-center text-xs text-neutral-400 pb-4">
              LetsGohalf v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Edit Email Modal */}
      <EditModal
        isOpen={editEmailModal}
        onClose={() => {
          setEditEmailModal(false);
          setNewEmail('');
          setUpdateError('');
        }}
        title="Update Email"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              Current Email
            </label>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium">
              {user.email || 'Not set'}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              New Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100"
            />
          </div>
          {updateError && (
            <p className="text-sm text-[var(--pink-500)]">{updateError}</p>
          )}
          <button
            onClick={handleEmailUpdate}
            disabled={!newEmail || isUpdating}
            className="w-full py-3 rounded-xl bg-[var(--lime-400)] text-[#212121] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Email
          </button>
        </div>
      </EditModal>

      {/* Edit Phone Modal */}
      <EditModal
        isOpen={editPhoneModal}
        onClose={() => {
          setEditPhoneModal(false);
          setNewPhone('');
          setUpdateError('');
        }}
        title="Update Phone"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              Current Phone
            </label>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium">
              {user.phone || 'Not set'}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              New Phone Number
            </label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Enter new phone number"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100"
            />
          </div>
          {updateError && (
            <p className="text-sm text-[var(--pink-500)]">{updateError}</p>
          )}
          <button
            onClick={handlePhoneUpdate}
            disabled={!newPhone || isUpdating}
            className="w-full py-3 rounded-xl bg-[var(--lime-400)] text-[#212121] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Phone
          </button>
        </div>
      </EditModal>

      {/* Change Password Modal */}
      <EditModal
        isOpen={changePasswordModal}
        onClose={() => {
          setChangePasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setUpdateError('');
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-[var(--teal-400)] text-neutral-900 dark:text-neutral-100"
            />
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-[var(--pink-500)]">Passwords do not match</p>
          )}
          {updateError && (
            <p className="text-sm text-[var(--pink-500)]">{updateError}</p>
          )}
          <button
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isUpdating}
            className="w-full py-3 rounded-xl bg-[var(--lime-400)] text-[#212121] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            Change Password
          </button>
        </div>
      </EditModal>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        danger
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteAccountModal}
        onClose={() => setDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This action cannot be undone. All your data, listings, and messages will be permanently deleted."
        confirmText="Delete Account"
        danger
        loading={isUpdating}
      />

    </AppLayout>
  );
}
