import { isAddress, type Address } from 'viem';

// Validate MUSD address from environment
const validateMUSDAddress = (): Address | undefined => {
  // Use testnet address for now (testnet is the default chain)
  const address = process.env['NEXT_PUBLIC_MUSD_ADDRESS_TESTNET'];

  if (!address || address === '0x...') {
    // Placeholder not configured yet
    return undefined;
  }

  if (!isAddress(address)) {
    throw new Error(
      'MUSD address not configured or invalid. Check NEXT_PUBLIC_MUSD_ADDRESS_TESTNET in .env.local'
    );
  }

  return address as Address;
};

export const MUSD_ADDRESS = validateMUSDAddress();

/**
 * ERC-20 ABI for MUSD token interactions.
 * Includes balanceOf (view) and transfer (write) functions.
 */
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;
