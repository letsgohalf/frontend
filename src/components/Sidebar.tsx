'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  MessageSquare,
  User,
  Plus,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Bell,
  PenLine,
  Building2,
  Users,
  Repeat2,
  ShoppingBasket,
  Handshake,
  Car,
  Navigation,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

const navItems = [
  { id: 'home', icon: Home, label: 'Home', href: '/' },
  { id: 'explore', icon: Search, label: 'Explore', href: '/explore' },
  { id: 'carpool', icon: Car, label: 'Carpool', href: '/carpool/find' },
  { id: 'chat', icon: MessageSquare, label: 'Messages', href: '/chat' },
  { id: 'notifications', icon: Bell, label: 'Notifications', href: '/notifications' },
  { id: 'profile', icon: User, label: 'Profile', href: '/profile' },
];

const baseCreateMenuItems: { label: string; icon: typeof PenLine; route: string; color: string; special?: boolean }[] = [
  { label: 'Make a Post', icon: PenLine, route: '/create', color: 'text-neutral-700 dark:text-neutral-300' },
  { label: 'House for Rent/Sale', icon: Building2, route: '/create?type=house-listing', color: 'text-orange-600 dark:text-orange-400' },
  { label: 'I Need a Roommate', icon: Users, route: '/create?type=looking-for-roommate', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Split a Subscription', icon: Repeat2, route: '/create?type=subscription-split', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Split Groceries', icon: ShoppingBasket, route: '/create?type=grocery-split', color: 'text-green-600 dark:text-green-400' },
  { label: 'Offer a Ride', icon: Car, route: '/create?type=carpool-offer', color: 'text-sky-600 dark:text-sky-400' },
  { label: 'Find a Ride', icon: Navigation, route: '/create?type=carpool-request', color: 'text-amber-600 dark:text-amber-400' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, promptAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const createMenuItems = [
    ...baseCreateMenuItems,
    user?.isPartner
      ? { label: 'Partner Dashboard', icon: Handshake, route: '/partner-dashboard', color: 'text-[var(--teal-600)] dark:text-[var(--teal-400)]', special: true as const }
      : { label: 'Become a Partner', icon: Handshake, route: '/become-partner', color: 'text-[var(--teal-600)] dark:text-[var(--teal-400)]', special: true as const },
  ];

  // Collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Close create menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    if (showCreateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCreateMenu]);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    playSound('toggle');
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    // Dispatch custom event so AppLayout can respond
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: newState } }));
  };

  const handleCreateClick = () => {
    setShowCreateMenu((prev) => {
      playSound(prev ? 'swooshDown' : 'swooshUp');
      return !prev;
    });
  };

  const handleMenuItemClick = (route: string) => {
    playSound('click');
    setShowCreateMenu(false);
    if (!isAuthenticated && route !== '/become-partner') {
      promptAuth('Sign in to create a post');
      return;
    }
    router.push(route);
  };

  return (
    <aside className={cn('sidebar', isCollapsed && 'sidebar-collapsed')}>
      {/* Header with Logo and Collapse Button */}
      <div className="sidebar-header flex-col gap-3">
        {!isCollapsed ? (
          <div className="w-full flex items-center justify-between">
            <Link href="/" className="flex-1 flex justify-center">
              <Image
                src="/logo/letsgohalf-main-logo-trimmed.png"
                alt="LetsGoHalf"
                width={797}
                height={219}
                className="h-12 w-auto dark:hidden"
                priority
              />
              <Image
                src="/logo/letsgohalf-main-logo-white-trimmed.png"
                alt="LetsGoHalf"
                width={797}
                height={219}
                className="h-12 w-auto hidden dark:block"
                priority
              />
            </Link>
            <button
              onClick={toggleCollapsed}
              className="sidebar-collapse-btn"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <Link href="/" className="flex items-center justify-center">
              <Image
                src="/logo/letsgohalf-icon-logo-trimmed.png"
                alt="LetsGoHalf"
                width={504}
                height={504}
                className="w-10 h-10 dark:hidden"
                priority
              />
              <Image
                src="/logo/letsgohalf-icon-logo-white-trimmed.png"
                alt="LetsGoHalf"
                width={504}
                height={504}
                className="w-10 h-10 hidden dark:block"
                priority
              />
            </Link>
            <button
              onClick={toggleCollapsed}
              className="sidebar-collapse-btn sidebar-collapse-btn-centered"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className={cn('sidebar-item', isActive && 'active')}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Theme Toggle */}
        <button
          onClick={() => { playSound('toggle'); toggleTheme(); }}
          className="sidebar-item"
          title={isCollapsed ? (theme === 'daylight' ? 'Dark Mode' : 'Light Mode') : undefined}
        >
          {theme === 'daylight' ? (
            <>
              <Moon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          ) : (
            <>
              <Sun className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          )}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          prefetch={true}
          className={cn('sidebar-item', pathname === '/settings' && 'active')}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* Create Post Button + Popover */}
      <div className="relative" ref={createMenuRef}>
        <AnimatePresence>
          {showCreateMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                "absolute bottom-full mb-2 z-50 rounded-xl overflow-hidden shadow-xl border border-[var(--peach-200)] dark:border-neutral-700 bg-white dark:bg-neutral-900",
                isCollapsed ? "left-full ml-2 bottom-0 mb-0 w-56" : "left-0 right-0 w-full"
              )}
            >
              <div className="py-1.5">
                {createMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleMenuItemClick(item.route)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors",
                      item.special
                        ? "bg-gradient-to-r from-[var(--teal-50)] to-[var(--lime-50)] dark:from-[var(--teal-900)]/30 dark:to-[var(--lime-900)]/30 hover:from-[var(--teal-100)] hover:to-[var(--lime-100)] dark:hover:from-[var(--teal-900)]/50 dark:hover:to-[var(--lime-900)]/50"
                        : "hover:bg-[var(--peach-50)] dark:hover:bg-neutral-800"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      item.special
                        ? "bg-[var(--teal-100)] dark:bg-[var(--teal-900)]"
                        : "bg-[var(--peach-100)] dark:bg-neutral-800"
                    )}>
                      <item.icon className={cn("w-4 h-4", item.color)} />
                    </div>
                    <span className={cn(
                      "font-medium",
                      item.special
                        ? "text-[var(--teal-700)] dark:text-[var(--teal-300)]"
                        : "text-neutral-800 dark:text-neutral-200"
                    )}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCreateClick}
          className={cn('sidebar-create-btn', isCollapsed && 'sidebar-create-btn-collapsed')}
          title={isCollapsed ? 'Create Post' : undefined}
        >
          <motion.div
            animate={{ rotate: showCreateMenu ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </motion.div>
          {!isCollapsed && <span>Create Post</span>}
        </button>
      </div>

      {/* User Profile / Auth */}
      {isAuthenticated && user ? (
        <div className={cn(
          "rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800",
          isCollapsed ? "p-2 flex justify-center" : "flex items-center gap-3 p-3"
        )}>
          <Avatar className={cn("ring-2 ring-white dark:ring-neutral-700", isCollapsed ? "w-9 h-9" : "w-10 h-10")}>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-[var(--lime-400)] to-[var(--yellow-400)] text-sm">
              {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user.email || user.phone}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4 text-neutral-500" />
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => promptAuth('Sign in to access all features')}
          className={cn(
            "rounded-xl bg-[var(--peach-100)] dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors",
            isCollapsed ? "w-full p-3 flex justify-center" : "w-full py-3 px-4"
          )}
          title={isCollapsed ? 'Sign In' : undefined}
        >
          {isCollapsed ? <User className="w-5 h-5" /> : 'Sign In'}
        </button>
      )}
    </aside>
  );
}
