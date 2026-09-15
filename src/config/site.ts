export const siteConfig = {
  name: "GameRadar CZ",
  description: "Český srovnávač cen digitálních PC her.",
  repositoryUrl: "https://github.com/martypetrzel-lab/GAMES",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://games-production-5e88.up.railway.app",
} as const;
