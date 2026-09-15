import { describe, expect, it } from "vitest";
import { classifyProduct, effectiveProductType } from "./product-classification";

describe("klasifikace produktu", () => {
  it.each([
    ["Portal 2", "game", "GAME"],
    ["Portal 2: Soundtrack", null, "SOUNDTRACK"],
    ["Resident Evil Demo", null, "DEMO"],
    ["Expansion DLC", null, "DLC"],
    ["Modding Tool", null, "SOFTWARE"],
    ["Nejasná položka", "unknown", "UNKNOWN"],
  ] as const)("klasifikuje %s", (title, providerType, expected) => {
    expect(classifyProduct(title, providerType)).toBe(expected);
  });

  it("ruční oprava má přednost před další automatickou klasifikací", () => {
    expect(effectiveProductType("DLC", "GAME")).toBe("GAME");
  });
});
