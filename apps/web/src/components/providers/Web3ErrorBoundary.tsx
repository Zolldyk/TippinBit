'use client';

import { Component, ReactNode } from 'react';

interface Web3ErrorBoundaryProps {
  children: ReactNode;
}

interface Web3ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class Web3ErrorBoundary extends Component<
  Web3ErrorBoundaryProps,
  Web3ErrorBoundaryState
> {
  constructor(props: Web3ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Web3ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Web3 Provider Error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-neutral-900)] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--color-neutral-800)] border border-[var(--color-neutral-700)] rounded-lg p-6 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-red-500 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">
              Unable to connect to wallet provider
            </h2>
            <p className="text-neutral-400 mb-6">
              Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[var(--color-coral)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-coral-dark)] transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
