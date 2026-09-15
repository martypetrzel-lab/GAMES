import { describe, expect, it } from "vitest";
import { legacyCheapSharkRedirect, legacyRedirectDecision } from "./legacy-routing";

describe("stará CheapShark URL", () => {
  it("vede permanentně na interní kanonickou cestu, pokud mapování existuje", () => {
    expect(legacyCheapSharkRedirect("cyberpunk-2077")).toBe("/hra/cyberpunk-2077");
    expect(legacyRedirectDecision("cyberpunk-2077", "123")).toEqual({
      path: "/hra/cyberpunk-2077",
      status: 308,
    });
  });
  it("bez mapování ponechá bezpečný fallback", () => {
    expect(legacyCheapSharkRedirect(null)).toBeNull();
  });
});
