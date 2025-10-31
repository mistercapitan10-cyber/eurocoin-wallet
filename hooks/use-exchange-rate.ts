import { useState, useEffect } from "react";

interface ExchangeRate {
  USD_EUR: number;
  loading: boolean;
  error: string | null;
}

export function useExchangeRate() {
  const [rate, setRate] = useState<ExchangeRate>({
    USD_EUR: 0.92, // Fallback rate (approximate EUR/USD)
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Try to fetch real USD/EUR rate from a free API
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch rate");
        }

        const data = await response.json();
        const usdEurRate = data.rates.EUR;

        setRate({
          USD_EUR: usdEurRate,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        // Use fallback rate
        setRate({
          USD_EUR: 0.92, // Fallback: approximate EUR/USD
          loading: false,
          error: "Не удалось загрузить курс. Используется примерный курс.",
        });
      }
    };

    fetchRate();

    // Refresh rate every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return rate;
}
