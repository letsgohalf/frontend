'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Post } from '@/lib/api/posts';

const CarpoolMap = dynamic(() => import('./CarpoolMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[280px] rounded-2xl bg-[var(--peach-50)] dark:bg-neutral-800 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--teal-500)]" />
    </div>
  ),
});

interface CarpoolMapWrapperProps {
  posts: Post[];
  viewerLat?: number | null;
  viewerLng?: number | null;
  mode: 'find' | 'offer';
  onPostClick?: (postId: string) => void;
}

export default function CarpoolMapWrapper(props: CarpoolMapWrapperProps) {
  return <CarpoolMap {...props} />;
}
