import { describe, expect, it } from "vitest";
import { legacyCheapSharkRedirect } from "./legacy-routing";

describe("stará CheapShark URL", () => {
  it("vede permanentně na interní kanonickou cestu, pokud mapování existuje", () => {
    expect(legacyCheapSharkRedirect("cyberpunk-2077")).toBe("/hra/cyberpunk-2077");
  });
  it("bez mapování ponechá bezpečný fallback", () => {
    expect(legacyCheapSharkRedirect(null)).toBeNull();
  });
});
