import { hashPassword, verifyPassword } from "better-auth/crypto";
import { describe, expect, it } from "vitest";

import { safeReturnTo } from "./redirects";

describe("bezpečnost účtu", () => {
  it("heslo ukládá pouze jako ověřitelný scrypt hash", async () => {
    const password = "Dlouhe-unikatni-heslo-2026";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    await expect(verifyPassword({ password, hash })).resolves.toBe(true);
    await expect(verifyPassword({ password: "spatne-heslo", hash })).resolves.toBe(false);
  });
  it("nepovolí open redirect", () => {
    expect(safeReturnTo("/seznam-prani")).toBe("/seznam-prani");
    expect(safeReturnTo("//evil.example")).toBe("/muj-prehled");
    expect(safeReturnTo("https://evil.example")).toBe("/muj-prehled");
  });
});
