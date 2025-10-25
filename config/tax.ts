const TAX_FUNCTIONS = ["tax", "taxPercent", "getTax"] as const;

type TaxFunctionName = (typeof TAX_FUNCTIONS)[number];

const parseInteger = (
  value: string | undefined,
  options: { defaultValue: number; min?: number; max?: number },
): number => {
  if (!value) {
    return options.defaultValue;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return options.defaultValue;
  }

  if (typeof options.min === "number" && parsed < options.min) {
    return options.defaultValue;
  }

  if (typeof options.max === "number" && parsed > options.max) {
    return options.defaultValue;
  }

  return parsed;
};

const envFunction = process.env.NEXT_PUBLIC_TOKEN_TAX_FUNCTION;

const taxFunctionName: TaxFunctionName = TAX_FUNCTIONS.includes(
  envFunction as TaxFunctionName,
)
  ? (envFunction as TaxFunctionName)
  : "tax";

export const TAX_CONFIG = {
  functionName: taxFunctionName,
  fallbackBps: parseInteger(process.env.NEXT_PUBLIC_TOKEN_TAX_BPS, {
    defaultValue: 0,
    min: 0,
    max: 10_000,
  }),
  scale: parseInteger(process.env.NEXT_PUBLIC_TOKEN_TAX_SCALE, {
    defaultValue: 10_000,
    min: 1,
  }),
} as const;

export const formatTaxPercent = (bps: number, scale: number): number =>
  Number.isFinite(bps) && scale > 0 ? bps / scale * 100 : 0;

export type TaxSource = "contract" | "fallback";
