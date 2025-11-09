import type { Address } from "viem";
import { ERC20_ABI } from "@/lib/abi/erc20";

export const FALLBACK_TOKEN_ADDRESS =
  "0x0000000000000000000000000000000000000000";
const FALLBACK_SYMBOL = "TKN";
const FALLBACK_DECIMALS = 18;
const FALLBACK_HISTORY_START_BLOCK = 0;
const FALLBACK_CHAIN_ID = 11155111;

const parseAddress = (value: string | undefined): Address => {
  if (!value || value === "") {
    return FALLBACK_TOKEN_ADDRESS;
  }

  return value as Address;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseChainId = (value: string | undefined): number => {
  if (!value) {
    return FALLBACK_CHAIN_ID;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return FALLBACK_CHAIN_ID;
  }

  return parsed;
};

export const TOKEN_CONFIG = {
  address: parseAddress(process.env.NEXT_PUBLIC_TOKEN_ADDRESS),
  chainId: parseChainId(process.env.NEXT_PUBLIC_TOKEN_CHAIN_ID),
  symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? FALLBACK_SYMBOL,
  decimals: parseNumber(
    process.env.NEXT_PUBLIC_TOKEN_DECIMALS,
    FALLBACK_DECIMALS,
  ),
  historyStartBlock: Math.max(
    0,
    parseNumber(
      process.env.NEXT_PUBLIC_TOKEN_HISTORY_START_BLOCK,
      FALLBACK_HISTORY_START_BLOCK,
    ),
  ),
  abi: ERC20_ABI,
} as const;

export const isTokenConfigured =
  TOKEN_CONFIG.address !== FALLBACK_TOKEN_ADDRESS;
