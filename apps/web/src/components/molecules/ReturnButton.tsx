'use client';

import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * ReturnButton component for navigating back to creator's website
 *
 * Features:
 * - Detects referrer from document.referrer or URL parameter
 * - Validates referrer for security (prevents open redirect)
 * - Only shows for external referrers (not tippinbit.com)
 * - Accessible with proper ARIA labels
 * - Secondary button style (outlined teal)
 *
 * Security:
 * - Validates protocol (only http/https allowed)
 * - Blocks localhost and internal IPs
 * - Blocks self-referrals (tippinbit.com)
 */
export function ReturnButton() {
  const searchParams = useSearchParams();
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameter first (more reliable)
    const refParam = searchParams.get('ref');
    if (refParam && validateReferrer(refParam)) {
      setReferrerUrl(refParam);
      return;
    }

    // Fallback to document.referrer
    if (typeof window !== 'undefined' && document.referrer) {
      if (validateReferrer(document.referrer)) {
        setReferrerUrl(document.referrer);
      }
    }
  }, [searchParams]);

  // Validate referrer URL for security
  function validateReferrer(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Block localhost and internal IPs
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')
      ) {
        return false;
      }

      // Block self-referrals (tippinbit.com)
      if (hostname.includes('tippinbit.com')) {
        return false;
      }

      return true;
    } catch {
      return false; // Invalid URL
    }
  }

  // Don't render if no valid referrer
  if (!referrerUrl) {
    return null;
  }

  return (
    <a
      href={referrerUrl}
      className="inline-flex items-center gap-2 rounded-md border-2 border-teal-500 px-6 py-3 text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors duration-150 motion-reduce:transition-none motion-reduce:duration-0 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      aria-label="Return to creator's website"
    >
      Return to creator
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}
