'use client';

import { cn } from '@/lib/utils';

interface BadgeShapeProps {
  children: React.ReactNode;
  className?: string;
  bgClassName?: string;
  style?: React.CSSProperties;
}

/**
 * A 12-pointed rosette badge shape using CSS clip-path.
 * Wraps children (icon) in a proper verification-badge shape.
 */
export default function BadgeShape({ children, className, bgClassName, style }: BadgeShapeProps) {
  return (
    <span
      className={cn('inline-flex items-center justify-center flex-shrink-0', className)}
      style={{
        clipPath:
          'polygon(50% 0%, 61% 8%, 75% 3%, 80% 18%, 97% 22%, 92% 38%, 100% 50%, 92% 62%, 97% 78%, 80% 82%, 75% 97%, 61% 92%, 50% 100%, 39% 92%, 25% 97%, 20% 82%, 3% 78%, 8% 62%, 0% 50%, 8% 38%, 3% 22%, 20% 18%, 25% 3%, 39% 8%)',
        ...style,
      }}
    >
      <span className={cn('inline-flex items-center justify-center w-full h-full', bgClassName)}>
        {children}
      </span>
    </span>
  );
}
