'use client';

import { useUsernameResolution } from '@/hooks/useUsernameResolution';
import { UsernameResolutionLoading } from '@/components/molecules/UsernameResolutionLoading';
import { UsernameNotFoundError } from '@/components/organisms/UsernameNotFoundError';
import { WalletConnector } from '@/components/organisms/WalletConnector';
import { RecipientCard } from '@/components/molecules/RecipientCard';
import { PaymentForm } from '@/components/organisms/PaymentForm';
import { Card } from '@/components/atoms/Card';
import { parsePaymentAmount } from '@/lib/validation';
import type { Username } from '@/types/domain';

interface UsernamePayPageClientProps {
  username: string;
  amount?: string;
}

/**
 * Client component for username payment page
 *
 * Handles username resolution and displays appropriate states:
 * - Loading: Shows skeleton screen while resolving
 * - Not Found: Shows error for unclaimed username (404)
 * - Network Error: Shows error for network/API failures
 * - Success: Renders payment page with resolved address
 *
 * @param username - Username from URL parameter (with or without @)
 * @param amount - Optional amount parameter from query string
 */
export function UsernamePayPageClient({
  username,
  amount,
}: UsernamePayPageClientProps) {
  // Ensure username starts with @
  const formattedUsername = username.startsWith('@')
    ? (username as Username)
    : (`@${username}` as Username);

  // Resolve username to address
  const resolution = useUsernameResolution(formattedUsername);

  // Loading state: show skeleton screen
  if (resolution.status === 'loading') {
    return <UsernameResolutionLoading username={formattedUsername} />;
  }

  // Not found state: show error message
  if (resolution.status === 'not_found') {
    return (
      <UsernameNotFoundError
        username={formattedUsername}
        type="not_found"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Error state: show network error message
  if (resolution.status === 'error') {
    return (
      <UsernameNotFoundError
        username={formattedUsername}
        type="network_error"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Success state: render payment page with resolved address
  if (resolution.status === 'success' && resolution.address) {
    const prefillAmount = parsePaymentAmount(amount ?? undefined);

    return (
      <main className="min-h-screen bg-[var(--color-neutral-900)] p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Send a tip</h1>
            <WalletConnector />
          </div>

          {/* RecipientCard with username */}
          <RecipientCard
            recipientAddress={resolution.address}
            username={resolution.username}
          />

          <Card variant="elevated" className="p-6">
            <PaymentForm
              recipientAddress={resolution.address}
              prefillAmount={prefillAmount ?? undefined}
              onSend={(amount) => {
                // TODO: Implement actual transaction sending in later story
                console.log('Sending tip:', amount);
              }}
            />
          </Card>
        </div>
      </main>
    );
  }

  // Idle state: should not reach here, but show loading as fallback
  return <UsernameResolutionLoading username={formattedUsername} />;
}
