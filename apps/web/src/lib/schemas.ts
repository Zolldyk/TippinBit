import { z } from 'zod';
import { isAddress } from 'viem';

/**
 * Zod schema for validating payment page URL parameters.
 *
 * Validates:
 * - `to`: Required Ethereum address (0x followed by 40 hex characters)
 * - `amount`: Optional numeric string (allows decimals)
 *
 * @example
 * ```typescript
 * const result = PayPageSchema.safeParse({
 *   to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
 *   amount: '5.50'
 * });
 *
 * if (result.success) {
 *   const { to, amount } = result.data;
 *   // Use validated data
 * }
 * ```
 */
export const PayPageSchema = z.object({
  to: z
    .string()
    .min(1, 'Recipient address is required')
    .refine((addr) => isAddress(addr), {
      message: 'Invalid Ethereum address format',
    }),
  amount: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const parsed = parseFloat(val);
        return !isNaN(parsed) && Number.isFinite(parsed) && parsed > 0;
      },
      {
        message: 'Amount must be a positive number',
      }
    ),
});

/**
 * Type inferred from PayPageSchema for type-safe usage.
 */
export type PayPageParams = z.infer<typeof PayPageSchema>;
