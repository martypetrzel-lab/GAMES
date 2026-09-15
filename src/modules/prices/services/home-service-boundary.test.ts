import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("datová hranice homepage", () => {
  it("homepage čte pouze databázi a neimportuje externí cenové providery", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./home-service.ts", import.meta.url)),
      "utf8",
    );
    expect(source).toContain("getPrisma");
    expect(source).not.toMatch(/provider-registry|CheapShark|getUsdCzkRate/);
  });
});
