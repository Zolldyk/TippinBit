import { WalletConnector } from '@/components/organisms/WalletConnector';
import { PaymentError } from '@/components/organisms/PaymentError';
import { RecipientCard } from '@/components/molecules/RecipientCard';
import { Card } from '@/components/atoms/Card';
import { validatePaymentAddress, parsePaymentAmount } from '@/lib/validation';

interface PayPageProps {
  searchParams: Promise<{
    to?: string;
    amount?: string;
  }>;
}

/**
 * Payment page that handles URL pattern: /pay?to=ADDRESS&amount=AMOUNT
 *
 * Validates URL parameters and displays:
 * - Payment recipient's address
 * - Pre-filled amount (if provided)
 * - Error states for invalid/missing parameters
 */
export default async function PayPage({ searchParams }: PayPageProps) {
  const params = await searchParams;

  // Validate required 'to' parameter exists
  if (!params.to || params.to.trim() === '') {
    return (
      <PaymentError
        errorType="missing_recipient"
        message="This payment link is incomplete. Contact the creator for a valid link."
      />
    );
  }

  // Validate Ethereum address format
  const validatedAddress = validatePaymentAddress(params.to);
  if (!validatedAddress) {
    return (
      <PaymentError
        errorType="invalid_address"
        message="Invalid payment link. Please check the URL and try again."
      />
    );
  }

  // Parse amount parameter (if provided and valid)
  const prefillAmount = parsePaymentAmount(params.amount);

  return (
    <main className="min-h-screen bg-[var(--color-neutral-900)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Send a tip</h1>
          <WalletConnector />
        </div>

        <RecipientCard recipientAddress={validatedAddress} />

        <Card variant="elevated" className="p-6">
          {prefillAmount !== undefined ? (
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-2">Amount:</p>
              <p className="text-4xl font-bold text-white">
                ${prefillAmount.toFixed(2)}
              </p>
              <p className="text-sm text-neutral-500 mt-4">
                Amount input will be fully editable in Story 1.5
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-neutral-600">Enter any amount</p>
              <p className="text-sm text-neutral-500 mt-4">
                Amount input coming in Story 1.5
              </p>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
