import { describe, expect, it } from "vitest";
import { buildRobots, gameSitemapEntry } from "./seo";

describe("SEO výstupy", () => {
  it("sitemap používá pouze interní URL", () => {
    expect(
      gameSitemapEntry("https://example.cz", { slug: "portal-2", updatedAt: new Date(0) }).url,
    ).toBe("https://example.cz/hra/portal-2");
  });
  it("robots blokuje hledání, redirecty a soukromé části", () => {
    const rules = buildRobots("https://example.cz").rules;
    expect(JSON.stringify(rules)).toContain("/hledat");
    expect(JSON.stringify(rules)).toContain("/go/");
    expect(JSON.stringify(rules)).toContain("/seznam-prani");
  });
});
