'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

const navItems = [
  { id: 'home', icon: Home, label: 'Home', path: '/' },
  { id: 'search', icon: Search, label: 'Search', path: '/explore' },
  { id: 'chat', icon: MessageCircle, label: 'Chat', path: '/chat' },
  { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
];

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function BottomNav({ onTabChange }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.path ||
          (item.path !== '/' && pathname.startsWith(item.path));
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.path}
            prefetch={true}
            onClick={() => { playSound('tab'); onTabChange?.(item.id); }}
            className={cn('bottom-nav-item', isActive && 'active')}
          >
            <Icon className="w-5 h-5" />
            {isActive && (
              <span className="text-sm font-semibold">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
