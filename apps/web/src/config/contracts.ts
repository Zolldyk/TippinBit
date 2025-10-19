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

// Validate BTC address from environment
export const validateBTCAddress = (): Address | undefined => {
  // Use testnet address for now (testnet is the default chain)
  const address = process.env['NEXT_PUBLIC_BTC_ADDRESS_TESTNET'];

  if (!address || address === '0x...') {
    // Placeholder not configured yet - TODO: Replace with actual Mezo testnet BTC token address
    return undefined;
  }

  if (!isAddress(address)) {
    throw new Error(
      'BTC address not configured or invalid. Check NEXT_PUBLIC_BTC_ADDRESS_TESTNET in .env.local'
    );
  }

  return address as Address;
};

export const BTC_ADDRESS = validateBTCAddress();

/**
 * ERC-20 ABI for token interactions (MUSD and BTC).
 * Includes balanceOf (view), transfer (write), and approve (write) functions.
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
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;

// Validate BorrowingVault address from environment
export const validateBorrowingVaultAddress = (): Address | undefined => {
  // Use testnet address for now (testnet is the default chain)
  const address = process.env['NEXT_PUBLIC_BORROWING_VAULT_ADDRESS_TESTNET'];

  if (!address || address === '0x...') {
    // Placeholder not configured yet - TODO: Replace with actual Mezo testnet BorrowingVault address
    return undefined;
  }

  if (!isAddress(address)) {
    throw new Error(
      'BorrowingVault address not configured or invalid. Check NEXT_PUBLIC_BORROWING_VAULT_ADDRESS_TESTNET in .env.local'
    );
  }

  return address as Address;
};

export const BORROWING_VAULT_ADDRESS = validateBorrowingVaultAddress();

/**
 * BorrowingVault ABI for BTC borrowing flow
 *
 * Includes three main functions:
 * - depositCollateral: Lock BTC and mint MUSD
 * - executeTip: Send MUSD to recipient
 * - closePosition: Close position and return collateral (future use)
 */
export const BORROWING_VAULT_ABI = [
  {
    name: 'depositCollateral',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'btcAmount', type: 'uint256' },
      { name: 'musdAmount', type: 'uint256' },
    ],
    outputs: [{ name: 'positionId', type: 'uint256' }],
  },
  {
    name: 'executeTip',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'positionId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'message', type: 'string' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'closePosition',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'positionId', type: 'uint256' }],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;
