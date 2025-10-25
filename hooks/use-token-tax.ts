"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { DEFAULT_CHAIN } from "@/config/chains";
import { TAX_CONFIG, formatTaxPercent, type TaxSource } from "@/config/tax";
import { TOKEN_CONFIG, isTokenConfigured } from "@/config/token";
import { useSupportedNetwork } from "./use-supported-network";

interface UseTokenTaxResult {
  taxBps: number;
  taxPercent: number;
  formattedTax: string;
  source: TaxSource;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const formatTaxLabel = (percent: number): string =>
  new Intl.NumberFormat("ru-RU", {
    style: "percent",
    minimumFractionDigits: percent > 0 && percent < 0.1 ? 2 : 1,
    maximumFractionDigits: 2,
  }).format(percent / 100);

export function useTokenTax(): UseTokenTaxResult {
  const { isSupported, activeChainId } = useSupportedNetwork();

  const taxQueryEnabled = isTokenConfigured && isSupported;

  const taxQuery = useReadContract({
    abi: TOKEN_CONFIG.abi,
    address: TOKEN_CONFIG.address,
    functionName: TAX_CONFIG.functionName,
    chainId: activeChainId ?? DEFAULT_CHAIN.id,
    query: {
      enabled: taxQueryEnabled,
      refetchInterval: 120_000,
      staleTime: 120_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  });

  const contractTaxBps = useMemo(() => {
    if (!taxQuery.data) {
      return null;
    }

    const rawValue =
      typeof taxQuery.data === "bigint"
        ? Number(taxQuery.data)
        : Number(taxQuery.data as unknown);

    if (!Number.isFinite(rawValue) || rawValue < 0) {
      return null;
    }

    return rawValue;
  }, [taxQuery.data]);

  const taxBps = contractTaxBps ?? TAX_CONFIG.fallbackBps;

  const taxPercent = formatTaxPercent(taxBps, TAX_CONFIG.scale);

  const formattedTax = formatTaxLabel(taxPercent);

  const source: TaxSource =
    contractTaxBps !== null && taxQueryEnabled ? "contract" : "fallback";

  const refetch = async () => {
    await taxQuery.refetch();
  };

  return {
    taxBps,
    taxPercent,
    formattedTax,
    source,
    isLoading: taxQuery.isLoading,
    isFetching: taxQuery.isRefetching,
    error: (taxQuery.error as Error | undefined) ?? null,
    refetch,
  };
}
