/**
 * Toast notification component with animations
 *
 * Features:
 * - Slide in from top with bounce easing (AC 10)
 * - Auto-dismiss after 3 seconds with fade-out (AC 10)
 * - Fixed position at top of viewport (AC 10)
 * - Supports multiple toasts with stacking (AC 10)
 * - GPU-accelerated animations (AC 12)
 * - Respects prefers-reduced-motion (AC 14)
 *
 * @example
 * ```tsx
 * <Toast
 *   id="toast-1"
 *   message="Tip sent successfully!"
 *   type="success"
 *   onDismiss={() => handleDismiss('toast-1')}
 * />
 * ```
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import {
  toastVariants,
  useReducedMotion,
  ANIMATION_TIMING,
} from '@/lib/animations';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  /**
   * Unique ID for the toast
   */
  id: string;

  /**
   * Toast message text
   */
  message: string;

  /**
   * Toast type (determines icon and color)
   * @default 'info'
   */
  type?: ToastType;

  /**
   * Callback when toast should be dismissed
   */
  onDismiss: (id: string) => void;

  /**
   * Auto-dismiss duration in milliseconds
   * @default 3000 (3 seconds per AC 10)
   */
  autoDismissMs?: number;
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-900/90 border-green-600 text-green-100',
  error: 'bg-red-900/90 border-red-600 text-red-100',
  info: 'bg-blue-900/90 border-blue-600 text-blue-100',
};

const toastIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
};

/**
 * Toast component
 * Displays animated notification messages with auto-dismiss
 */
export function Toast({
  id,
  message,
  type = 'info',
  onDismiss,
  autoDismissMs = ANIMATION_TIMING.TOAST_AUTO_DISMISS,
}: ToastProps) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = toastIcons[type];

  // AC 10: Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [id, onDismiss, autoDismissMs]);

  return (
    <motion.div
      {...(!shouldReduceMotion && { variants: toastVariants })}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-sm ${toastStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="transition-colors hover:opacity-70"
        aria-label="Dismiss notification"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}

/**
 * ToastContainer component
 * Manages multiple toast notifications with AnimatePresence
 *
 * @example
 * ```tsx
 * <ToastContainer toasts={activeToasts} onDismiss={handleDismiss} />
 * ```
 */
export interface ToastContainerProps {
  /**
   * Array of active toasts to display
   */
  toasts: Omit<ToastProps, 'onDismiss'>[];

  /**
   * Callback when a toast should be dismissed
   */
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    // AC 10: Fixed container at top of viewport (z-index 9999)
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
