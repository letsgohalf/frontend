'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings#notifications');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
    </div>
  );
}
