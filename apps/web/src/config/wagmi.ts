import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { mezoTestnet } from './chains';

export const wagmiConfig = createConfig({
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http(process.env['NEXT_PUBLIC_SPECTRUM_RPC_URL']),
  },
  connectors: [
    metaMask(),
    walletConnect({
      projectId: process.env['NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID']!,
    }),
    coinbaseWallet({
      appName: 'TippinBit',
    }),
  ],
  ssr: true, // Enable SSR support for Next.js
});
