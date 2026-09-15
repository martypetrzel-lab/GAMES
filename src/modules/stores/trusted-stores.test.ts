import { describe, expect, it } from "vitest";
import { classifyPurchase, getStorePolicy, isPublicStore } from "./trusted-stores";
describe("centrální allowlist obchodů", () => {
  it("rozlišuje přímý Steam", () => {
    expect(getStorePolicy("cheapshark", "1").sellerType).toBe("first_party_store");
    expect(classifyPurchase("cheapshark", "1")).toEqual({
      purchaseType: "direct",
      activationPlatform: "steam",
    });
  });
  it("nepředstírá Steam aktivaci u autorizovaného prodejce", () =>
    expect(classifyPurchase("cheapshark", "15")).toEqual({
      purchaseType: "activation_key",
      activationPlatform: "unknown",
    }));
  it("skryje neověřený i blokovaný obchod", () => {
    expect(isPublicStore("cheapshark", "28")).toBe(false);
    expect(isPublicStore("other", "1")).toBe(false);
  });
});
