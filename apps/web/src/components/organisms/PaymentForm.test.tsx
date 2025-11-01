import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentForm } from './PaymentForm';
import { parseEther } from 'viem';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(() => ({ switchChain: vi.fn() })),
  useReadContract: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    refetch: vi.fn(),
  })),
  useWriteContract: vi.fn(() => ({
    writeContractAsync: vi.fn(),
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
  usePublicClient: vi.fn(() => ({})),
  useSimulateContract: vi.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}));

// Mock custom hooks
vi.mock('@/hooks/useBalanceMonitor', () => ({
  useBalanceMonitor: vi.fn(),
}));

vi.mock('@/hooks/useBTCBalance', () => ({
  useBTCBalance: vi.fn(),
}));

vi.mock('@/hooks/useBTCPrice', () => ({
  useBTCPrice: vi.fn(),
}));

vi.mock('@/hooks/useGasEstimation', () => ({
  useGasEstimation: vi.fn(),
}));

vi.mock('@/hooks/useMUSDTransfer', () => ({
  useMUSDTransfer: vi.fn(),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { useAccount, useChainId } from 'wagmi';
import { useBalanceMonitor } from '@/hooks/useBalanceMonitor';
import { useBTCBalance } from '@/hooks/useBTCBalance';
import { useBTCPrice } from '@/hooks/useBTCPrice';
import { useGasEstimation } from '@/hooks/useGasEstimation';
import { useMUSDTransfer } from '@/hooks/useMUSDTransfer';
import { MEZO_TESTNET_CHAIN_ID } from '@/config/networks';

describe('PaymentForm - Story 2.12 Integration Tests', () => {
  const mockRecipient = '0x1234567890123456789012345678901234567890' as `0x${string}`;

  beforeEach(() => {
    // Default mock implementations
    (useBalanceMonitor as any).mockReturnValue({
      balance: parseEther('100'),
      balanceUsd: 100,
      isLoading: false,
      refetch: vi.fn(),
      updateOptimistically: vi.fn(),
    });

    (useBTCPrice as any).mockReturnValue({
      btcPrice: parseEther('50000'),
      isStale: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
      timestamp: Date.now(),
    });

    (useGasEstimation as any).mockReturnValue({
      gasEstimate: parseEther('0.01'),
      gasEstimateUsd: 0.01,
      isLoading: false,
      gasEstimationFailed: false,
    });

    (useMUSDTransfer as any).mockReturnValue({
      sendTransaction: vi.fn(),
      txHash: null,
      state: 'idle',
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      isError: false,
      error: null,
      startTime: null,
      reset: vi.fn(),
    });
  });

  it('shows error when clicking "Tip with BTC" without wallet connected', async () => {
    const user = userEvent.setup();

    // No wallet connected
    (useAccount as any).mockReturnValue({ address: undefined });
    (useChainId as any).mockReturnValue(MEZO_TESTNET_CHAIN_ID);
    (useBTCBalance as any).mockReturnValue({ btcBalance: parseEther('1') });

    render(<PaymentForm recipientAddress={mockRecipient} />);

    // Click "Tip with BTC" button
    const btcButton = screen.getByText('Tip with BTC');
    await user.click(btcButton);

    // Should show error panel with connect message
    await waitFor(() => {
      expect(screen.getByText('Action Required')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to tip with BTC')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  it('shows error when clicking "Tip with BTC" with no BTC balance', async () => {
    const user = userEvent.setup();

    // Wallet connected but no BTC
    (useAccount as any).mockReturnValue({ address: '0xuser' });
    (useChainId as any).mockReturnValue(MEZO_TESTNET_CHAIN_ID);
    (useBTCBalance as any).mockReturnValue({ btcBalance: BigInt(0) });

    render(<PaymentForm recipientAddress={mockRecipient} />);

    // Click "Tip with BTC" button
    const btcButton = screen.getByText('Tip with BTC');
    await user.click(btcButton);

    // Should show error panel with get BTC message
    await waitFor(() => {
      expect(screen.getByText('Action Required')).toBeInTheDocument();
      expect(screen.getByText('You need BTC to send this tip')).toBeInTheDocument();
      expect(screen.getByText('Get Testnet BTC')).toBeInTheDocument();
    });
  });

  it('shows error when clicking "Tip with BTC" on wrong network', async () => {
    const user = userEvent.setup();

    // Wallet connected but wrong network
    (useAccount as any).mockReturnValue({ address: '0xuser' });
    (useChainId as any).mockReturnValue(1); // Ethereum mainnet
    (useBTCBalance as any).mockReturnValue({ btcBalance: parseEther('1') });

    render(<PaymentForm recipientAddress={mockRecipient} />);

    // Click "Tip with BTC" button
    const btcButton = screen.getByText('Tip with BTC');
    await user.click(btcButton);

    // Should show error panel with switch network message
    await waitFor(() => {
      expect(screen.getByText('Action Required')).toBeInTheDocument();
      expect(screen.getByText('Please switch to Mezo testnet to tip with BTC')).toBeInTheDocument();
      expect(screen.getByText('Switch to Mezo Testnet')).toBeInTheDocument();
    });
  });

  it('opens normal BorrowingExplainerPanel when all checks pass', async () => {
    const user = userEvent.setup();

    // Wallet connected, correct network, has BTC
    (useAccount as any).mockReturnValue({ address: '0xuser' });
    (useChainId as any).mockReturnValue(MEZO_TESTNET_CHAIN_ID);
    (useBTCBalance as any).mockReturnValue({ btcBalance: parseEther('1') });

    render(<PaymentForm recipientAddress={mockRecipient} />);

    // Click "Tip with BTC" button
    const btcButton = screen.getByText('Tip with BTC');
    await user.click(btcButton);

    // Should show normal explainer panel (not error mode)
    await waitFor(() => {
      expect(screen.getByText('Support without selling your Bitcoin')).toBeInTheDocument();
      expect(screen.queryByText('Action Required')).not.toBeInTheDocument();
    });
  });

  it('does not affect MUSD tipping flow', async () => {
    const user = userEvent.setup();
    const mockSendTransaction = vi.fn();

    (useAccount as any).mockReturnValue({ address: '0xuser' });
    (useChainId as any).mockReturnValue(MEZO_TESTNET_CHAIN_ID);
    (useBTCBalance as any).mockReturnValue({ btcBalance: parseEther('1') });
    (useMUSDTransfer as any).mockReturnValue({
      sendTransaction: mockSendTransaction,
      txHash: null,
      state: 'idle',
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      isError: false,
      error: null,
      startTime: null,
      reset: vi.fn(),
    });

    render(<PaymentForm recipientAddress={mockRecipient} />);

    // Enter amount
    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    await user.type(amountInput, '5');

    // Click "Send with MUSD" button
    const musdButton = screen.getByText(/Send with MUSD/i);
    await user.click(musdButton);

    // MUSD flow should work normally
    await waitFor(() => {
      expect(mockSendTransaction).toHaveBeenCalled();
    });
  });

  it('faucet link opens correct URL', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    // Setup: no BTC balance
    (useAccount as any).mockReturnValue({ address: '0xuser' });
    (useChainId as any).mockReturnValue(MEZO_TESTNET_CHAIN_ID);
    (useBTCBalance as any).mockReturnValue({ btcBalance: BigInt(0) });

    render(<PaymentForm recipientAddress={mockRecipient} />);

    // Click "Tip with BTC" button
    const btcButton = screen.getByText('Tip with BTC');
    await user.click(btcButton);

    // Wait for error panel and click faucet link
    await waitFor(() => {
      expect(screen.getByText('Get Testnet BTC')).toBeInTheDocument();
    });

    const faucetButton = screen.getByText('Get Testnet BTC');
    await user.click(faucetButton);

    // Verify correct faucet URL
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://faucet.test.mezo.org',
      '_blank',
      'noopener,noreferrer'
    );

    windowOpenSpy.mockRestore();
  });
});
