import { describe, expect, it } from "vitest";
import { evaluateAlert, notificationDeduplicationKey } from "./domain";
const now = new Date("2026-09-15T10:00:00Z");
describe("cenová upozornění", () => {
  it("spustí cílovou cenu", () =>
    expect(
      evaluateAlert(
        {
          targetPriceMinor: 55000,
          onHistoricalLow: false,
          lastTriggeredAt: null,
          cooldownHours: 24,
        },
        { czkMinor: 49900, usdMinor: 2400, previousOwnMinimum: 2500, now },
      ).reason,
    ).toBe("target"));
  it("respektuje cooldown", () =>
    expect(
      evaluateAlert(
        {
          targetPriceMinor: 55000,
          onHistoricalLow: true,
          lastTriggeredAt: new Date("2026-09-15T09:00:00Z"),
          cooldownHours: 24,
        },
        { czkMinor: 49900, usdMinor: 2400, previousOwnMinimum: 2500, now },
      ).triggered,
    ).toBe(false));
  it("rozpozná nové minimum", () =>
    expect(
      evaluateAlert(
        { targetPriceMinor: null, onHistoricalLow: true, lastTriggeredAt: null, cooldownHours: 24 },
        { czkMinor: 49900, usdMinor: 2400, previousOwnMinimum: 2500, now },
      ).reason,
    ).toBe("historical-low"));
  it("má stabilní deduplikaci", () =>
    expect(notificationDeduplicationKey("a", "target", 499)).toBe(
      notificationDeduplicationKey("a", "target", 499),
    ));
});
