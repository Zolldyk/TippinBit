/**
 * Button atom component with variants and states
 *
 * Variants:
 * - primary: Coral background, white text (main CTAs)
 * - secondary: Outlined with coral border (secondary actions)
 * - tertiary: Text-only coral color (low-emphasis actions)
 *
 * States: default, hover, active, disabled, loading
 *
 * Accessibility: 44px min touch target, keyboard nav, ARIA labels
 */

'use client';

import { ButtonHTMLAttributes, useCallback } from 'react';
import { motion, type MotionStyle } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { BaseComponentProps, ButtonVariant } from '@/types/components';
import { buttonVariants, useReducedMotion } from '@/lib/animations';

export interface ButtonProps
  extends BaseComponentProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      | 'className'
      | 'style'
      | 'onDrag'
      | 'onDragStart'
      | 'onDragEnd'
      | 'onAnimationStart'
      | 'onAnimationEnd'
      | 'onAnimationIteration'
    > {
  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Loading state - shows spinner, disables interaction
   * @default false
   */
  loading?: boolean;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Inline styles (compatible with Framer Motion)
   */
  style?: MotionStyle;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-coral)] text-white hover:bg-[var(--color-coral-dark)] active:bg-[var(--color-coral-dark)]',
  secondary:
    'border-2 border-[var(--color-coral)] text-[var(--color-coral)] hover:bg-[var(--color-coral)] hover:text-white active:bg-[var(--color-coral-dark)] active:border-[var(--color-coral-dark)]',
  tertiary:
    'text-[var(--color-coral)] hover:bg-[var(--color-coral)]/10 active:bg-[var(--color-coral)]/20',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--radius-button)] font-medium text-[1rem] leading-[1.5rem] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-400)] disabled:text-[var(--color-neutral-600)] disabled:border-[var(--color-neutral-400)]';

/**
 * Button component
 *
 * @example
 * ```tsx
 * <Button variant="primary">Click me</Button>
 * <Button variant="secondary" loading>Loading...</Button>
 * <Button variant="tertiary" disabled>Disabled</Button>
 * ```
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const shouldReduceMotion = useReducedMotion();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled && onClick) {
        onClick(e);
      }
    },
    [isDisabled, onClick]
  );

  return (
    <motion.button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      onClick={handleClick}
      // AC 2, 3, 14: Hover/tap animations with reduced motion support
      {...(!shouldReduceMotion &&
        !isDisabled && {
          whileHover: buttonVariants['hover'],
          whileTap: buttonVariants['tap'],
        })}
      {...props}
    >
      {loading && (
        <Loader2
          size={20}
          strokeWidth={1.5}
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {children}
    </motion.button>
  );
}
