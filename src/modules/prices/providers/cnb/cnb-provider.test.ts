import { describe, expect, it, vi } from "vitest";

import { CnbExchangeRateProvider } from "./cnb-provider";

describe("CnbExchangeRateProvider", () => {
  it("vybere USD a respektuje množství z kurzovního lístku", async () => {
    const provider = new CnbExchangeRateProvider({
      now: () => new Date("2026-09-14T12:00:00Z"),
      fetchImpl: vi.fn(async () =>
        Response.json({
          rates: [
            { validFor: "2026-09-11", amount: 100, currencyCode: "HUF", rate: 6.661 },
            { validFor: "2026-09-11", amount: 1, currencyCode: "USD", rate: 20.927 },
          ],
        }),
      ),
    });

    await expect(provider.getUsdCzkRate()).resolves.toMatchObject({
      provider: "cnb",
      rate: "20.927",
      sourceAmount: 1,
    });
  });
});
