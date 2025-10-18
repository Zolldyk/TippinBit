'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { createWagmiConfig } from '@/config/wagmi';
import { ReactNode, useState } from 'react';

import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
}

const tippinbitTheme = darkTheme({
  accentColor: '#FF7A59', // Coral (primary brand color)
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function Web3Provider({ children }: Web3ProviderProps) {
  const [config] = useState(() => createWagmiConfig());
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={tippinbitTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
