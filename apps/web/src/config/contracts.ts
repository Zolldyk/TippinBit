import { isAddress, type Address } from 'viem';

// Validate MUSD address from environment
const validateMUSDAddress = (): Address | undefined => {
  const address = process.env['NEXT_PUBLIC_MUSD_ADDRESS'];

  if (!address || address === '0x...') {
    // Placeholder not configured yet
    return undefined;
  }

  if (!isAddress(address)) {
    throw new Error(
      'MUSD address not configured or invalid. Check NEXT_PUBLIC_MUSD_ADDRESS in .env.local'
    );
  }

  return address as Address;
};

export const MUSD_ADDRESS = validateMUSDAddress();

// Minimal ERC-20 ABI for balanceOf
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;
