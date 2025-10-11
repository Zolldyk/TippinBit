/**
 * Shared component prop types for atomic design system
 */

import { ReactNode } from 'react';

/**
 * Common props shared across components
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

/**
 * Input validation states
 */
export type InputValidationState = 'default' | 'error' | 'success';

/**
 * Card variant types
 */
export type CardVariant = 'base' | 'elevated';

/**
 * Icon size options
 */
export type IconSize = 'sm' | 'md' | 'lg';
