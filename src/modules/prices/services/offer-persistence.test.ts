import { describe, expect, it } from "vitest";
import { hasRelevantPriceChange } from "../domain/price-change";

describe("offer persistence", () => {
  it("nevytváří pozorování pro stejnou relevantní cenu", () => {
    const price = { priceMinor: 999, regularPriceMinor: 1999, currency: "USD" };
    expect(hasRelevantPriceChange(price, price)).toBe(false);
    expect(hasRelevantPriceChange(price, { ...price, priceMinor: 899 })).toBe(true);
    expect(hasRelevantPriceChange(null, price)).toBe(true);
  });
});
