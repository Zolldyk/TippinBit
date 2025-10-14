'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WalletConnector } from '@/components/organisms/WalletConnector';
import { PaymentError } from '@/components/organisms/PaymentError';
import { RecipientCard } from '@/components/molecules/RecipientCard';
import { PaymentForm } from '@/components/organisms/PaymentForm';
import { Card } from '@/components/atoms/Card';
import { validatePaymentAddress, parsePaymentAmount } from '@/lib/validation';

/**
 * Payment page content component (must be separate for Suspense boundary)
 */
function PayPageContent() {
  const searchParams = useSearchParams();
  const to = searchParams.get('to');
  const amount = searchParams.get('amount');

  // Validate required 'to' parameter exists
  if (!to || to.trim() === '') {
    return (
      <PaymentError
        errorType="missing_recipient"
        message="This payment link is incomplete. Contact the creator for a valid link."
      />
    );
  }

  // Validate Ethereum address format
  const validatedAddress = validatePaymentAddress(to);
  if (!validatedAddress) {
    return (
      <PaymentError
        errorType="invalid_address"
        message="Invalid payment link. Please check the URL and try again."
      />
    );
  }

  // Parse amount parameter (if provided and valid)
  const prefillAmount = parsePaymentAmount(amount ?? undefined);

  return (
    <main className="min-h-screen bg-[var(--color-neutral-900)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Send a tip</h1>
          <WalletConnector />
        </div>

        <RecipientCard recipientAddress={validatedAddress} />

        <Card variant="elevated" className="p-6">
          <PaymentForm
            recipientAddress={validatedAddress}
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

/**
 * Payment page that handles URL pattern: /pay?to=ADDRESS&amount=AMOUNT
 *
 * Validates URL parameters and displays:
 * - Payment recipient's address
 * - Pre-filled amount (if provided)
 * - Error states for invalid/missing parameters
 */
export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-neutral-900)] flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
      <PayPageContent />
    </Suspense>
  );
}
