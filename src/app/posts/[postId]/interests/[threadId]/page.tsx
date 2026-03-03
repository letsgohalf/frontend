'use client';

import { use } from 'react';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ postId: string; threadId: string }>;
}

export default function ThreadDetailPage({ params }: PageProps) {
  const { threadId } = use(params);
  
  // Redirect to the unified thread page with embedded chat
  redirect(`/interest/${threadId}`);
}
