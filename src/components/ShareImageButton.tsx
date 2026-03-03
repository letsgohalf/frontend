'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Instagram, Copy, X, Loader2, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareImageButtonProps {
  postId: string;
  className?: string;
  variant?: 'icon' | 'button' | 'menu-item';
  onClose?: () => void; // Called when modal closes (useful for menu items)
}

export default function ShareImageButton({ postId, className, variant = 'icon', onClose }: ShareImageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${postId}`;
  const imageUrl = `/api/post-image/${postId}`;
  const storyImageUrl = `/api/post-image/${postId}?format=story`;

  const handleShare = async (format: 'square' | 'story') => {
    setIsGenerating(true);
    setError(null);

    try {
      const url = format === 'story' ? storyImageUrl : imageUrl;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to generate image');
      
      const blob = await response.blob();
      
      // Download the image - user can then share from gallery
      // (Web Share API with files requires immediate user gesture, which breaks after async fetch)
      await downloadImage(blob, format);
      
    } catch (err) {
      console.error('Share failed:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const [downloaded, setDownloaded] = useState(false);

  const downloadImage = async (blob?: Blob, format: 'square' | 'story' = 'square') => {
    if (!blob) {
      setIsGenerating(true);
      setError(null);
    }

    try {
      let imageBlob = blob;
      
      if (!imageBlob) {
        const url = format === 'story' ? storyImageUrl : imageUrl;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to generate image');
        imageBlob = await response.blob();
      }

      const blobUrl = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `letsgohalf-${format === 'story' ? 'story' : 'post'}-${postId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      // Show success state
      setDownloaded(true);
      setTimeout(() => {
        setDownloaded(false);
        setIsOpen(false);
        onClose?.();
      }, 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download image');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'icon' ? (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 rounded-full text-neutral-600 dark:text-neutral-400 bg-[var(--peach-100)] dark:bg-neutral-800 transition-colors hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700",
            className
          )}
        >
          <Share2 className="w-5 h-5" />
        </button>
      ) : variant === 'menu-item' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-[var(--peach-50)] dark:hover:bg-neutral-700 transition-colors",
            className
          )}
        >
          <Share2 className="w-4 h-4" />
          Share as Image
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "btn-secondary flex items-center gap-2",
            className
          )}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center"
            onClick={() => {
              if (!isGenerating) {
                setIsOpen(false);
                onClose?.();
              }
            }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--peach-200)] dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Share Post
                </h3>
                <button
                  onClick={() => {
                    if (!isGenerating) {
                      setIsOpen(false);
                      onClose?.();
                    }
                  }}
                  disabled={isGenerating}
                  className="w-8 h-8 rounded-full bg-[var(--peach-100)] dark:bg-neutral-800 flex items-center justify-center hover:bg-[var(--peach-200)] dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Share as Image Section */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    Share as Image
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Square (Feed) */}
                    <button
                      onClick={() => handleShare('square')}
                      disabled={isGenerating || downloaded}
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-[var(--peach-100)] to-[var(--pink-100)] dark:from-neutral-800 dark:to-neutral-800 hover:from-[var(--peach-200)] hover:to-[var(--pink-200)] dark:hover:from-neutral-700 dark:hover:to-neutral-700 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal-500)]" />
                      ) : downloaded ? (
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-sm">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
                          <ImageIcon className="w-6 h-6 text-[var(--teal-500)]" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                          {downloaded ? 'Saved!' : 'Square'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          For feed posts
                        </p>
                      </div>
                    </button>

                    {/* Story Format */}
                    <button
                      onClick={() => handleShare('story')}
                      disabled={isGenerating || downloaded}
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-[var(--lavender-100)] to-[var(--teal-100)] dark:from-neutral-800 dark:to-neutral-800 hover:from-[var(--lavender-200)] hover:to-[var(--teal-200)] dark:hover:from-neutral-700 dark:hover:to-neutral-700 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--lavender-500)]" />
                      ) : downloaded ? (
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-sm">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
                          <Instagram className="w-6 h-6 text-[var(--lavender-500)]" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                          {downloaded ? 'Saved!' : 'Story'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          For IG/WhatsApp
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--peach-200)] dark:bg-neutral-800" />
                  <span className="text-xs text-neutral-400">or</span>
                  <div className="flex-1 h-px bg-[var(--peach-200)] dark:bg-neutral-800" />
                </div>

                {/* Copy Link & Download */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    )}
                    <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
                      {copied ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>

                  <button
                    onClick={() => downloadImage(undefined, 'square')}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--peach-50)] dark:bg-neutral-800 hover:bg-[var(--peach-100)] dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
                      Download
                    </span>
                  </button>
                </div>

                {/* Helper text */}
                <p className="text-xs text-center text-neutral-400 dark:text-neutral-500 pt-2">
                  {downloaded 
                    ? '✅ Image saved! Share it from your gallery/downloads'
                    : 'Image will download — share it to Instagram, WhatsApp & more'}
                </p>
              </div>

              {/* Safe area padding for mobile */}
              <div className="h-safe-area-inset-bottom" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
