import { describe, expect, it } from "vitest";
import { stableGameSlug } from "./slug";

describe("stabilní slug hry", () => {
  it("vytvoří čitelný slug s českou diakritikou", () => {
    expect(stableGameSlug("Žhavé léto: Edice roku")).toBe("zhave-leto-edice-roku");
  });

  it("řeší kolizi deterministickým stabilním suffixem", () => {
    const first = stableGameSlug("Portal", "cheapshark:1234");
    expect(first).toBe(stableGameSlug("Portal", "cheapshark:1234"));
    expect(first).not.toBe(stableGameSlug("Portal", "cheapshark:5678"));
  });
});
