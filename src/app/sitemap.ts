import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteConfig } from "@/config/site";
import { getPrisma } from "@/lib/db/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const games = await getPrisma().providerGame.findMany({
    where: { provider: "cheapshark" },
    select: { externalId: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5_000,
  });
  return [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    ...games.map((game) => ({
      url: `${siteConfig.url}/hra/cheapshark/${game.externalId}`,
      lastModified: game.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
