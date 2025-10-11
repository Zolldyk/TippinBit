/**
 * Card atom component with variants
 *
 * Variants:
 * - base: Warm white background with subtle border
 * - elevated: White background with shadow, no border
 *
 * Features:
 * - Responsive padding (16px mobile, 24px desktop)
 * - Optional header and footer slots
 * - WCAG AA contrast compliance
 */

import { ReactNode } from 'react';
import { BaseComponentProps, CardVariant } from '@/types/components';

export interface CardProps extends BaseComponentProps {
  /**
   * Card variant
   * @default 'base'
   */
  variant?: CardVariant;

  /**
   * Optional header content
   */
  header?: ReactNode;

  /**
   * Optional footer content
   */
  footer?: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  base: 'bg-[var(--color-neutral-warm-white)] border border-[var(--color-neutral-200)]',
  elevated: 'bg-white shadow-sm',
};

const baseStyles = 'rounded-[var(--radius-card)] p-4 md:p-6';

/**
 * Card component
 *
 * @example
 * ```tsx
 * <Card>Basic card content</Card>
 *
 * <Card variant="elevated">
 *   Elevated card with shadow
 * </Card>
 *
 * <Card
 *   variant="base"
 *   header={<h3>Card Title</h3>}
 *   footer={<button>Action</button>}
 * >
 *   Card body content
 * </Card>
 * ```
 */
export function Card({
  variant = 'base',
  header,
  footer,
  children,
  className = '',
}: CardProps) {
  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {header && (
        <div className="mb-4 pb-4 border-b border-[var(--color-neutral-200)]">
          {header}
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-[var(--color-neutral-200)]">
          {footer}
        </div>
      )}
    </div>
  );
}
