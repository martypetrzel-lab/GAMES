import type { MetadataRoute } from "next";

export function buildRobots(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/hledat",
        "/go/",
        "/api/",
        "/prihlaseni",
        "/registrace",
        "/muj-prehled",
        "/seznam-prani",
        "/nastaveni",
        "/upozorneni",
        "/cenova-upozorneni",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

export function gameSitemapEntry(
  baseUrl: string,
  game: { slug: string; updatedAt: Date },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${baseUrl}/hra/${game.slug}`,
    lastModified: game.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  };
}
