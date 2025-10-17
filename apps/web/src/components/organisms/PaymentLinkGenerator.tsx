/**
 * Payment link generator component
 * Allows users to create shareable payment links
 */

'use client';

import { useState, useCallback } from 'react';
import { isAddress } from 'viem';
import { Button } from '../atoms/Button';
import { Copy, Check } from 'lucide-react';

export function PaymentLinkGenerator() {
  const [address, setAddress] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(() => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    if (!isAddress(address)) {
      setError('Invalid Ethereum address format');
      return;
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}/pay?to=${address}`;
    setGeneratedLink(link);
    setError('');
  }, [address]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [generatedLink]);

  return (
    <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-neutral-900">
        Create Payment Link
      </h3>
      <p className="mb-4 text-sm text-neutral-600">
        Enter your wallet address to generate a shareable payment link
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError('');
          }}
          placeholder="0x..."
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button onClick={handleGenerate} variant="primary">
          Generate Link
        </Button>

        {generatedLink && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg bg-neutral-50 p-3">
            <p className="break-all text-sm font-mono text-neutral-700">
              {generatedLink}
            </p>
            <Button
              onClick={handleCopy}
              variant="secondary"
              className="self-start"
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Link
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
