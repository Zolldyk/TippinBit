'use client';

import { motion } from 'motion/react';
import {
  useReducedMotion,
  ANIMATION_TIMING,
} from '@/lib/animations';

interface SpinnerProps {
  /**
   * Size of the spinner in pixels
   * @default 20
   */
  size?: number;
  /**
   * Color of the spinner
   * @default 'currentColor'
   */
  color?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Spinner component for loading states
 *
 * AC 11: Fades in (opacity 0→1) after 500ms delay, 300ms transition
 * AC 14: Respects prefers-reduced-motion (instant appearance)
 *
 * Uses a CSS animation for smooth rotation with accessible markup.
 */
export function Spinner({
  size = 20,
  color = 'currentColor',
  className = '',
}: SpinnerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      aria-label="Loading"
      className={`inline-block ${className}`}
      // AC 11: Delayed fade-in animation
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: ANIMATION_TIMING.SPINNER_FADE_DURATION,
              delay: ANIMATION_TIMING.SPINNER_DELAY,
            }
      }
    >
      <svg
        className="animate-spin motion-reduce:animate-none"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill={color}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </motion.div>
  );
}
