import { defineChain } from 'viem';

// Primary and fallback RPC URLs for Mezo Testnet
const MEZO_RPC_URLS = [
  'https://spectrum-02.simplystaking.xyz/c3VpbHRuYXUtMDItYzE0YmNlZTM/sOr8LGZ8dG1REA/base/testnet/',
  'https://rpc-http.mezo.boar.network/Am60KN66zGnT9Rp8hMXWDqfw3yaBcccr',
];

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
      http: MEZO_RPC_URLS,
    },
    public: {
      http: MEZO_RPC_URLS,
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Explorer',
      url: 'https://explorer.mezo.org',
    },
  },
});
