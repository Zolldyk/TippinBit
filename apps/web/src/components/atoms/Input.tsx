/**
 * Input atom component with validation states
 *
 * Validation states: default, focus, error, success
 *
 * Features:
 * - Label with htmlFor association
 * - Error/success messages
 * - Leading/trailing icon slots
 * - 44px minimum height for touch accessibility
 * - ARIA attributes for screen readers
 */

'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle, CheckCircle, LucideIcon } from 'lucide-react';
import { BaseComponentProps, InputValidationState } from '@/types/components';

export interface InputProps
  extends BaseComponentProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /**
   * Input label text
   */
  label?: string;

  /**
   * Validation state
   * @default 'default'
   */
  validationState?: InputValidationState;

  /**
   * Error message (displayed when validationState is 'error')
   */
  errorMessage?: string;

  /**
   * Success message (displayed when validationState is 'success')
   */
  successMessage?: string;

  /**
   * Leading icon (left side of input)
   */
  leadingIcon?: LucideIcon;

  /**
   * Trailing icon (right side of input)
   */
  trailingIcon?: LucideIcon;
}

const stateStyles: Record<InputValidationState, string> = {
  default:
    'border-[var(--color-neutral-200)] focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)]/20',
  error:
    'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20',
  success:
    'border-[var(--color-success)] focus:border-[var(--color-success)] focus:ring-2 focus:ring-[var(--color-success)]/20',
};

const baseInputStyles =
  'w-full min-h-[44px] px-4 py-3 rounded-[var(--radius-button)] border text-[var(--color-neutral-charcoal)] placeholder:text-[var(--color-neutral-400)] transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-200)]';

/**
 * Input component
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input
 *   label="Username"
 *   validationState="error"
 *   errorMessage="Username is already taken"
 * />
 * <Input
 *   label="Amount"
 *   validationState="success"
 *   successMessage="Valid amount"
 *   trailingIcon={CheckCircle}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      validationState = 'default',
      errorMessage,
      successMessage,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = `${inputId}-error`;
    const successId = `${inputId}-success`;

    const showError = validationState === 'error' && errorMessage;
    const showSuccess = validationState === 'success' && successMessage;

    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[0.875rem] font-medium text-[var(--color-neutral-charcoal)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {LeadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <LeadingIcon
                size={20}
                strokeWidth={1.5}
                className="text-[var(--color-neutral-400)]"
              />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`${baseInputStyles} ${stateStyles[validationState]} ${
              LeadingIcon ? 'pl-10' : ''
            } ${TrailingIcon || validationState !== 'default' ? 'pr-10' : ''}`}
            disabled={disabled}
            aria-invalid={validationState === 'error'}
            aria-describedby={
              showError ? errorId : showSuccess ? successId : undefined
            }
            {...props}
          />

          {(TrailingIcon || validationState !== 'default') && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {validationState === 'error' ? (
                <AlertCircle
                  size={20}
                  strokeWidth={1.5}
                  className="text-[var(--color-error)]"
                  aria-hidden="true"
                />
              ) : validationState === 'success' ? (
                <CheckCircle
                  size={20}
                  strokeWidth={1.5}
                  className="text-[var(--color-success)]"
                  aria-hidden="true"
                />
              ) : TrailingIcon ? (
                <TrailingIcon
                  size={20}
                  strokeWidth={1.5}
                  className="text-[var(--color-neutral-400)]"
                />
              ) : null}
            </div>
          )}
        </div>

        {showError && (
          <p
            id={errorId}
            className="text-[0.875rem] text-[var(--color-error)]"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        {showSuccess && (
          <p
            id={successId}
            className="text-[0.875rem] text-[var(--color-success)]"
          >
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
