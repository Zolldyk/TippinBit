'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import type { Username } from '@/types/domain';

interface UsernameNotFoundErrorProps {
  /**
   * Username that was not found
   */
  username: Username;
  /**
   * Error type
   */
  type: 'not_found' | 'network_error';
  /**
   * Optional retry callback
   */
  onRetry?: () => void;
}

/**
 * Error component for username resolution failures
 *
 * Displays user-friendly error messages for:
 * - Username not found (404)
 * - Network errors during resolution
 *
 * Includes retry button and home navigation.
 */
export function UsernameNotFoundError({
  username,
  type,
  onRetry,
}: UsernameNotFoundErrorProps) {
  const errorMessages = {
    not_found: `Username ${username} not found. Check the link or ask the creator for their payment link.`,
    network_error:
      'Unable to resolve username. Try again or use direct address link.',
  };

  const errorTitles = {
    not_found: 'Username Not Found',
    network_error: 'Connection Error',
  };

  return (
    <main className="min-h-screen bg-[var(--color-neutral-900)] p-4 md:p-8 flex items-center justify-center">
      <Card variant="elevated" className="max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-6 p-6">
          <div
            role="alert"
            className="flex flex-col items-center space-y-4"
            aria-live="assertive"
          >
            <AlertCircle
              className="h-16 w-16 text-[var(--color-coral)]"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-semibold text-white">
              {errorTitles[type]}
            </h2>
          </div>

          <p className="text-neutral-400 text-base">{errorMessages[type]}</p>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {onRetry && (
              <Button
                variant="primary"
                onClick={onRetry}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Retry
              </Button>
            )}
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full min-h-[44px]"
              >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
