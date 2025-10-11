'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';

interface PaymentErrorProps {
  errorType: 'invalid_address' | 'missing_recipient';
  message: string;
}

/**
 * PaymentError displays user-friendly error messages for invalid payment links.
 *
 * @param errorType - The type of error ('invalid_address' | 'missing_recipient')
 * @param message - The error message to display
 */
export function PaymentError({ errorType, message }: PaymentErrorProps) {
  const helpText =
    errorType === 'missing_recipient'
      ? 'Double-check the link or contact the creator for a valid payment link.'
      : 'Please verify the URL is correct and try again, or contact the creator.';

  return (
    <main className="min-h-screen bg-[var(--color-neutral-900)] p-4 md:p-8 flex items-center justify-center">
      <Card variant="elevated" className="max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-6 p-6">
          <div
            role="alert"
            className="flex flex-col items-center space-y-4"
            aria-live="assertive"
          >
            <AlertCircle className="h-16 w-16 text-red-400" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-white">{message}</h2>
          </div>

          <p className="text-neutral-400 text-base">{helpText}</p>

          <Link href="/" className="w-full">
            <Button variant="primary" className="w-full min-h-[44px]">
              Back to home
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
