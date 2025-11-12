"use client";

import { useMemo } from "react";
import { DEFAULT_CHAIN } from "@/config/chains";
import { TOKEN_CONFIG, isTokenConfigured } from "@/config/token";
import { useReadContract } from "wagmi";
import { useSupportedNetwork } from "./use-supported-network";

interface UseTokenInfoResult {
  symbol: string | null;
  decimals: number | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useTokenInfo(): UseTokenInfoResult {
  const { activeChainId, isSupported } = useSupportedNetwork();
  const chainId = activeChainId ?? DEFAULT_CHAIN.id;
  const enabled = isTokenConfigured && (!activeChainId || isSupported);

  // Debug logging
  if (typeof window !== "undefined") {
    console.log("[useTokenInfo] Configuration:", {
      isTokenConfigured,
      tokenAddress: TOKEN_CONFIG.address,
      chainId,
      activeChainId,
      isSupported,
      enabled,
      defaultChainId: DEFAULT_CHAIN.id,
    });
  }

  const symbolQuery = useReadContract({
    abi: TOKEN_CONFIG.abi,
    address: TOKEN_CONFIG.address,
    functionName: "symbol",
    chainId,
    query: {
      enabled,
      staleTime: 60_000,
      retry: 2,
    },
  });

  const decimalsQuery = useReadContract({
    abi: TOKEN_CONFIG.abi,
    address: TOKEN_CONFIG.address,
    functionName: "decimals",
    chainId,
    query: {
      enabled,
      staleTime: 60_000,
      retry: 2,
    },
  });

  const isLoading = symbolQuery.isLoading || decimalsQuery.isLoading;
  const error =
    (symbolQuery.error as Error | undefined) ?? (decimalsQuery.error as Error | undefined) ?? null;

  // Debug logging for errors
  if (error && typeof window !== "undefined") {
    console.error("[useTokenInfo] Error fetching token info:", {
      error: error.message,
      symbolError: symbolQuery.error,
      decimalsError: decimalsQuery.error,
      tokenAddress: TOKEN_CONFIG.address,
      chainId,
    });
  }

  const symbol = useMemo(() => {
    if (!symbolQuery.data) {
      return null;
    }

    return String(symbolQuery.data);
  }, [symbolQuery.data]);

  const decimals = useMemo(() => {
    if (typeof decimalsQuery.data === "undefined") {
      return null;
    }

    return Number(decimalsQuery.data);
  }, [decimalsQuery.data]);

  return {
    symbol,
    decimals,
    isReady:
      isTokenConfigured &&
      Boolean(symbolQuery.data) &&
      typeof decimalsQuery.data !== "undefined" &&
      error === null,
    isLoading,
    error,
  };
}
