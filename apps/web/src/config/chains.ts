import { defineChain } from 'viem';

export const mezoTestnet = defineChain({
  id: 31611,
  name: 'Mezo Testnet',
  network: 'mezo-testnet',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env['NEXT_PUBLIC_SPECTRUM_RPC_URL']!],
    },
    public: {
      http: [process.env['NEXT_PUBLIC_SPECTRUM_RPC_URL']!],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Explorer',
      url: 'https://explorer.mezo.org',
    },
  },
});
