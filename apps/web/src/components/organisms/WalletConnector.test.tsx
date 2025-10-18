/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnector } from './WalletConnector';

// Mock Wagmi hooks
const mockDisconnect = vi.fn();
const mockSwitchChain = vi.fn();
const mockOpenConnectModal = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useDisconnect: vi.fn(() => ({ disconnect: mockDisconnect })),
  useReadContract: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(() => ({
    switchChain: mockSwitchChain,
    isPending: false,
  })),
  useConnect: vi.fn(() => ({
    connectors: [{ id: 'injected', name: 'MetaMask' }],
  })),
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: vi.fn(() => ({
    openConnectModal: mockOpenConnectModal,
  })),
}));

vi.mock('@/config/contracts', () => ({
  MUSD_ADDRESS: '0x1234567890123456789012345678901234567890',
  ERC20_ABI: [],
}));

vi.mock('@/config/chains', () => ({
  mezoTestnet: { id: 31611 },
}));

import { useAccount, useReadContract, useChainId } from 'wagmi';

describe('WalletConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Connect wallet" button when disconnected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector />);

    expect(screen.getByText('Connect wallet')).toBeInTheDocument();
  });

  it('calls openConnectModal when connect button is clicked', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector />);

    const connectButton = screen.getByText('Connect wallet');
    fireEvent.click(connectButton);

    expect(mockOpenConnectModal).toHaveBeenCalledTimes(1);
  });

  it('displays truncated address when connected', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    vi.mocked(useAccount).mockReturnValue({
      address: testAddress as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector />);

    // Check for truncated address (0x742d...0bEb)
    expect(screen.getByText(/0x742d/)).toBeInTheDocument();
  });

  it('displays MUSD balance when connected', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    // Mock balance of 100 MUSD (100 * 10^18)
    vi.mocked(useReadContract).mockReturnValue({
      data: BigInt('100000000000000000000'),
    } as any);

    render(<WalletConnector />);

    expect(screen.getByText('100.00 MUSD')).toBeInTheDocument();
  });

  it('displays network warning when on wrong network', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(1); // Ethereum mainnet
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector />);

    expect(
      screen.getByText('Wrong network. Switch to Mezo testnet')
    ).toBeInTheDocument();
    expect(screen.getByText('Switch network')).toBeInTheDocument();
  });

  it('calls switchChain when switch network button is clicked', async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(1); // Wrong network
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector />);

    const switchButton = screen.getByText('Switch network');
    fireEvent.click(switchButton);

    await waitFor(() => {
      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 31611 });
    });
  });

  it('calls disconnect when disconnect button is clicked', () => {
    vi.mocked(useAccount).mockReturnValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector />);

    const disconnectButton = screen.getByLabelText('Disconnect wallet');
    fireEvent.click(disconnectButton);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('calls onConnect callback when wallet connects', () => {
    const onConnect = vi.fn();
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

    vi.mocked(useAccount).mockReturnValue({
      address: testAddress as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector onConnect={onConnect} />);

    expect(onConnect).toHaveBeenCalledWith(testAddress);
  });

  it('calls onDisconnect callback when wallet disconnects', () => {
    const onDisconnect = vi.fn();

    vi.mocked(useAccount).mockReturnValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as any,
      isConnected: true,
    } as any);
    vi.mocked(useChainId).mockReturnValue(31611);
    vi.mocked(useReadContract).mockReturnValue({ data: undefined } as any);

    render(<WalletConnector onDisconnect={onDisconnect} />);

    const disconnectButton = screen.getByLabelText('Disconnect wallet');
    fireEvent.click(disconnectButton);

    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
