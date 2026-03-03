'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import interestThreadsApi from '@/lib/api/interest-threads';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default function RepostPage({ params }: PageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRepost = async () => {
    try {
      setLoading(true);
      setError(null);
      const newPost = await interestThreadsApi.repost(postId);
      router.push(`/posts/${newPost.id}/edit`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create new post');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Repost Listing</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-xl p-6 border text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Copy className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Create a New Listing</h2>
          <p className="text-gray-600 mb-6">
            This will create a new post with the same details as your matched listing.
            You can edit it before publishing.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRepost}
            disabled={loading}
            className="w-full py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Create New Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
