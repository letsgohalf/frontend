'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import FloatingActionButton from './FloatingActionButton';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showFab?: boolean;
  showBottomNav?: boolean;
}

export default function AppLayout({
  children,
  activeTab = 'home',
  onTabChange = () => {},
  showFab = true,
  showBottomNav = true,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load initial state from localStorage and listen for changes
  useEffect(() => {
    // Check initial state
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }

    // Listen for toggle events
    const handleToggle = (e: CustomEvent<{ collapsed: boolean }>) => {
      setSidebarCollapsed(e.detail.collapsed);
    };

    window.addEventListener('sidebar-toggle', handleToggle as EventListener);
    return () => {
      window.removeEventListener('sidebar-toggle', handleToggle as EventListener);
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar - Visible on lg+ screens */}
      <Sidebar />

      {/* Main Content */}
      <main className={cn('main-content', sidebarCollapsed && 'main-content-sidebar-collapsed')}>
        {children}
      </main>

      {/* Mobile Navigation - Hidden on lg+ screens */}
      {showFab && <FloatingActionButton />}
      {showBottomNav && <BottomNav activeTab={activeTab} onTabChange={onTabChange} />}
    </div>
  );
}
