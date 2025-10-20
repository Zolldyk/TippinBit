'use client';

import { useState } from 'react';
import { UsernameClaimForm } from '../molecules/UsernameClaimForm';
import { AddressLinkForm } from '../molecules/AddressLinkForm';
import type { LinkGeneratorTab, Address } from '@/types/domain';

export interface LinkGeneratorContainerProps {
  /** Initial tab selection (supports permalink functionality) */
  selectedTab?: LinkGeneratorTab;
  /** Callback when tab changes */
  onTabChange?: (tab: LinkGeneratorTab) => void;
  /** Pre-filled address from URL param (supports permalink functionality) */
  prefilledAddress?: Address;
}

/**
 * Link Generator Container
 *
 * Main container for creating payment links. Provides two options:
 * 1. Use wallet address (generates link like tippinbit.com/pay?to=0x123...)
 * 2. Claim @username (generates link like tippinbit.com/pay/@alice)
 *
 * Features:
 * - Tab selector for switching between address and username modes
 * - Address-based link generation with QR codes (Story 2.9)
 * - Username-based link generation with claim flow (Story 2.6)
 * - Permalink support via props (AC9)
 * - Mobile-optimized with full-width layout
 * - Accessible keyboard navigation
 *
 * @example
 * ```typescript
 * <LinkGeneratorContainer
 *   selectedTab="address"
 *   prefilledAddress="0x742d35Cc..."
 * />
 * ```
 */
export function LinkGeneratorContainer({
  selectedTab: initialTab = 'username',
  onTabChange,
  prefilledAddress,
}: LinkGeneratorContainerProps = {}) {
  const [selectedTab, setSelectedTab] = useState<LinkGeneratorTab>(initialTab);

  const handleTabChange = (tab: LinkGeneratorTab) => {
    setSelectedTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab Selector */}
      <div
        className="flex gap-2 mb-6 border-b border-gray-200"
        role="tablist"
        aria-label="Link generator options"
      >
        {/* Use Wallet Address Tab */}
        <button
          role="tab"
          aria-selected={selectedTab === 'address'}
          aria-controls="address-panel"
          id="address-tab"
          onClick={() => handleTabChange('address')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            border-b-2 min-h-[44px]
            ${
              selectedTab === 'address'
                ? 'border-coral text-coral'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Use wallet address
        </button>

        {/* Claim @username Tab */}
        <button
          role="tab"
          aria-selected={selectedTab === 'username'}
          aria-controls="username-panel"
          id="username-tab"
          onClick={() => handleTabChange('username')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            border-b-2 min-h-[44px]
            ${
              selectedTab === 'username'
                ? 'border-coral text-coral'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Claim @username
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {/* Address Tab Panel */}
        {selectedTab === 'address' && (
          <div
            role="tabpanel"
            id="address-panel"
            aria-labelledby="address-tab"
            className="animate-fadeIn"
          >
            <AddressLinkForm
              {...(prefilledAddress && { prefilledAddress })}
            />
          </div>
        )}

        {/* Username Tab Panel */}
        {selectedTab === 'username' && (
          <div
            role="tabpanel"
            id="username-panel"
            aria-labelledby="username-tab"
            className="animate-fadeIn"
          >
            <UsernameClaimForm />
          </div>
        )}
      </div>
    </div>
  );
}
