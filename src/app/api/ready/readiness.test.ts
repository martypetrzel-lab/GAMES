import { describe, expect, it, vi } from "vitest";
import { checkReadiness } from "./readiness";

describe("GET /api/ready", () => {
  it("potvrdí dostupnou databázi", async () => {
    expect(await checkReadiness(async () => 1, 50)).toBe(true);
  });

  it("bezpečně odmítne nedostupnou databázi", async () => {
    expect(
      await checkReadiness(
        vi.fn(async () => Promise.reject(new Error("secret"))),
        50,
      ),
    ).toBe(false);
  });
});
