import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { buildRobots } from "@/modules/catalog/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(siteConfig.url);
}
