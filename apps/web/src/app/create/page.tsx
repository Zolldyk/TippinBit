'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { isAddress } from 'viem';
import { LinkGeneratorContainer } from '@/components/organisms/LinkGeneratorContainer';
import type { Address, LinkGeneratorTab } from '@/types/domain';

/**
 * Create Page Content Component
 *
 * Handles permalink functionality by parsing URL query parameters
 * and passing them to LinkGeneratorContainer.
 *
 * Supports:
 * - /create?address=0x... (AC9: pre-fill address tab)
 * - /create?username=alice (future: pre-fill username)
 */
function CreatePageContent() {
  const searchParams = useSearchParams();
  const addressParam = searchParams?.get('address');

  const [selectedTab, setSelectedTab] = useState<LinkGeneratorTab>('username');
  const [prefilledAddress, setPrefilledAddress] = useState<Address | undefined>(undefined);

  // Parse URL params on mount (AC9)
  useEffect(() => {
    if (addressParam && isAddress(addressParam)) {
      setPrefilledAddress(addressParam as Address);
      setSelectedTab('address');
    }
  }, [addressParam]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create payment link</h1>
      <LinkGeneratorContainer
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        {...(prefilledAddress && { prefilledAddress })}
      />
    </div>
  );
}

/**
 * Create Page
 *
 * Entry point for link generation page with Suspense boundary
 * for useSearchParams.
 */
export default function CreatePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}
