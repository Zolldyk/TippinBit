import { Spinner } from '@/components/atoms/Spinner';
import { Card } from '@/components/atoms/Card';
import type { Username } from '@/types/domain';

interface UsernameResolutionLoadingProps {
  /**
   * Username being resolved
   */
  username: Username;
}

/**
 * Loading skeleton component for username resolution
 *
 * Displays animated loading state while resolving username to address.
 * Shows skeleton UI for payment form placeholders.
 */
export function UsernameResolutionLoading({
  username,
}: UsernameResolutionLoadingProps) {
  return (
    <main className="min-h-screen bg-[var(--color-neutral-900)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-[fadeIn_200ms_ease-in]">
        {/* Loading message */}
        <div className="flex items-center gap-3">
          <Spinner size={20} color="var(--color-coral)" />
          <p className="text-white text-lg">Resolving {username}...</p>
        </div>

        {/* Skeleton for recipient card */}
        <Card variant="base" className="p-6">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-24 bg-[var(--color-neutral-700)] rounded" />
            <div className="h-8 w-48 bg-[var(--color-neutral-700)] rounded" />
            <div className="h-4 w-64 bg-[var(--color-neutral-700)] rounded" />
          </div>
        </Card>

        {/* Skeleton for payment form */}
        <Card variant="elevated" className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-[var(--color-neutral-700)] rounded" />
            <div className="h-12 w-full bg-[var(--color-neutral-700)] rounded" />
            <div className="h-4 w-40 bg-[var(--color-neutral-700)] rounded" />
            <div className="h-12 w-full bg-[var(--color-neutral-700)] rounded" />
          </div>
        </Card>
      </div>
    </main>
  );
}
