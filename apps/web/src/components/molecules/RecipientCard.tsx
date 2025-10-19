'use client';

import type { Address } from 'viem';
import type { Username } from '@/types/domain';
import { Card } from '../atoms/Card';
import { AddressDisplay } from './AddressDisplay';

interface RecipientCardProps {
  recipientAddress: Address;
  username?: Username;
}

/**
 * RecipientCard displays the payment recipient's information.
 *
 * When username is provided:
 * - Username displayed as primary identifier (large, bold)
 * - Address displayed as secondary detail (small, truncated)
 *
 * When no username:
 * - Address displayed as primary (current behavior)
 *
 * Features:
 * - Truncated address display (0x742d...4a3f format)
 * - Copy-to-clipboard functionality
 * - Tooltip showing full address on hover/tap
 * - 44px minimum touch target for mobile accessibility
 * - Responsive padding (16px mobile, 24px desktop)
 *
 * @param recipientAddress - The Ethereum address of the payment recipient
 * @param username - Optional username to display as primary identifier
 */
export function RecipientCard({
  recipientAddress,
  username,
}: RecipientCardProps) {
  return (
    <Card variant="elevated" className="p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutral-600">Supporting:</span>

        {username ? (
          <>
            {/* Username as primary identifier */}
            <h2 className="text-2xl font-bold text-white">{username}</h2>

            {/* Address as secondary detail */}
            <div className="text-neutral-400">
              <AddressDisplay
                address={recipientAddress}
                shorten={true}
                showCopy={true}
              />
            </div>
          </>
        ) : (
          /* Address as primary (no username available) */
          <AddressDisplay
            address={recipientAddress}
            shorten={true}
            showCopy={true}
          />
        )}
      </div>
    </Card>
  );
}
