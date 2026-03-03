'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import {
  MapPin,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  BadgeCheck,
  Wallet,
  Users,
  Eye,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/api/posts';
import { resolveImageUrl } from '@/lib/utils/image';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sounds';

interface SwipeablePostCardProps {
  post: Post;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

// Brand color gradients for cards without images
const cardGradients = [
  'from-[var(--teal-300)] via-[var(--teal-400)] to-[var(--lime-400)]',
  'from-[var(--peach-300)] via-[var(--peach-400)] to-[var(--pink-400)]',
  'from-[var(--lavender-300)] via-[var(--lavender-400)] to-[var(--pink-300)]',
  'from-[var(--lime-300)] via-[var(--lime-400)] to-[var(--yellow-400)]',
  'from-[var(--pink-300)] via-[var(--pink-400)] to-[var(--peach-400)]',
  'from-[var(--yellow-300)] via-[var(--peach-400)] to-[var(--pink-300)]',
  'from-[var(--teal-400)] via-[var(--lavender-400)] to-[var(--pink-400)]',
  'from-[var(--lime-400)] via-[var(--teal-400)] to-[var(--lavender-400)]',
];

// Get a consistent gradient based on post ID
const getGradientForPost = (postId: string): string => {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = ((hash << 5) - hash) + postId.charCodeAt(i);
    hash = hash & hash;
  }
  return cardGradients[Math.abs(hash) % cardGradients.length];
};

export default function SwipeablePostCard({ post, onSwipeLeft, onSwipeRight, isTop }: SwipeablePostCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Overlay indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const images = post.images && post.images.length > 0 ? post.images : [];
  const hasMultipleImages = images.length > 1;

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x > 100) {
      setExitX(300);
      playSound('swipeRight');
      onSwipeRight();
    } else if (info.offset.x < -100) {
      setExitX(-300);
      playSound('swipeLeft');
      onSwipeLeft();
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleCardClick = () => {
    if (!isDragging) {
      router.push(`/post/${post.id}`);
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute w-full cursor-grab active:cursor-grabbing",
        !isTop && "pointer-events-none"
      )}
      style={{ 
        x, 
        rotate, 
        opacity,
        zIndex: isTop ? 10 : 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
    >
      <div 
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className={cn(
          "relative aspect-[4/5]",
          images.length > 0 
            ? "bg-neutral-100 dark:bg-neutral-800" 
            : `bg-gradient-to-br ${getGradientForPost(post.id)}`
        )}>
          {images.length > 0 ? (
            <img
              src={resolveImageUrl(images[currentImageIndex])}
              alt={post.content}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {/* Decorative circles */}
              <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute bottom-20 left-8 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-white/5" />
              
              {/* User avatar or icon */}
              {post.author?.avatar ? (
                <img
                  src={resolveImageUrl(post.author.avatar)}
                  alt={post.author.name}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-white/30 shadow-xl"
                  draggable={false}
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                  <User className="w-14 h-14 text-white/80" />
                </div>
              )}
              
              {/* Author name on no-image cards */}
              <p className="mt-4 text-white font-semibold text-lg drop-shadow-md">
                {post.author?.name || 'Anonymous'}
              </p>
            </div>
          )}

          {/* Image Navigation Dots */}
          {hasMultipleImages && (
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-4">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === currentImageIndex
                      ? "w-8 bg-white"
                      : "w-4 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Image Navigation Buttons */}
          {hasMultipleImages && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {currentImageIndex < images.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}

          {/* Swipe Indicators */}
          <motion.div
            className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-[var(--lime-400)] text-[#212121] font-bold text-xl rotate-12 border-4 border-[var(--lime-500)]"
            style={{ opacity: likeOpacity }}
          >
            INTERESTED
          </motion.div>
          <motion.div
            className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-[var(--pink-400)] text-white font-bold text-xl -rotate-12 border-4 border-[var(--pink-500)]"
            style={{ opacity: nopeOpacity }}
          >
            SKIP
          </motion.div>

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Bottom Info on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            {/* Author */}
            <div className="flex items-center gap-2 mb-2">
              {post.author?.avatar ? (
                <img
                  src={resolveImageUrl(post.author.avatar)}
                  alt={post.author.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
              <span className="font-semibold">{post.author?.name || 'Anonymous'}</span>
              {post.author?.isVerified && (
                <BadgeCheck className="w-4 h-4 text-[var(--teal-400)]" />
              )}
            </div>

            {/* Location & Budget */}
            <div className="flex items-center gap-4 text-sm text-white/80">
              {post.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{post.location}</span>
                </div>
              )}
              {post.budget > 0 && (
                <div className="flex items-center gap-1">
                  <Wallet className="w-4 h-4" />
                  <span>{formatCurrency(post.budget)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Promoted Badge */}
          {post.promotionType && post.promotionType !== 'none' && (
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--yellow-400)] to-[var(--peach-400)] text-[10px] font-bold text-neutral-900 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {post.promotionType === 'sponsored' ? 'SPONSORED' : 'PROMOTED'}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          <p className="text-neutral-700 dark:text-neutral-300 text-sm line-clamp-2 mb-4">
            {post.content}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            {post.spotsAvailable > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{post.spotsAvailable} spot{post.spotsAvailable > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{post.viewsCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{post.interestedCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Swipeable Stack Component ───

interface SwipeableStackProps {
  posts: Post[];
  onSwipeLeft: (post: Post) => void;
  onSwipeRight: (post: Post) => void;
  onEmpty?: () => void;
}

export function SwipeableStack({ posts, onSwipeLeft, onSwipeRight, onEmpty }: SwipeableStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = () => {
    const post = posts[currentIndex];
    onSwipeLeft(post);
    if (currentIndex === posts.length - 1) {
      onEmpty?.();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    const post = posts[currentIndex];
    onSwipeRight(post);
    if (currentIndex === posts.length - 1) {
      onEmpty?.();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleSwipeLeft();
    } else {
      handleSwipeRight();
    }
  };

  const visiblePosts = posts.slice(currentIndex, currentIndex + 2);

  if (visiblePosts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Cards Stack */}
      <div className="relative h-[580px] sm:h-[620px]">
        <AnimatePresence>
          {visiblePosts.map((post, i) => (
            <SwipeablePostCard
              key={post.id}
              post={post}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isTop={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={() => handleButtonSwipe('left')}
          className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center border-2 border-[var(--pink-200)] dark:border-[var(--pink-400)]/30 hover:scale-110 hover:border-[var(--pink-400)] transition-all group"
        >
          <X className="w-7 h-7 text-[var(--pink-400)] group-hover:scale-110 transition-transform" />
        </button>
        
        <button
          onClick={() => handleButtonSwipe('right')}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--lime-400)] to-[var(--teal-400)] shadow-lg flex items-center justify-center hover:scale-110 transition-all group"
        >
          <Heart className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-500">
          {currentIndex + 1} of {posts.length}
        </p>
        <div className="w-48 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--teal-400)] to-[var(--lime-400)] rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / posts.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
