'use client';

import { Button } from '@/components/atoms/Button';
import { ArrowRight, Zap, Shield, Coins } from 'lucide-react';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-coral sm:text-6xl lg:text-7xl">
            Tip Anyone, Anywhere
          </h1>
          <p className="mt-4 text-xl text-neutral-600 sm:text-2xl">
            Send Bitcoin-backed MUSD tips instantly
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex justify-center">
            <Button
              variant="primary"
              onClick={() => window.location.href = '/create'}
              className="min-w-[200px]"
            >
              Create payment link <ArrowRight size={20} />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-coral/10 p-4">
              <Zap size={32} className="text-coral" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              Instant transfers
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
              Secure & transparent
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
              Bitcoin-backed
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
                Create your link
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
                Share your link
              </h3>
              <p className="text-sm text-neutral-600">
                Post your payment link across platforms for supporters to find
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-coral text-lg font-bold text-white">
                3
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900">
                Receive tips
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
