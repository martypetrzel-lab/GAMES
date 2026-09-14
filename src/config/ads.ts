export const adPlacements = ["home-hero", "search-inline", "game-sidebar"] as const;

export type AdPlacement = (typeof adPlacements)[number];

export const adConfig = {
  enabled: false,
} as const;
