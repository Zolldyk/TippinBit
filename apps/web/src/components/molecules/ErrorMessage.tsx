import { AlertTriangle, XCircle, Info } from 'lucide-react';
import type { TransactionErrorResult } from '@/lib/error-parser';

export interface ErrorMessageProps {
  error: TransactionErrorResult;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * ErrorMessage molecule component for displaying transaction errors.
 * Provides severity-based styling and actionable buttons for error recovery.
 *
 * @param error - Parsed transaction error result with user-friendly message
 * @param onRetry - Optional callback for retry button
 * @param onDismiss - Optional callback for dismiss button
 *
 * @example
 * <ErrorMessage
 *   error={{ userMessage: 'Transaction failed', code: 'TX_FAILED', isUserRejection: false, severity: 'error' }}
 *   onRetry={() => retryTransaction()}
 * />
 */
export function ErrorMessage({ error, onRetry, onDismiss }: ErrorMessageProps) {
  // Don't render if user rejection (silent handling per AC4)
  if (error.isUserRejection) return null;

  // Derive severity from error code if not provided
  const severity = error.severity || deriveSeverityFromCode(error.code);

  // Severity-based styling with WCAG 2.1 AA contrast ratios
  const styles = {
    warning: 'border-amber-300 bg-amber-50 text-amber-800',
    error: 'border-red-300 bg-red-50 text-red-800',
    info: 'border-blue-300 bg-blue-50 text-blue-800',
  };

  const icons = {
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };

  const Icon = icons[severity];

  return (
    <div
      className={`rounded-lg border-2 p-4 ${styles[severity]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium">{error.userMessage}</p>

          {error.actionable && (
            <p className="mt-1 text-sm opacity-90">{error.actionable}</p>
          )}

          <div className="mt-3 flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Try again
              </button>
            )}

            {/* Get MUSD button for insufficient funds */}
            {error.code === 'INSUFFICIENT_FUNDS' && (
              <a
                href="https://faucet.test.mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Get MUSD
              </a>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Derives severity level from error code if not explicitly provided.
 *
 * @param code - Error code from TransactionErrorResult
 * @returns Severity level for UI styling
 */
function deriveSeverityFromCode(code: string): 'info' | 'warning' | 'error' {
  const warningCodes = [
    'INSUFFICIENT_FUNDS',
    'GAS_ESTIMATION_FAILED',
    'TIMEOUT',
    'OUT_OF_GAS',
    'RPC_CONNECTION_FAILED',
  ];
  const infoCodes = ['USER_REJECTED'];

  if (warningCodes.includes(code)) return 'warning';
  if (infoCodes.includes(code)) return 'info';
  return 'error';
}
