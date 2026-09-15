import { describe, expect, it } from "vitest";
import { PUBLIC_CACHE_TAGS, preferStoredData } from "./public-cache-policy";

describe("oddělení veřejné cache", () => {
  it("veřejné tagy neobsahují uživatelskou ani session cache", () => {
    expect(
      Object.values(PUBLIC_CACHE_TAGS).every((tag) => !/user|session|wishlist/i.test(tag)),
    ).toBe(true);
  });
  it("při dostupných uložených datech nespustí externí načtení", async () => {
    let called = false;
    const result = await preferStoredData(["uloženo"], async () => {
      called = true;
      return ["externí"];
    });
    expect(result).toEqual(["uloženo"]);
    expect(called).toBe(false);
  });
});
