/**
 * Skeleton loading component with shimmer animation
 *
 * Features:
 * - Shimmer effect with gradient moving left-to-right (AC 11)
 * - 1.5s loop duration (AC 11)
 * - GPU-accelerated with translateX transform (AC 12)
 * - Respects prefers-reduced-motion (AC 14)
 * - Multiple shape variants (text, circle, rectangle)
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" />
 * <Skeleton variant="circle" className="w-12 h-12" />
 * <Skeleton variant="rectangle" className="w-full h-24" />
 * ```
 */

'use client';

import { motion } from 'motion/react';
import { useReducedMotion, ANIMATION_TIMING } from '@/lib/animations';

export type SkeletonVariant = 'text' | 'circle' | 'rectangle';

export interface SkeletonProps {
  /**
   * Shape variant
   * @default 'text'
   */
  variant?: SkeletonVariant;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  circle: 'rounded-full',
  rectangle: 'rounded-lg',
};

/**
 * Skeleton component
 * Displays animated placeholder for loading content
 */
export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative overflow-hidden bg-neutral-200 ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    >
      {/* AC 11, 12: Shimmer effect with GPU-accelerated transform */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            // AC 12: GPU-accelerated transform
            willChange: 'transform',
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: ANIMATION_TIMING.SKELETON_LOOP_DURATION,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

/**
 * SkeletonGroup component for common loading patterns
 */
export function SkeletonCard() {
  return (
    <div className="w-full rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="rectangle" className="w-full h-32" />
    </div>
  );
}

/**
 * SkeletonList for list loading states
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
