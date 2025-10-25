import type { Address } from "viem";
import { ERC20_ABI } from "@/lib/abi/erc20";

export const FALLBACK_TOKEN_ADDRESS =
  "0x0000000000000000000000000000000000000000";
const FALLBACK_SYMBOL = "TKN";
const FALLBACK_DECIMALS = 18;

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

export const TOKEN_CONFIG = {
  address: parseAddress(process.env.NEXT_PUBLIC_TOKEN_ADDRESS),
  symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? FALLBACK_SYMBOL,
  decimals: parseNumber(
    process.env.NEXT_PUBLIC_TOKEN_DECIMALS,
    FALLBACK_DECIMALS,
  ),
  abi: ERC20_ABI,
} as const;

export const isTokenConfigured =
  TOKEN_CONFIG.address !== FALLBACK_TOKEN_ADDRESS;
