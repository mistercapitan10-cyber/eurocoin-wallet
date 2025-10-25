import { mainnet, sepolia } from "wagmi/chains";

export const SUPPORTED_CHAINS = [sepolia, mainnet] as const;

export const DEFAULT_CHAIN = sepolia;

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);
