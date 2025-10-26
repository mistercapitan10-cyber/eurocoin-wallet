"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { formatUnits } from "viem";

interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  isError: string;
}

interface WalletStatistics {
  totalSpent: string;
  cancelledAmount: string;
  isLoading: boolean;
  error: string | null;
}

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "YourApiKeyToken";
const ETHERSCAN_BASE_URL =
  process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL || "https://api.etherscan.io/api";

export function useWalletStatistics(): WalletStatistics {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the appropriate Etherscan URL based on chain
  const getExplorerUrl = useCallback(() => {
    switch (chainId) {
      case 11155111: // Sepolia
        return "https://api-sepolia.etherscan.io/api";
      case 1: // Mainnet
        return "https://api.etherscan.io/api";
      default:
        return ETHERSCAN_BASE_URL;
    }
  }, [chainId]);

  useEffect(() => {
    if (!address || !isConnected) {
      setTransactions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const explorerUrl = getExplorerUrl();
        const url = `${explorerUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "1" && data.result) {
          const txs = data.result.filter(
            (tx: Transaction) => tx.from.toLowerCase() === address.toLowerCase(),
          );
          setTransactions(txs);
        } else {
          setTransactions([]);
          if (data.message && data.message.includes("rate limit")) {
            setError("Rate limit exceeded. Please try again later.");
          }
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to fetch transaction history");
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, isConnected, chainId, getExplorerUrl]);

  const statistics = useMemo(() => {
    if (transactions.length === 0) {
      return {
        totalSpent: "0.00",
        cancelledAmount: "0.00",
      };
    }

    let totalSpent = BigInt(0);
    let cancelledAmount = BigInt(0);

    transactions.forEach((tx) => {
      const value = BigInt(tx.value);
      const gasUsed = BigInt(tx.gasUsed);
      const gasPrice = BigInt(tx.gasPrice);
      const gasCost = gasUsed * gasPrice;

      // Total spent includes value + gas fees for outgoing transactions
      totalSpent += value + gasCost;

      // If transaction failed, count it as cancelled
      if (tx.isError === "1") {
        cancelledAmount += gasCost; // Only count gas fees for failed transactions
      }
    });

    // Convert from wei to ether
    const totalSpentEth = formatUnits(totalSpent, 18);
    const cancelledEth = formatUnits(cancelledAmount, 18);

    // Format to 2 decimal places
    return {
      totalSpent: parseFloat(totalSpentEth).toFixed(2),
      cancelledAmount: parseFloat(cancelledEth).toFixed(2),
    };
  }, [transactions]);

  return {
    ...statistics,
    isLoading,
    error,
  };
}
