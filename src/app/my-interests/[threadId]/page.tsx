'use client';

import { use } from 'react';
import { InterestThreadDetail } from '@/components/interest';

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default function ThreadDetailPage({ params }: PageProps) {
  const { threadId } = use(params);

  return <InterestThreadDetail threadId={threadId} />;
}
