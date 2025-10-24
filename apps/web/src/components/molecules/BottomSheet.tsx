/**
 * BottomSheet component for mobile slide-up interactions
 *
 * Mobile-only (<768px) component that slides up from the bottom of the screen.
 * Supports swipe-down gesture to dismiss (drag >100px down).
 * On desktop, consumers should use regular Modal components instead.
 *
 * AC 6: Mobile bottom sheet slide animation with swipe-to-dismiss
 * AC 12: Uses GPU-accelerated properties only (transform, opacity)
 * AC 14: Respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * <BottomSheet isOpen={showSheet} onClose={() => setShowSheet(false)}>
 *   <h2>Sheet Content</h2>
 *   <p>Swipe down to close</p>
 * </BottomSheet>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { bottomSheetVariants, backdropVariants, useReducedMotion } from '@/lib/animations';

export interface BottomSheetProps {
  /**
   * Whether the bottom sheet is visible
   */
  isOpen: boolean;

  /**
   * Callback when the sheet should close
   */
  onClose: () => void;

  /**
   * Content to display in the sheet
   */
  children: ReactNode;

  /**
   * Optional title for accessibility
   */
  title?: string;
}

/**
 * BottomSheet component
 * Mobile-only component that slides up from bottom with swipe-to-dismiss
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title = 'Bottom Sheet',
}: BottomSheetProps) {
  const shouldReduceMotion = useReducedMotion();

  /**
   * Handle drag end event - close if dragged down >100px
   * AC 6: Swipe-down gesture to dismiss
   */
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Close if dragged down more than 100px
    if (info.offset.y > 100) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // Mobile only: md:hidden hides on screens >=768px
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop with fade animation */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            {...(!shouldReduceMotion && { variants: backdropVariants })}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Sheet content - slides up from bottom */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl shadow-xl border-t border-neutral-800 max-h-[85vh] flex flex-col"
            {...(!shouldReduceMotion && { variants: bottomSheetVariants })}
            initial="hidden"
            animate="visible"
            exit="exit"
            // AC 6: Swipe-to-dismiss with drag gesture
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Drag handle indicator */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div
                className="w-12 h-1 bg-neutral-600 rounded-full"
                aria-hidden="true"
              />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
