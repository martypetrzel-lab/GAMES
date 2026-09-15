import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/prices/services/history-service", () => ({ getGameHistory: vi.fn() }));
import { GET } from "./route";

describe("history API", () => {
  it("odmítá neplatné ID a rozsah", async () => {
    const response = await GET(new Request("http://test/api/history/nope?range=forever"), {
      params: Promise.resolve({ gameId: "nope" }),
    });
    expect(response.status).toBe(400);
  });
});
