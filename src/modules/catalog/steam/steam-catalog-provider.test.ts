import { describe, expect, it, vi } from "vitest";
import { SteamCatalogError, SteamCatalogProvider } from "./steam-catalog-provider";
describe("SteamCatalogProvider", () => {
  it("mapuje jen oficiálně vyžádané hry a cursor", async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response(
        JSON.stringify({
          response: {
            apps: [{ appid: 10, name: "Test", last_modified: 100, price_change_number: 2 }],
            have_more_results: true,
            last_appid: 10,
          },
        }),
        { status: 200 },
      );
    });
    const fetcher = fetchSpy as unknown as typeof fetch;
    const page = await new SteamCatalogProvider("secret", fetcher).getApps(null, 60);
    expect(page.apps[0]).toMatchObject({ appId: 10, name: "Test", appType: "game" });
    expect(page.nextCursor).toBe("10");
    const called = new URL(String(fetchSpy.mock.calls[0][0]));
    const calledInit = fetchSpy.mock.calls[0][1];
    const input = JSON.parse(called.searchParams.get("input_json")!);
    expect(called.searchParams.has("key")).toBe(false);
    expect(new Headers(calledInit?.headers).get("x-webapi-key")).toBe("secret");
    expect(input).toMatchObject({
      include_games: true,
      include_dlc: false,
      include_software: false,
      include_videos: false,
      include_hardware: false,
    });
  });
  it("zastaví se na 429 a čte Retry-After", async () => {
    const fetcher = vi.fn(
      async () => new Response("", { status: 429, headers: { "Retry-After": "120" } }),
    ) as unknown as typeof fetch;
    await expect(
      new SteamCatalogProvider("secret", fetcher).getApps(null, 60),
    ).rejects.toMatchObject<Partial<SteamCatalogError>>({ status: 429, retryAfterSeconds: 120 });
  });
});
