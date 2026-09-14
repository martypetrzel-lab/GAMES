import Decimal from "decimal.js";

export type Currency = "USD" | "CZK";

export type Money = Readonly<{
  minor: number;
  currency: Currency;
}>;

function assertMinorUnits(value: number) {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Peněžní částka musí být bezpečné celé číslo.");
  }
}

export function parseUsdToCents(value: string): number {
  const cents = new Decimal(value).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const result = cents.toNumber();
  assertMinorUnits(result);
  return result;
}

export function convertUsdCentsToCzkHalere(usdCents: number, czkPerUsd: string): number {
  assertMinorUnits(usdCents);
  const halere = new Decimal(usdCents).times(czkPerUsd).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const result = halere.toNumber();
  assertMinorUnits(result);
  return result;
}

export function formatMoney({ minor, currency }: Money): string {
  assertMinorUnits(minor);
  const sign = minor < 0 ? "−" : "";
  const absolute = Math.abs(minor);
  const whole = Math.floor(absolute / 100).toLocaleString("cs-CZ");
  const fraction = String(absolute % 100).padStart(2, "0");
  const symbol = currency === "CZK" ? "Kč" : "$";

  return currency === "CZK"
    ? `${sign}${whole},${fraction} ${symbol}`
    : `${sign}${symbol}${whole}.${fraction}`;
}
