"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { DEFAULT_CHAIN } from "@/config/chains";
import {
  TOKEN_CONFIG,
  isTokenConfigured,
} from "@/config/token";
import { useReadContract } from "wagmi";
import type { PriceSource } from "@/lib/pricing";
import { useWalletConnection } from "./use-wallet-connection";
import { useTokenInfo } from "./use-token-info";
import { useSupportedNetwork } from "./use-supported-network";
import { useTokenPrice } from "./use-token-price";

interface UseTokenBalanceResult {
  balance: bigint | null;
  formattedBalance: string | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  decimals: number | null;
  symbol: string | null;
  isTokenInfoReady: boolean;
  isTokenInfoLoading: boolean;
  usdValue: number | null;
  formattedUsdValue: string | null;
  priceUsd: number | null;
  priceSource: PriceSource;
  isPriceLoading: boolean;
  isPriceFetching: boolean;
  priceError: Error | null;
}

export function useTokenBalance(): UseTokenBalanceResult {
  const { address, isConnected } = useWalletConnection();
  const { isSupported, activeChainId } = useSupportedNetwork();
  const {
    decimals,
    symbol,
    isReady: isTokenInfoReady,
    isLoading: isTokenInfoLoading,
    error: tokenInfoError,
  } = useTokenInfo();
  const {
    priceUsd,
    source: priceSource,
    isLoading: isPriceLoading,
    isFetching: isPriceFetching,
    error: priceError,
    refetch: refetchPrice,
  } = useTokenPrice();

  const balanceQuery = useReadContract({
    abi: TOKEN_CONFIG.abi,
    address: TOKEN_CONFIG.address,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: activeChainId ?? DEFAULT_CHAIN.id,
    query: {
      enabled:
        Boolean(address) && isConnected && isSupported && isTokenConfigured,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: 30_000,
    },
  });

  const balance = balanceQuery.data ?? null;

  const formattedBalance = useMemo(() => {
    if (
      balance === null ||
      decimals === null ||
      Number.isNaN(decimals)
    ) {
      return null;
    }

    return formatUnits(balance, decimals);
  }, [balance, decimals]);

  const usdValue = useMemo(() => {
    if (
      balance === null ||
      decimals === null ||
      priceUsd === null ||
      Number.isNaN(decimals)
    ) {
      return null;
    }

    const tokenAmount = Number(formatUnits(balance, decimals));
    if (!Number.isFinite(tokenAmount)) {
      return null;
    }

    return tokenAmount * priceUsd;
  }, [balance, decimals, priceUsd]);

  const formattedUsdValue = useMemo(() => {
    if (usdValue === null) {
      return null;
    }

    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(usdValue);
  }, [usdValue]);

  const refetch = async () => {
    await Promise.all([balanceQuery.refetch(), refetchPrice()]);
  };

  return {
    balance,
    formattedBalance,
    isLoading: balanceQuery.isLoading || isTokenInfoLoading,
    isRefetching: balanceQuery.isRefetching,
    error:
      tokenInfoError ??
      ((balanceQuery.error as Error | undefined) ?? null),
    refetch,
    decimals,
    symbol,
    isTokenInfoReady,
    isTokenInfoLoading,
    usdValue,
    formattedUsdValue,
    priceUsd,
    priceSource,
    isPriceLoading,
    isPriceFetching,
    priceError,
  };
}
