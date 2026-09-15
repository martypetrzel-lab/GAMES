import { z } from "zod";

const appSchema = z.object({
  appid: z.number().int().positive(),
  name: z.string().trim().min(1).max(500),
  last_modified: z.number().int().nonnegative().optional(),
  price_change_number: z.number().int().nonnegative().optional(),
});
const responseSchema = z.object({
  response: z.object({
    apps: z.array(appSchema).default([]),
    have_more_results: z.boolean().optional().default(false),
    last_appid: z.number().int().nonnegative().optional(),
  }),
});
export class SteamCatalogError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "SteamCatalogError";
  }
}
export type SteamCatalogPage = {
  apps: Array<{
    appId: number;
    name: string;
    appType: "game";
    lastModified: Date | null;
    priceChangeNumber: number | null;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
};
export class SteamCatalogProvider {
  readonly id = "steam";
  constructor(
    private apiKey: string,
    private fetcher: typeof fetch = fetch,
  ) {}
  async getApps(
    cursor: string | null,
    maxResults: number,
    signal?: AbortSignal,
  ): Promise<SteamCatalogPage> {
    const input = {
      include_games: true,
      include_dlc: false,
      include_software: false,
      include_videos: false,
      include_hardware: false,
      last_appid: Number(cursor) || 0,
      max_results: Math.min(1000, Math.max(1, maxResults)),
    };
    const url = new URL("https://api.steampowered.com/IStoreService/GetAppList/v1/");
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("input_json", JSON.stringify(input));
    const response = await this.fetcher(url, {
      headers: { Accept: "application/json", "User-Agent": "GameRadarCZ-Catalog/1.0" },
      signal,
    });
    if (response.status === 429) {
      const raw = response.headers.get("retry-after");
      const seconds = raw && /^\d+$/.test(raw) ? Number(raw) : undefined;
      throw new SteamCatalogError("Steam API omezilo požadavky.", 429, seconds);
    }
    if (!response.ok)
      throw new SteamCatalogError(`Steam API vrátilo HTTP ${response.status}.`, response.status);
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) throw new SteamCatalogError("Steam API vrátilo neočekávaný formát.");
    const data = parsed.data.response;
    return {
      apps: data.apps.map((a) => ({
        appId: a.appid,
        name: a.name,
        appType: "game",
        lastModified: a.last_modified ? new Date(a.last_modified * 1000) : null,
        priceChangeNumber: a.price_change_number ?? null,
      })),
      nextCursor: data.have_more_results && data.last_appid ? String(data.last_appid) : null,
      hasMore: data.have_more_results,
    };
  }
}
