import { http, type Config, createConfig } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mezoTestnet } from './chains';

export function createWagmiConfig(): Config {
  // Check if running on server (SSR)
  const isServer = typeof window === 'undefined';

  // During SSR, WalletConnect tries to access indexedDB which doesn't exist
  // Create a minimal config without WalletConnect for SSR
  if (isServer) {
    return createConfig({
      chains: [mezoTestnet],
      transports: {
        [mezoTestnet.id]: http(process.env['NEXT_PUBLIC_SPECTRUM_RPC_URL']),
      },
      ssr: true,
    });
  }

  // On the client, use the full config with WalletConnect
  return getDefaultConfig({
    appName: 'TippinBit',
    projectId: process.env['NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID']!,
    chains: [mezoTestnet],
    transports: {
      [mezoTestnet.id]: http(process.env['NEXT_PUBLIC_SPECTRUM_RPC_URL']),
    },
    ssr: true, // Enable SSR support for Next.js
  });
}
