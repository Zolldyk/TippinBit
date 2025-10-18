import { http, type Config } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mezoTestnet } from './chains';

export function createWagmiConfig(): Config {
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
