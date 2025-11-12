import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/config/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const RPC_URL_MAINNET = process.env.NEXT_PUBLIC_RPC_URL_MAINNET;
const RPC_URL_SEPOLIA = process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA;

// Public RPC endpoints as fallback (no rate limits)
const PUBLIC_RPC_MAINNET = "https://eth.llamarpc.com";
const PUBLIC_RPC_SEPOLIA = "https://sepolia.drpc.org";

const resolveTransport = (chainId: number) => {
  // Mainnet
  if (chainId === mainnet.id) {
    // Use explicit mainnet RPC URL if provided
    if (RPC_URL_MAINNET) {
      return http(RPC_URL_MAINNET);
    }
    // Use generic RPC URL if provided and matches default chain
    if (RPC_URL && chainId === DEFAULT_CHAIN.id) {
      return http(RPC_URL);
    }
    // Fallback to public RPC (no rate limits)
    return http(PUBLIC_RPC_MAINNET);
  }

  // Sepolia
  if (chainId === sepolia.id) {
    // Use explicit Sepolia RPC URL if provided
    if (RPC_URL_SEPOLIA) {
      return http(RPC_URL_SEPOLIA);
    }
    // Fallback to public RPC (no rate limits)
    return http(PUBLIC_RPC_SEPOLIA);
  }

  // Default fallback (should not happen with our chains)
  return http(PUBLIC_RPC_MAINNET);
};

const defaultTransports = {
  [sepolia.id]: resolveTransport(sepolia.id),
  [mainnet.id]: resolveTransport(mainnet.id),
};

function getConnectors() {
  if (typeof window === "undefined") {
    return [];
  }

  return [
    metaMask({
      dappMetadata: {
        name: "Web Wallet",
      },
    }),
  ];
}

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: getConnectors(),
  transports: defaultTransports,
});

export const primaryChain = DEFAULT_CHAIN;
