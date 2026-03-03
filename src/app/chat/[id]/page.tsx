'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page handles direct links to conversations like /chat/[conversationId]
// It redirects to the main chat page with the conversationId as a query parameter
export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  useEffect(() => {
    if (conversationId) {
      // Redirect to the main chat page with the conversationId
      router.replace(`/chat?conversationId=${conversationId}`);
    }
  }, [conversationId, router]);

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
        <p className="text-neutral-500">Loading conversation...</p>
      </div>
    </div>
  );
}
