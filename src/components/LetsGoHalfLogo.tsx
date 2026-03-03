'use client';

import { cn } from '@/lib/utils';

interface LetsGoHalfLogoProps {
  className?: string;
}

/**
 * Inline SVG of the LetsGoHalf split-receipt logo mark.
 * Renders the two receipt halves with horizontal lines.
 */
export default function LetsGoHalfLogo({ className }: LetsGoHalfLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={cn('w-3 h-3', className)}
    >
      <g transform="translate(100, 100)">
        {/* Left half of receipt */}
        <path
          d="M-8 -65 L-50 -65 L-50 55 L-45 50 L-40 55 L-35 50 L-30 55 L-25 50 L-20 55 L-15 50 L-8 55 Z"
          fill="currentColor"
        />
        {/* Right half of receipt */}
        <path
          d="M8 -65 L50 -65 L50 55 L45 50 L40 55 L35 50 L30 55 L25 50 L20 55 L15 50 L8 55 Z"
          fill="currentColor"
        />
        {/* Lines on left receipt */}
        <line x1="-42" y1="-45" x2="-15" y2="-45" stroke="#fff" strokeWidth="4" />
        <line x1="-42" y1="-25" x2="-15" y2="-25" stroke="#fff" strokeWidth="4" />
        <line x1="-42" y1="-5" x2="-15" y2="-5" stroke="#fff" strokeWidth="4" />
        <line x1="-42" y1="20" x2="-20" y2="20" stroke="#fff" strokeWidth="5" />
        {/* Lines on right receipt */}
        <line x1="15" y1="-45" x2="42" y2="-45" stroke="#fff" strokeWidth="4" />
        <line x1="15" y1="-25" x2="42" y2="-25" stroke="#fff" strokeWidth="4" />
        <line x1="15" y1="-5" x2="42" y2="-5" stroke="#fff" strokeWidth="4" />
        <line x1="20" y1="20" x2="42" y2="20" stroke="#fff" strokeWidth="5" />
      </g>
    </svg>
  );
}
