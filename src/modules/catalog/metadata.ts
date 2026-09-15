import type { Metadata } from "next";
import { canonicalGamePath } from "./legacy-routing";

export function buildGameMetadata(game: {
  title: string;
  slug: string;
  imageUrl: string | null;
}): Metadata {
  const path = canonicalGamePath(game.slug);
  const description = `Porovnání uložených cen PC hry ${game.title} v ověřených obchodech, poslední aktualizace a vlastní cenová historie.`;
  return {
    title: game.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${game.title} – ceny PC hry`,
      description,
      type: "website",
      url: path,
      images: game.imageUrl ? [{ url: game.imageUrl, alt: game.title }] : undefined,
    },
    twitter: { card: game.imageUrl ? "summary_large_image" : "summary" },
  };
}
