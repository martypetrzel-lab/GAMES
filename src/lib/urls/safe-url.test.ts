import { describe, expect, it } from "vitest";

import {
  approvedProviderImageUrl,
  createCheapSharkRedirectUrl,
  isApprovedOfferTarget,
} from "./safe-url";

describe("safe offer URLs", () => {
  it("vytvoří povolený CheapShark redirect", () => {
    const url = createCheapSharkRedirectUrl("abc+/=");
    expect(isApprovedOfferTarget(url, "cheapshark")).toBe(true);
    expect(new URL(url).searchParams.get("dealID")).toBe("abc+/=");
  });

  it("odmítne cizí poskytovatele, domény a další parametry", () => {
    expect(isApprovedOfferTarget("https://evil.example/redirect?dealID=abc", "cheapshark")).toBe(
      false,
    );
    expect(
      isApprovedOfferTarget(
        "https://www.cheapshark.com/redirect?dealID=abc&next=https://evil.example",
        "cheapshark",
      ),
    ).toBe(false);
    expect(isApprovedOfferTarget("https://www.cheapshark.com/redirect?dealID=abc", "other")).toBe(
      false,
    );
  });

  it("povolí obrázky jen z výslovně známých CDN", () => {
    expect(approvedProviderImageUrl("https://shared.fastly.steamstatic.com/a.jpg")).toContain(
      "steamstatic",
    );
    expect(approvedProviderImageUrl("https://evil.example/a.jpg")).toBeNull();
  });
});
