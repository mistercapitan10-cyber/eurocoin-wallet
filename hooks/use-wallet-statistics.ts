"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits, parseAbiItem, type Address, type PublicClient } from "viem";
import { TOKEN_CONFIG, isTokenConfigured } from "@/config/token";
import { useSupportedNetwork } from "@/hooks/use-supported-network";

interface WalletStatistics {
  totalSpent: string;
  totalReceived: string;
  isLoading: boolean;
  error: string | null;
  history: WalletHistoryEntry[];
}

interface WalletHistoryEntry {
  hash: string;
  blockNumber: number;
  timestamp?: number;
  direction: "incoming" | "outgoing";
  counterparty: string;
  value: bigint;
}

interface TransferLike {
  from?: string;
  to?: string;
  value?: string;
  timeStamp?: string;
  hash?: string;
  blockNumber?: string;
}

interface TokenStatistics {
  spent: bigint;
  received: bigint;
  history: WalletHistoryEntry[];
}

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ?? "";
const CUSTOM_ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL ?? "";

const EXPLORER_URLS: Record<number, string> = {
  1: "https://api.etherscan.io/api",
  11155111: "https://api-sepolia.etherscan.io/api",
};

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const TOKEN_DECIMALS = Number.isFinite(TOKEN_CONFIG.decimals) ? TOKEN_CONFIG.decimals : 18;

const START_BLOCK = BigInt(Math.max(0, TOKEN_CONFIG.historyStartBlock));
const FALLBACK_LOOKBACK = BigInt(5_000_000); // ~2 years of Ethereum blocks
const MAX_LOG_CHUNK = BigInt(50_000);
const MIN_LOG_CHUNK = BigInt(1_250);
const HISTORY_LIMIT = 8;

const ZERO_BIGINT = BigInt(0);
const ONE_BIGINT = BigInt(1);
const TWO_BIGINT = BigInt(2);

const ZERO_TOTALS = { spent: ZERO_BIGINT, received: ZERO_BIGINT };
const toBigInt = (value: bigint | number): bigint =>
  typeof value === "bigint" ? value : BigInt(value);

const explorerUrlForChain = (chainId?: number): string | null => {
  if (CUSTOM_ETHERSCAN_BASE_URL) {
    return CUSTOM_ETHERSCAN_BASE_URL;
  }

  if (!chainId) {
    return null;
  }

  return EXPLORER_URLS[chainId] ?? null;
};

const isChunkTooLargeError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    ((error as { shortMessage?: string }).shortMessage ?? "").toLowerCase() ||
    ((error as { details?: string }).details ?? "").toLowerCase() ||
    ((error as Error).message ?? "").toLowerCase();

  return (
    message.includes("block range") ||
    message.includes("response size") ||
    message.includes("too many results") ||
    message.includes("more than") ||
    message.includes("try with this block range")
  );
};

const normalizeAddress = (value: string | undefined): string => value?.toLowerCase() ?? "";

const parseBlockNumber = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BLOCK_NUMBER_TTL = 30_000; // 30 seconds
const BLOCK_DETAILS_TTL = 60_000; // 60 seconds

type BlockNumberCacheEntry = { value: bigint; expiresAt: number };
type BlockDetailsCacheEntry = { timestamp: number; expiresAt: number };

const blockNumberCache = new Map<number, BlockNumberCacheEntry>();
const blockDetailsCache = new Map<string, BlockDetailsCacheEntry>();

const getCacheKeyForBlockNumber = (client: PublicClient): number =>
  client.chain?.id ?? TOKEN_CONFIG.chainId ?? 0;

const getCacheKeyForBlockDetails = (client: PublicClient, blockNumber: bigint): string =>
  `${client.chain?.id ?? TOKEN_CONFIG.chainId ?? 0}-${blockNumber.toString()}`;

async function getLatestBlockNumberWithCache(client: PublicClient): Promise<bigint> {
  const cacheKey = getCacheKeyForBlockNumber(client);
  const now = Date.now();
  const cached = blockNumberCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const latestBlock = await client.getBlockNumber();
  blockNumberCache.set(cacheKey, { value: latestBlock, expiresAt: now + BLOCK_NUMBER_TTL });
  return latestBlock;
}

async function getBlockTimestampWithCache(
  client: PublicClient,
  blockNumber: bigint,
): Promise<number> {
  const cacheKey = getCacheKeyForBlockDetails(client, blockNumber);
  const now = Date.now();
  const cached = blockDetailsCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.timestamp;
  }

  const block = await client.getBlock({ blockNumber });
  const timestamp = Number(block.timestamp);
  blockDetailsCache.set(cacheKey, { timestamp, expiresAt: now + BLOCK_DETAILS_TTL });
  return timestamp;
}

async function fetchTotalsViaExplorer(
  walletAddress: string,
  chainId?: number,
): Promise<TokenStatistics | null> {
  if (!ETHERSCAN_API_KEY) {
    return null;
  }

  const baseUrl = explorerUrlForChain(chainId ?? TOKEN_CONFIG.chainId);
  if (!baseUrl) {
    return null;
  }

  const params = new URLSearchParams({
    module: "account",
    action: "tokentx",
    contractaddress: TOKEN_CONFIG.address,
    address: walletAddress,
    startblock: START_BLOCK.toString(),
    endblock: "99999999",
    page: "1",
    offset: "10000",
    sort: "asc",
    apikey: ETHERSCAN_API_KEY,
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Etherscan запрос выполнен с ошибкой.");
  }

  const data = await response.json();
  if (data.status === "1" && Array.isArray(data.result)) {
    let spent = ZERO_BIGINT;
    let received = ZERO_BIGINT;
    const normalized = normalizeAddress(walletAddress);
    const history: WalletHistoryEntry[] = [];

    for (const tx of data.result as TransferLike[]) {
      const value = BigInt(tx.value ?? "0");
      const from = normalizeAddress(tx.from);
      const to = normalizeAddress(tx.to);
      const isIncoming = to === normalized;

      if (from === normalized) {
        spent += value;
      }
      if (isIncoming) {
        received += value;
      }

      if (tx.hash) {
        history.push({
          hash: tx.hash,
          blockNumber: parseBlockNumber(tx.blockNumber),
          timestamp: tx.timeStamp ? Number.parseInt(tx.timeStamp, 10) : undefined,
          direction: isIncoming ? "incoming" : "outgoing",
          counterparty: isIncoming ? (tx.from ?? "") : (tx.to ?? ""),
          value,
        });
      }
    }

    const latestHistory = history
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, HISTORY_LIMIT);

    return { spent, received, history: latestHistory };
  }

  if (data.message === "No transactions found") {
    return { ...ZERO_TOTALS, history: [] };
  }

  if (typeof data.message === "string" && data.message.toLowerCase().includes("rate limit")) {
    throw new Error("Превышен лимит Etherscan. Попробуйте через минуту.");
  }

  throw new Error(data.result ?? data.message ?? "Неизвестная ошибка ответа Etherscan.");
}

async function fetchTotalsViaLogs(
  walletAddress: Address,
  client: PublicClient,
): Promise<TokenStatistics> {
  const latestBlock = await getLatestBlockNumberWithCache(client);
  const fromBlock =
    START_BLOCK > ZERO_BIGINT
      ? START_BLOCK
      : latestBlock > FALLBACK_LOOKBACK
        ? latestBlock - FALLBACK_LOOKBACK
        : ZERO_BIGINT;

  let spent = ZERO_BIGINT;
  let received = ZERO_BIGINT;
  const latestIncoming: Array<{
    blockNumber: bigint;
    logIndex: bigint;
    transactionHash: string;
    direction: "incoming" | "outgoing";
    counterparty: string;
    value: bigint;
  }> = [];

  const latestOutgoing: typeof latestIncoming = [];

  const appendHistoryLog = (
    target: typeof latestIncoming,
    entry: (typeof latestIncoming)[number],
  ) => {
    target.push(entry);
    if (target.length > HISTORY_LIMIT) {
      target.shift();
    }
  };

  const collect = async (direction: "from" | "to", target: typeof latestIncoming) => {
    let cursor = fromBlock;
    let chunkSize = MAX_LOG_CHUNK;

    while (cursor <= latestBlock) {
      let rangeEnd = cursor + chunkSize - ONE_BIGINT;
      if (rangeEnd > latestBlock) {
        rangeEnd = latestBlock;
      }

      try {
        const logs = await client.getLogs({
          address: TOKEN_CONFIG.address,
          event: TRANSFER_EVENT,
          args: direction === "from" ? { from: walletAddress } : { to: walletAddress },
          fromBlock: cursor,
          toBlock: rangeEnd,
        });

        for (const log of logs) {
          if (!log.args?.value || !log.transactionHash || typeof log.logIndex === "undefined") {
            continue;
          }

          const counterparty =
            direction === "from"
              ? ((log.args.to as string | undefined) ?? "")
              : ((log.args.from as string | undefined) ?? "");

          if (direction === "from") {
            spent += log.args.value;
          } else {
            received += log.args.value;
          }

          appendHistoryLog(target, {
            blockNumber: log.blockNumber,
            logIndex: toBigInt(log.logIndex),
            transactionHash: log.transactionHash,
            direction: direction === "from" ? "outgoing" : "incoming",
            counterparty,
            value: log.args.value,
          });
        }

        cursor = rangeEnd + ONE_BIGINT;
        if (chunkSize < MAX_LOG_CHUNK) {
          chunkSize = chunkSize * TWO_BIGINT;
          if (chunkSize > MAX_LOG_CHUNK) {
            chunkSize = MAX_LOG_CHUNK;
          }
        }
      } catch (error) {
        if (isChunkTooLargeError(error) && chunkSize > MIN_LOG_CHUNK) {
          chunkSize = chunkSize / TWO_BIGINT;
          continue;
        }

        throw error instanceof Error ? error : new Error("Не удалось получить логи токена.");
      }
    }
  };

  await collect("from", latestOutgoing);
  await collect("to", latestIncoming);

  const mergedLogs = [...latestIncoming, ...latestOutgoing]
    .sort((a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return Number(b.logIndex - a.logIndex);
      }
      return Number(b.blockNumber - a.blockNumber);
    })
    .slice(0, HISTORY_LIMIT);

  const uniqueBlocks = Array.from(new Set(mergedLogs.map((entry) => entry.blockNumber)));

  const blockTimestamps = new Map<bigint, number>();
  for (const blockNumber of uniqueBlocks) {
    const timestamp = await getBlockTimestampWithCache(client, blockNumber);
    blockTimestamps.set(blockNumber, timestamp);
  }

  const history = mergedLogs.map((entry) => ({
    hash: entry.transactionHash,
    blockNumber: Number(entry.blockNumber),
    timestamp: blockTimestamps.get(entry.blockNumber),
    direction: entry.direction,
    counterparty: entry.counterparty,
    value: entry.value,
  }));

  return { spent, received, history };
}

export function useWalletStatistics(): WalletStatistics {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { activeChainId, isSupported } = useSupportedNetwork();

  const [totals, setTotals] = useState(ZERO_TOTALS);
  const [history, setHistory] = useState<WalletHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !isConnected || !isTokenConfigured || !isSupported) {
      setTotals(ZERO_TOTALS);
      setHistory([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadStatistics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let aggregatedTotals: TokenStatistics | null = null;

        try {
          aggregatedTotals = await fetchTotalsViaExplorer(address, activeChainId);
        } catch (explorerError) {
          console.warn("[wallet] Explorer statistics fallback:", explorerError);
        }

        if (!aggregatedTotals) {
          if (!publicClient) {
            throw new Error("Нет RPC-клиента для чтения истории. Проверьте конфигурацию wagmi.");
          }

          aggregatedTotals = await fetchTotalsViaLogs(address as Address, publicClient);
        }

        if (!aggregatedTotals) {
          throw new Error("Не удалось получить историю EURC ни через Etherscan, ни напрямую.");
        }

        if (cancelled) {
          return;
        }

        setTotals({
          spent: aggregatedTotals.spent,
          received: aggregatedTotals.received,
        });
        setHistory(aggregatedTotals.history);
      } catch (err) {
        console.error("Failed to fetch EURC statistics", err);
        if (!cancelled) {
          setTotals(ZERO_TOTALS);
          setHistory([]);
          setError(
            err instanceof Error
              ? /429|rate limit/i.test(err.message)
                ? "Похоже, достигнут лимит запросов RPC. Подождите немного и попробуйте снова."
                : err.message
              : "Не удалось получить историю EURC. Проверьте RPC или ключ Etherscan.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, activeChainId, publicClient, isSupported]);

  const statistics = useMemo(() => {
    if (!isTokenConfigured) {
      return {
        totalSpent: "0.00",
        totalReceived: "0.00",
      };
    }

    const totalSpent = Number.parseFloat(formatUnits(totals.spent, TOKEN_DECIMALS));
    const received = Number.parseFloat(formatUnits(totals.received, TOKEN_DECIMALS));

    if (!Number.isFinite(totalSpent) || !Number.isFinite(received)) {
      return {
        totalSpent: "0.00",
        totalReceived: "0.00",
      };
    }

    return {
      totalSpent: totalSpent.toFixed(2),
      totalReceived: received.toFixed(2),
    };
  }, [totals]);

  return {
    ...statistics,
    isLoading,
    error,
    history,
  };
}
