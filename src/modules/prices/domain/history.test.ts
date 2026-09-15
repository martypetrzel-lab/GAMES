import { describe, expect, it } from "vitest";
import { aggregateHistory, rangeStart } from "./history";

describe("history", () => {
  it("omezuje hustá data a zachová poslední bod", () => {
    const points = Array.from({ length: 1200 }, (_, i) => ({ observedAt: new Date(i), value: i }));
    const result = aggregateHistory(points, 500);
    expect(result.length).toBeLessThanOrEqual(501);
    expect(result.at(-1)?.value).toBe(1199);
  });
  it("validně vypočítá začátek rozsahu", () => {
    expect(rangeStart("30d", new Date("2026-02-01T00:00:00Z"))?.toISOString()).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(rangeStart("all")).toBeUndefined();
  });
});
