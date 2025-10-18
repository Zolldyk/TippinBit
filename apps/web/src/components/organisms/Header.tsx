/**
 * Global navigation header
 * Provides site-wide navigation and wallet connection
 */

'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-coral hover:text-coral-dark transition-colors"
          >
            TippinBit
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-neutral-700 hover:text-coral transition-colors"
            >
              Home
            </Link>

            {/* Connect Wallet Button */}
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
