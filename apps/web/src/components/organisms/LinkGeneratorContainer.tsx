'use client';

import { useState } from 'react';
import { UsernameClaimForm } from '../molecules/UsernameClaimForm';
import type { LinkGeneratorTab } from '@/types/domain';

/**
 * Link Generator Container
 *
 * Main container for creating payment links. Provides two options:
 * 1. Use wallet address (generates link like tippinbit.com/pay/0x123...)
 * 2. Claim @username (generates link like tippinbit.com/pay/@alice)
 *
 * Features:
 * - Tab selector for switching between address and username modes
 * - Mobile-optimized with full-width layout
 * - Accessible keyboard navigation
 *
 * @example
 * ```typescript
 * <LinkGeneratorContainer />
 * ```
 */
export function LinkGeneratorContainer() {
  const [selectedTab, setSelectedTab] =
    useState<LinkGeneratorTab>('username');

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
          onClick={() => setSelectedTab('address')}
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
          onClick={() => setSelectedTab('username')}
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
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">
                Address-based payment links coming soon!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                For now, try claiming a @username to create your payment link.
              </p>
            </div>
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
