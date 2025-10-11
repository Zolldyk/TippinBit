/**
 * Icon wrapper component for consistent Lucide icon styling
 *
 * Provides standardized sizing and stroke weight for all icons:
 * - sm: 16px (captions, small labels)
 * - md: 20px (inline elements, inputs)
 * - lg: 24px (primary actions, buttons)
 *
 * NOTE: This component is currently a utility reference.
 * Lucide icons are used directly in components with consistent sizing.
 * Future enhancement: Create HOC wrapper if standardized icon sizing is needed.
 */

import { LucideIcon, LucideProps } from 'lucide-react';
import { IconSize } from '@/types/components';

export interface IconProps extends Omit<LucideProps, 'size'> {
  /**
   * The Lucide icon component to render
   */
  icon: LucideIcon;

  /**
   * Standardized icon size
   * @default 'md'
   */
  size?: IconSize;
}

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Icon wrapper component
 *
 * @example
 * ```tsx
 * import { Heart } from 'lucide-react';
 * <Icon icon={Heart} size="lg" />
 * ```
 */
export function Icon({ icon: IconComponent, size = 'md', strokeWidth = 1.5, ...props }: IconProps) {
  const iconSize = sizeMap[size];

  return <IconComponent size={iconSize} strokeWidth={strokeWidth} {...props} />;
}
