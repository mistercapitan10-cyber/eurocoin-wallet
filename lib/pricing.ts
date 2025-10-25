export type PriceSource = "fixed" | "coingecko";

interface PricingConfig {
  source: PriceSource;
  fixedPrice: number | null;
  revalidate: number;
}

export interface TokenPriceResult {
  priceUsd: number | null;
  source: PriceSource;
  fetchedAt: number;
}

const parseNumber = (value: string | undefined): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const pricingConfig: PricingConfig = {
  source:
    (process.env.NEXT_PUBLIC_PRICE_SOURCE as PriceSource) ?? "fixed",
  fixedPrice: parseNumber(process.env.NEXT_PUBLIC_TOKEN_PRICE_USD),
  revalidate: parseNumber(process.env.NEXT_PUBLIC_PRICE_REVALIDATE_MS) ?? 60_000,
};

let cachedPrice: TokenPriceResult | null = null;

const fetchFromCoinGecko = async (): Promise<number | null> => {
  const coingeckoId =
    process.env.NEXT_PUBLIC_COINGECKO_TOKEN_ID ??
    process.env.NEXT_PUBLIC_TOKEN_SYMBOL?.toLowerCase();

  if (!coingeckoId) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.status}`);
    }

    const data = (await response.json()) as Record<
      string,
      { usd: number }
    >;
    const value = data[coingeckoId]?.usd;

    if (typeof value !== "number" || Number.isNaN(value)) {
      return null;
    }

    return value;
  } catch (error) {
    console.warn("[pricing] CoinGecko request failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const getFixedPrice = (): number | null => pricingConfig.fixedPrice;

const shouldRevalidate = (cached: TokenPriceResult | null): boolean => {
  if (!cached) {
    return true;
  }

  return Date.now() - cached.fetchedAt > pricingConfig.revalidate;
};

export const getTokenPriceUsd = async (): Promise<TokenPriceResult> => {
  if (!shouldRevalidate(cachedPrice)) {
    return cachedPrice!;
  }

  let price: number | null = null;
  let source: PriceSource = "fixed";

  if (pricingConfig.source === "coingecko") {
    price = await fetchFromCoinGecko();
    source = "coingecko";
  }

  if (price === null) {
    price = getFixedPrice();
    source = "fixed";
  }

  cachedPrice = {
    priceUsd: price,
    source,
    fetchedAt: Date.now(),
  };

  return cachedPrice;
};

export const getTokenPriceSync = (): TokenPriceResult => ({
  priceUsd: cachedPrice?.priceUsd ?? getFixedPrice(),
  source: cachedPrice?.source ?? pricingConfig.source,
  fetchedAt: cachedPrice?.fetchedAt ?? Date.now(),
});
