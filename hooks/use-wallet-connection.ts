"use client";

import { useCallback, useMemo } from "react";
import {
  useAccount,
  useChains,
  useConnect,
  useDisconnect,
} from "wagmi";

interface UseWalletConnectionResult {
  address?: `0x${string}`;
  chainId?: number;
  connectorName?: string;
  currentChainName?: string;
  status: ReturnType<typeof useAccount>["status"];
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isDisconnecting: boolean;
  canConnect: boolean;
  connectError?: Error;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useWalletConnection(): UseWalletConnectionResult {
  const {
    address,
    chainId,
    connector,
    status,
    isConnected,
    isConnecting,
    isReconnecting,
  } = useAccount();
  const { connectAsync, connectors, isPending, error } = useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();
  const chains = useChains();

  const metaMaskConnector = useMemo(
    () => connectors.find((item) => item.id === "metaMask"),
    [connectors],
  );

  const handleConnect = useCallback(async () => {
    if (!metaMaskConnector) {
      throw new Error("MetaMask не найден. Установите расширение и включите его.");
    }

    await connectAsync({ connector: metaMaskConnector });
  }, [connectAsync, metaMaskConnector]);

  const handleDisconnect = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const currentChain = useMemo(
    () => chains.find((chain) => chain.id === chainId),
    [chains, chainId],
  );

  return {
    address,
    chainId,
    connectorName: connector?.name ?? metaMaskConnector?.name,
    currentChainName: currentChain?.name,
    status,
    isConnected,
    isConnecting: isConnecting || isPending,
    isReconnecting,
    isDisconnecting,
    canConnect: Boolean(metaMaskConnector),
    connectError: error ?? undefined,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}
