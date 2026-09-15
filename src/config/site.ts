import { z } from "zod";

const fallbackUrl = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "http://localhost:3000";

export const siteConfig = {
  name: "GameRadar CZ",
  description: "Český srovnávač cen digitálních PC her.",
  repositoryUrl: "https://github.com/martypetrzel-lab/GAMES",
  url: z
    .string()
    .url()
    .parse(process.env.APP_BASE_URL || fallbackUrl)
    .replace(/\/$/, ""),
} as const;
