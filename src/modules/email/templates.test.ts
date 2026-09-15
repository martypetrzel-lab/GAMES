import { describe, expect, it } from "vitest";
import { priceAlertEmail } from "./templates";
describe("e-mailové šablony", () => {
  it("escapují uživatelský obsah", () => {
    const email = priceAlertEmail({
      title: "<script>",
      message: "Cena & stav",
      manageUrl: "https://example.test/nastaveni",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
