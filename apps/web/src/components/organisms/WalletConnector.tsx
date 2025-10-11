'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  useAccount,
  useDisconnect,
  useReadContract,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { formatUnits, type Address } from 'viem';
import { Button } from '../atoms/Button';
import { AddressDisplay } from '../molecules/AddressDisplay';
import { MUSD_ADDRESS, ERC20_ABI } from '@/config/contracts';
import { mezoTestnet } from '@/config/chains';

interface WalletConnectorProps {
  onConnect?: (address: Address) => void;
  onDisconnect?: () => void;
}

export function WalletConnector({
  onConnect,
  onDisconnect,
}: WalletConnectorProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  // Read MUSD balance
  const { data: balance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!MUSD_ADDRESS,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Check network on connection
  useEffect(() => {
    if (isConnected && chainId !== mezoTestnet.id) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [isConnected, chainId]);

  // Callback handlers
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    }
  }, [isConnected, address, onConnect]);

  const handleConnect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
  }, [disconnect, onDisconnect]);

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: mezoTestnet.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchChain]);

  // Disconnected state
  if (!isConnected) {
    return (
      <Button
        variant="primary"
        onClick={handleConnect}
        aria-label="Connect wallet"
      >
        Connect wallet
      </Button>
    );
  }

  // Wrong network warning
  if (showNetworkWarning) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-yellow-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <span className="text-sm text-yellow-200">
            Wrong network. Switch to Mezo testnet
          </span>
        </div>
        <Button
          variant="primary"
          onClick={handleSwitchNetwork}
          loading={isSwitching}
          aria-label="Switch to Mezo testnet"
        >
          {isSwitching ? 'Switching to Mezo testnet...' : 'Switch network'}
        </Button>
      </div>
    );
  }

  // Connected state
  const formattedBalance = balance
    ? `${parseFloat(formatUnits(balance, 18)).toFixed(2)} MUSD`
    : '0.00 MUSD';

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-1">
        <AddressDisplay address={address!} />
        <span className="text-xs text-neutral-400">{formattedBalance}</span>
      </div>
      <button
        onClick={handleDisconnect}
        className="p-2 text-neutral-400 hover:text-neutral-100 transition-colors rounded-lg hover:bg-neutral-800"
        aria-label="Disconnect wallet"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
      </button>
    </div>
  );
}
