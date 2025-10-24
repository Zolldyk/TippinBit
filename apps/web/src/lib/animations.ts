/**
 * Animation Configuration
 *
 * Centralized animation variants and utilities using Motion library (v12.23.22).
 * All animations use GPU-accelerated properties only (transform, opacity, filter)
 * and respect prefers-reduced-motion accessibility setting.
 *
 * @see docs/stories/3.3.story.md for requirements
 */

import { Variants, Transition } from "motion/react";
import { useReducedMotion as useMotionReducedMotion } from "motion/react";

/**
 * Animation timing constants matching AC requirements
 */
export const ANIMATION_TIMING = {
  // Buttons (AC 2, 3)
  BUTTON_HOVER_DURATION: 0.15, // 150ms
  BUTTON_ACTIVE_DURATION: 0.1, // 100ms

  // Modals (AC 4, 5)
  MODAL_BACKDROP_DURATION: 0.2, // 200ms
  MODAL_ENTRY_DURATION: 0.25, // 250ms
  MODAL_EXIT_DURATION: 0.2, // 200ms

  // Mobile (AC 6)
  BOTTOM_SHEET_DURATION: 0.3, // 300ms

  // Forms (AC 7, 8)
  INPUT_FOCUS_DURATION: 0.15, // 150ms
  VALIDATION_ICON_DURATION: 0.2, // 200ms
  VALIDATION_SHAKE_DURATION: 0.4, // 400ms

  // Confirmation (AC 9)
  CHECKMARK_DRAW_DURATION: 0.6, // 600ms
  STAGGER_DELAY: 0.05, // 50ms

  // Toasts (AC 10)
  TOAST_ENTRY_DURATION: 0.3, // 300ms
  TOAST_AUTO_DISMISS: 3000, // 3 seconds
  TOAST_EXIT_DURATION: 0.2, // 200ms

  // Loading (AC 11)
  SKELETON_LOOP_DURATION: 1.5, // 1.5s
  SPINNER_DELAY: 0.5, // 500ms
  SPINNER_FADE_DURATION: 0.3, // 300ms
} as const;

/**
 * Easing functions for smooth animations
 */
export const EASING = {
  easeOut: [0.22, 1, 0.36, 1] as const, // Smooth deceleration
  easeIn: [0.4, 0, 1, 1] as const, // Smooth acceleration
  bounce: [0.68, -0.55, 0.265, 1.55] as const, // Bounce effect
} as const;

/**
 * Button animation variants (AC 2, 3, 12)
 * Desktop only hover effect, uses GPU-accelerated scale
 */
export const buttonVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: ANIMATION_TIMING.BUTTON_HOVER_DURATION,
      ease: EASING.easeOut,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: ANIMATION_TIMING.BUTTON_ACTIVE_DURATION,
      ease: EASING.easeIn,
    },
  },
};

/**
 * Modal animation variants (AC 4, 5, 12)
 * Entry: slide up from center with scale
 * Exit: scale down with opacity fade
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.MODAL_ENTRY_DURATION,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: ANIMATION_TIMING.MODAL_EXIT_DURATION,
      ease: EASING.easeIn,
    },
  },
};

/**
 * Modal backdrop variants (AC 4, 5)
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: ANIMATION_TIMING.MODAL_BACKDROP_DURATION },
  },
  exit: {
    opacity: 0,
    transition: { duration: ANIMATION_TIMING.MODAL_BACKDROP_DURATION },
  },
};

/**
 * Bottom sheet variants for mobile (AC 6, 12)
 * Slides up from bottom with swipe-to-dismiss support
 */
export const bottomSheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: {
      duration: ANIMATION_TIMING.BOTTOM_SHEET_DURATION,
      ease: EASING.easeOut,
    },
  },
  exit: {
    y: "100%",
    transition: {
      duration: ANIMATION_TIMING.BOTTOM_SHEET_DURATION,
      ease: EASING.easeIn,
    },
  },
};

/**
 * Validation icon variants (AC 8, 12)
 * Success: fade in + slide from right
 * Error: fade in + shake animation
 */
export const validationIconVariants: Variants = {
  success: {
    opacity: [0, 1],
    x: [10, 0],
    transition: { duration: ANIMATION_TIMING.VALIDATION_ICON_DURATION },
  },
  error: {
    opacity: [0, 1],
    x: [0, -5, 5, -3, 3, 0], // Gentle shake (3 small horizontal movements)
    transition: { duration: ANIMATION_TIMING.VALIDATION_SHAKE_DURATION },
  },
};

/**
 * Toast notification variants (AC 10, 12)
 * Entry: slide from top with bounce
 * Exit: fade out
 */
export const toastVariants: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: ANIMATION_TIMING.TOAST_ENTRY_DURATION,
      ease: EASING.bounce,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: ANIMATION_TIMING.TOAST_EXIT_DURATION },
  },
};

/**
 * Confirmation page stagger variants (AC 9, 12)
 * Container staggers children fade-in by 50ms
 */
export const confirmationContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ANIMATION_TIMING.STAGGER_DELAY,
    },
  },
};

/**
 * Confirmation page child variants (AC 9)
 */
export const confirmationChildVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Hook to check if user prefers reduced motion (AC 14)
 * Returns true if animations should be disabled/reduced
 *
 * @returns {boolean} true if user has requested reduced motion
 */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}

/**
 * Get transition with reduced motion support (AC 14)
 * Returns instant transition (0ms) if user prefers reduced motion
 *
 * @param {Transition} normalTransition - The normal animation transition
 * @param {boolean} shouldReduceMotion - Whether to reduce motion
 * @returns {Transition} The appropriate transition
 */
export function getTransition(
  normalTransition: Transition,
  shouldReduceMotion: boolean
): Transition {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }
  return normalTransition;
}
