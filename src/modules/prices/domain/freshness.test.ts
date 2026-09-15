import { describe, expect, it } from "vitest";
import { isPriceStale, relativeUpdateLabel } from "./freshness";

describe("čerstvost ceny", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  it("označí cenu starší než 12 hodin", () => {
    expect(isPriceStale(new Date("2026-09-14T23:00:00Z"), now)).toBe(true);
    expect(isPriceStale("2026-09-14T23:00:00.000Z", now)).toBe(true);
    expect(isPriceStale(new Date("2026-09-15T06:00:00Z"), now)).toBe(false);
  });
  it("vytvoří čitelný relativní čas", () => {
    expect(relativeUpdateLabel(new Date("2026-09-15T10:00:00Z"), now)).toBe("před 2 h");
  });
});
