import { describe, expect, it } from "vitest";

import { convertUsdCentsToCzkHalere, formatMoney, parseUsdToCents } from "./money";

describe("money", () => {
  it("převádí desetinné USD na celé centy bez floating-point aritmetiky", () => {
    expect(parseUsdToCents("4.79")).toBe(479);
    expect(parseUsdToCents("19.999")).toBe(2000);
  });

  it("převádí centy na haléře a zaokrouhluje half-up", () => {
    expect(convertUsdCentsToCzkHalere(479, "20.927")).toBe(10024);
    expect(convertUsdCentsToCzkHalere(1, "20.5")).toBe(21);
  });

  it("formátuje částky česky", () => {
    expect(formatMoney({ minor: 10025, currency: "CZK" })).toBe("100,25 Kč");
    expect(formatMoney({ minor: 479, currency: "USD" })).toBe("$4.79");
  });
});
