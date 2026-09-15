import { describe, expect, it } from "vitest";

import { ratePrice, summarizePrices } from "./price-analytics";

const day = (value: number) => new Date(`2026-01-${String(value).padStart(2, "0")}T00:00:00Z`);

describe("price analytics", () => {
  it("počítá minimum, maximum, průměr a medián", () => {
    const summary = summarizePrices([
      { priceMinor: 500, observedAt: day(1) },
      { priceMinor: 100, observedAt: day(2) },
      { priceMinor: 300, observedAt: day(3) },
      { priceMinor: 200, observedAt: day(4) },
    ]);
    expect(summary).toMatchObject({
      count: 4,
      minimum: 100,
      maximum: 500,
      average: 275,
      median: 250,
    });
  });

  it("nepovažuje krátkou nebo jedinou historii za dostatečnou", () => {
    const summary = summarizePrices([{ priceMinor: 100, observedAt: day(1) }]);
    expect(ratePrice(100, summary)).toBe("insufficient-data");
  });

  it("hodnotí cenu až z dostatečně dlouhé vlastní historie", () => {
    const summary = summarizePrices(
      [1, 5, 10, 15, 20].map((d) => ({ priceMinor: 1000, observedAt: day(d) })),
    );
    expect(ratePrice(1000, summary)).toBe("historical-low");
    expect(ratePrice(1150, summary)).toBe("above-usual");
  });
});
