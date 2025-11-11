"use client";

import { useAccount } from "wagmi";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

export interface WithdrawRequestView {
  id: string;
  amount: string;
  tokenSymbol: string;
  destinationAddress: string;
  status: string;
  createdAt: string;
  txHash?: string | null;
}

interface ApiResponse {
  requests: Array<{
    id: string;
    amount: string;
    tokenSymbol: string;
    destinationAddress: string;
    status: string;
    createdAt: string;
    txHash?: string | null;
  }>;
}

export function useWithdrawRequests() {
  const { address } = useAccount();
  const { isAuthenticated, authType } = useAuth();
  const [requests, setRequests] = useState<WithdrawRequestView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (authType === "wallet" && address) {
        params.set("walletAddress", address);
      }

      const response = await fetch(
        `/api/internal-balance/withdraw${params.size ? `?${params.toString()}` : ""}`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload && payload.error) || "Failed to load withdraw requests");
      }

      const data = (await response.json()) as ApiResponse;
      setRequests(
        data.requests.map((request) => ({
          id: request.id,
          amount: request.amount,
          tokenSymbol: request.tokenSymbol,
          destinationAddress: request.destinationAddress,
          status: request.status,
          createdAt: request.createdAt,
          txHash: request.txHash ?? null,
        })),
      );
    } catch (fetchError) {
      if ((fetchError as { name?: string }).name === "AbortError") {
        return;
      }
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load requests");
      setRequests([]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  }, [address, authType, isAuthenticated]);

  useEffect(() => {
    void fetchRequests();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchRequests]);

  return {
    requests,
    isLoading,
    error,
    refresh: fetchRequests,
  };
}
