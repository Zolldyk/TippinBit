'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { PaymentLinkGenerator } from '@/components/organisms/PaymentLinkGenerator';
import { ArrowRight, Zap, Shield, Coins } from 'lucide-react';

export default function Home() {
  const [showLinkGenerator, setShowLinkGenerator] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-coral sm:text-6xl lg:text-7xl">
            Tip Anyone on X
          </h1>
          <p className="mt-4 text-xl text-neutral-600 sm:text-2xl">
            Send Bitcoin-backed MUSD tips instantly
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              onClick={() => setShowLinkGenerator(true)}
              className="min-w-[200px]"
            >
              Create Payment Link <ArrowRight size={20} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/showcase'}
              className="min-w-[200px]"
            >
              View Design System
            </Button>
          </div>
        </div>

        {/* Payment Link Generator */}
        {showLinkGenerator && (
          <div className="mt-12 flex justify-center">
            <PaymentLinkGenerator />
          </div>
        )}

        {/* Features */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-coral/10 p-4">
              <Zap size={32} className="text-coral" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              Instant Transfers
            </h3>
            <p className="text-sm text-neutral-600">
              Send tips in seconds with real-time gas fee estimates
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-teal/10 p-4">
              <Shield size={32} className="text-teal" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              Secure & Transparent
            </h3>
            <p className="text-sm text-neutral-600">
              Built on Mezo with Bitcoin-backed stablecoin security
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-bitcoin/10 p-4">
              <Coins size={32} className="text-bitcoin" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              Bitcoin-Backed
            </h3>
            <p className="text-sm text-neutral-600">
              MUSD is backed by Bitcoin for stability and trust
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="mb-8 text-center text-3xl font-bold text-neutral-900">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-lg font-bold text-white">
                1
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900">
                Create Your Link
              </h3>
              <p className="text-sm text-neutral-600">
                Generate a shareable payment link with your wallet address
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-lg font-bold text-white">
                2
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900">
                Share on X
              </h3>
              <p className="text-sm text-neutral-600">
                Post your payment link on X/Twitter for supporters to find
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-lg font-bold text-white">
                3
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900">
                Receive Tips
              </h3>
              <p className="text-sm text-neutral-600">
                Supporters connect wallet, enter amount, and send MUSD instantly
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
