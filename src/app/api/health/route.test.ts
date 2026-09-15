import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("vrací liveness bez databázových detailů", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok", service: "gameradar-cz" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
