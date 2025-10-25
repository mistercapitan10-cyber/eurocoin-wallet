import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/config/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

const defaultTransports = {
  [sepolia.id]: http(RPC_URL ?? "https://sepolia.drpc.org"),
  [mainnet.id]: http(),
};

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors:
    typeof window !== "undefined"
      ? [
          metaMask({
            dappMetadata: {
              name: "Web Wallet",
            },
            shimDisconnect: true,
          }),
        ]
      : [],
  transports: defaultTransports,
});

export const primaryChain = DEFAULT_CHAIN;
