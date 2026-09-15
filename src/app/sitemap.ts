import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPrisma } from "@/lib/db/prisma";
import { gameSitemapEntry } from "@/modules/catalog/seo";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getSitemapGames = unstable_cache(
  () =>
    getPrisma().game.findMany({
      where: {
        catalogActive: true,
        offers: { some: { store: { isActive: true, trustStatus: "verified" } } },
        OR: [{ productTypeOverride: "GAME" }, { productTypeOverride: null, productType: "GAME" }],
      },
      select: { slug: true, updatedAt: true },
      orderBy: { id: "asc" },
      take: 50_000,
    }),
  ["sitemap-games-v2"],
  { revalidate: 3600, tags: ["public-catalog", "public-offers"] },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await getSitemapGames();
  return [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    ...games.map((game) => gameSitemapEntry(siteConfig.url, game)),
  ];
}
