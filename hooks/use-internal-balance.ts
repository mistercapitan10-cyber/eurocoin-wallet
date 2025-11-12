"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_CONFIG } from "@/config/token";
import { useAuth } from "@/hooks/use-auth";

type LedgerEntryType = "credit" | "debit" | "adjustment" | "payout";

interface ApiBalanceResponse {
  tokenSymbol: string;
  decimals: number;
  balance: {
    balance: string;
    pendingOnchain: string;
    lockedAmount: string;
    updatedAt?: string;
  };
  wallet?: {
    id: string;
    walletAddress?: string | null;
    defaultWithdrawAddress?: string | null;
  };
  ledger: Array<{
    id: string;
    entryType: LedgerEntryType;
    amount: string;
    reference?: string | null;
    createdAt?: string;
    createdBy?: string | null;
  }>;
}

export interface InternalLedgerView {
  id: string;
  entryType: LedgerEntryType;
  direction: "credit" | "debit";
  amountMinor: string;
  amount: string;
  reference: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface InternalWalletSummary {
  id: string;
  walletAddress: string | null;
  defaultWithdrawAddress: string | null;
}

export interface UseInternalBalanceResult {
  tokenSymbol: string;
  decimals: number;
  totalMinor: string;
  availableMinor: string;
  pendingMinor: string;
  lockedMinor: string;
  totalFormatted: string;
  availableFormatted: string;
  pendingFormatted: string;
  lockedFormatted: string;
  ledger: InternalLedgerView[];
  wallet: InternalWalletSummary | null;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_DECIMALS =
  Number.isFinite(TOKEN_CONFIG.decimals) && Number(TOKEN_CONFIG.decimals) > 0
    ? Number(TOKEN_CONFIG.decimals)
    : 18;
const DEFAULT_TOKEN_SYMBOL = TOKEN_CONFIG.symbol || "EURC";

type InternalBalanceState = Omit<UseInternalBalanceResult, "refresh">;

const INITIAL_STATE: InternalBalanceState = {
  tokenSymbol: DEFAULT_TOKEN_SYMBOL,
  decimals: DEFAULT_DECIMALS,
  totalMinor: "0",
  availableMinor: "0",
  pendingMinor: "0",
  lockedMinor: "0",
  totalFormatted: "0",
  availableFormatted: "0",
  pendingFormatted: "0",
  lockedFormatted: "0",
  ledger: [],
  wallet: null,
  updatedAt: null,
  isLoading: false,
  error: null,
};

function formatAmount(value: string, decimals: number): string {
  try {
    return formatUnits(BigInt(value), decimals);
  } catch {
    return "0";
  }
}

export function useInternalBalance(): UseInternalBalanceResult {
  const { address } = useAccount();
  const { authType, isAuthenticated } = useAuth();
  const [state, setState] = useState<InternalBalanceState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canFetch =
    isAuthenticated &&
    ((authType === "wallet" && Boolean(address)) || authType === "email" || authType === null);

  const fetchBalance = useCallback(async () => {
    if (!canFetch) {
      setState((prev) => ({
        ...prev,
        totalMinor: "0",
        availableMinor: "0",
        pendingMinor: "0",
        lockedMinor: "0",
        totalFormatted: "0",
        availableFormatted: "0",
        pendingFormatted: "0",
        lockedFormatted: "0",
        ledger: [],
        wallet: null,
        updatedAt: null,
        isLoading: false,
        error: null,
      }));
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (authType === "wallet" && address) {
        params.set("walletAddress", address);
      }

      const response = await fetch(
        `/api/internal-balance${params.size > 0 ? `?${params.toString()}` : ""}`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        let errorMessage = "Failed to load internal balance information";
        let errorDetails: string | undefined;
        const contentType = response.headers.get("content-type");

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorBody = await response.json();
            if (errorBody && typeof errorBody.error === "string") {
              errorMessage = errorBody.error;
            }
            if (errorBody && typeof errorBody.details === "string") {
              errorDetails = errorBody.details;
            }
            if (typeof errorBody === "string") {
              errorMessage = errorBody;
            } else if (errorBody && typeof errorBody === "object" && "message" in errorBody) {
              errorMessage = String(errorBody.message);
            }
          } else {
            const text = await response.text();
            if (text && text.trim()) {
              errorMessage = text.trim();
            }
          }
        } catch {
          // Use default error message if parsing fails
          errorMessage = `HTTP ${response.status}: ${response.statusText || "Unknown error"}`;
        }

        const fullErrorMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;

        console.error("[hooks:useInternalBalance] API error:", {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorDetails,
        });

        throw new Error(fullErrorMessage);
      }

      const payload = (await response.json()) as ApiBalanceResponse;
      const tokenSymbol = payload.tokenSymbol || DEFAULT_TOKEN_SYMBOL;
      const decimals =
        Number.isFinite(payload.decimals) && payload.decimals > 0
          ? payload.decimals
          : DEFAULT_DECIMALS;

      const balanceValue = payload.balance?.balance ?? "0";
      const pendingValue = payload.balance?.pendingOnchain ?? "0";
      const lockedValue = payload.balance?.lockedAmount ?? "0";

      const totalBigInt = BigInt(balanceValue);
      const pendingBigInt = BigInt(pendingValue);
      const lockedBigInt = BigInt(lockedValue);
      const availableBigInt = totalBigInt - pendingBigInt - lockedBigInt;
      const availableValue = availableBigInt > BigInt(0) ? availableBigInt.toString() : "0";

      const ledgerEntries: InternalLedgerView[] = Array.isArray(payload.ledger)
        ? payload.ledger.map((entry) => {
            const entryAmount = entry.amount ?? "0";
            const amountFormatted = formatAmount(entryAmount, decimals);
            const entryType: LedgerEntryType = entry.entryType ?? "credit";
            const direction = entryType === "debit" || entryType === "payout" ? "debit" : "credit";

            const createdAt = entry.createdAt
              ? new Date(entry.createdAt).toISOString()
              : new Date().toISOString();

            return {
              id: entry.id,
              entryType,
              direction,
              amountMinor: entryAmount,
              amount: amountFormatted,
              reference: entry.reference ?? null,
              createdAt,
              createdBy: entry.createdBy ?? null,
            };
          })
        : [];

      setState((prev) => ({
        ...prev,
        tokenSymbol,
        decimals,
        totalMinor: balanceValue,
        availableMinor: availableValue,
        pendingMinor: pendingValue,
        lockedMinor: lockedValue,
        totalFormatted: formatAmount(balanceValue, decimals),
        availableFormatted: formatAmount(availableValue, decimals),
        pendingFormatted: formatAmount(pendingValue, decimals),
        lockedFormatted: formatAmount(lockedValue, decimals),
        ledger: ledgerEntries,
        wallet: payload.wallet
          ? {
              id: payload.wallet.id,
              walletAddress: payload.wallet.walletAddress ?? null,
              defaultWithdrawAddress: payload.wallet.defaultWithdrawAddress ?? null,
            }
          : null,
        updatedAt: payload.balance?.updatedAt
          ? new Date(payload.balance.updatedAt).toISOString()
          : new Date().toISOString(),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        return;
      }

      console.error("[hooks:useInternalBalance] Failed to load balance:", error);
      setState((prev) => ({
        ...prev,
        totalMinor: "0",
        availableMinor: "0",
        pendingMinor: "0",
        lockedMinor: "0",
        totalFormatted: "0",
        availableFormatted: "0",
        pendingFormatted: "0",
        lockedFormatted: "0",
        ledger: [],
        wallet: null,
        updatedAt: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load internal balance",
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [address, authType, canFetch]);

  useEffect(() => {
    void fetchBalance();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchBalance]);

  const totalFormatted = useMemo(
    () => formatAmount(state.totalMinor, state.decimals),
    [state.totalMinor, state.decimals],
  );

  const availableFormatted = useMemo(
    () => formatAmount(state.availableMinor, state.decimals),
    [state.availableMinor, state.decimals],
  );

  const pendingFormatted = useMemo(
    () => formatAmount(state.pendingMinor, state.decimals),
    [state.pendingMinor, state.decimals],
  );

  const lockedFormatted = useMemo(
    () => formatAmount(state.lockedMinor, state.decimals),
    [state.lockedMinor, state.decimals],
  );

  return {
    tokenSymbol: state.tokenSymbol,
    decimals: state.decimals,
    totalMinor: state.totalMinor,
    availableMinor: state.availableMinor,
    pendingMinor: state.pendingMinor,
    lockedMinor: state.lockedMinor,
    totalFormatted,
    availableFormatted,
    pendingFormatted,
    lockedFormatted,
    ledger: state.ledger,
    wallet: state.wallet,
    updatedAt: state.updatedAt,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchBalance,
  };
}
