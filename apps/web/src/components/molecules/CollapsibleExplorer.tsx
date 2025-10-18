'use client';

import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface CollapsibleExplorerProps {
  txHash: string;
  explorerUrl: string;
}

/**
 * CollapsibleExplorer component for blockchain explorer link
 *
 * Features:
 * - Collapsible section with chevron indicator
 * - Full transaction hash display when expanded
 * - Link to Mezo testnet explorer
 * - Respects prefers-reduced-motion
 */
export function CollapsibleExplorer({
  txHash,
  explorerUrl,
}: CollapsibleExplorerProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex w-full items-center justify-between p-4 hover:bg-slate-50 transition-colors duration-150 motion-reduce:transition-none motion-reduce:duration-0"
        aria-expanded={showDetails}
        aria-label="Toggle blockchain explorer details"
      >
        <span className="text-sm font-medium text-slate-700">
          View on blockchain explorer
        </span>
        {showDetails ? (
          <ChevronUp className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-600" />
        )}
      </button>

      {showDetails && (
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Full Transaction Hash
            </p>
            <div className="rounded bg-slate-50 p-3">
              <code className="break-all text-xs font-mono text-slate-700">
                {txHash}
              </code>
            </div>
          </div>

          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors duration-150 motion-reduce:transition-none motion-reduce:duration-0"
          >
            Open Mezo Explorer
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
