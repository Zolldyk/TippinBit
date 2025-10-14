/**
 * Amount input component for entering tip amounts
 *
 * Features:
 * - Auto-formats to 2 decimal places on blur
 * - Strips non-numeric characters (except decimal point)
 * - Dollar sign prefix
 * - Decimal keyboard on mobile (inputMode="decimal")
 * - Accessibility compliant
 */

'use client';

import { useCallback } from 'react';
import { Input } from '../atoms/Input';
import { parseAmountInput, formatCurrency } from '@/lib/formatting';

export interface AmountInputProps {
  /**
   * Current amount value as string
   */
  value: string;

  /**
   * Callback when amount changes
   */
  onChange: (value: string) => void;

  /**
   * Optional blur callback
   */
  onBlur?: () => void;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Label text
   * @default "Tip amount"
   */
  label?: string;

  /**
   * Placeholder text
   * @default "Enter any amount"
   */
  placeholder?: string;
}

/**
 * AmountInput molecule component
 *
 * @example
 * ```tsx
 * <AmountInput
 *   value={amount}
 *   onChange={setAmount}
 *   onBlur={handleBlur}
 * />
 * ```
 */
export function AmountInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  label = 'Tip amount',
  placeholder = 'Enter any amount',
}: AmountInputProps) {
  // Handle input changes - strip non-numeric characters
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove dollar sign prefix before parsing
      const inputValue = e.target.value.replace('$', '');
      const cleaned = parseAmountInput(inputValue);
      onChange(cleaned);
    },
    [onChange]
  );

  // Handle blur - format to 2 decimal places
  const handleBlur = useCallback(() => {
    if (value) {
      const formatted = formatCurrency(value);
      // Remove dollar sign for internal state
      onChange(formatted.replace('$', ''));
    }
    onBlur?.();
  }, [value, onChange, onBlur]);

  // Display value with dollar sign prefix
  const displayValue = value ? `$${value}` : '';

  return (
    <Input
      type="text"
      inputMode="decimal"
      label={label}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
      autoCorrect="off"
      aria-label="Tip amount input"
    />
  );
}
