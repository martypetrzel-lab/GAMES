export type SellerType =
  "first_party_store" | "authorized_key_retailer" | "marketplace" | "unknown";
export type TrustStatus = "verified" | "pending" | "blocked";
export type StorePolicy = {
  slug: string;
  sellerType: SellerType;
  trustStatus: TrustStatus;
  isFirstParty: boolean;
  isAuthorized: boolean;
  supportedActivationPlatforms: string[];
  officialWebsite: string;
  displayPriority: number;
};
const verified: Record<string, StorePolicy> = {
  "1": {
    slug: "steam",
    sellerType: "first_party_store",
    trustStatus: "verified",
    isFirstParty: true,
    isAuthorized: true,
    supportedActivationPlatforms: ["steam"],
    officialWebsite: "https://store.steampowered.com",
    displayPriority: 1,
  },
  "25": {
    slug: "epic-games-store",
    sellerType: "first_party_store",
    trustStatus: "verified",
    isFirstParty: true,
    isAuthorized: true,
    supportedActivationPlatforms: ["epic"],
    officialWebsite: "https://store.epicgames.com",
    displayPriority: 2,
  },
  "7": {
    slug: "gog",
    sellerType: "first_party_store",
    trustStatus: "verified",
    isFirstParty: true,
    isAuthorized: true,
    supportedActivationPlatforms: ["gog"],
    officialWebsite: "https://www.gog.com",
    displayPriority: 3,
  },
  "3": {
    slug: "green-man-gaming",
    sellerType: "authorized_key_retailer",
    trustStatus: "verified",
    isFirstParty: false,
    isAuthorized: true,
    supportedActivationPlatforms: [],
    officialWebsite: "https://www.greenmangaming.com",
    displayPriority: 20,
  },
  "11": {
    slug: "humble-store",
    sellerType: "authorized_key_retailer",
    trustStatus: "verified",
    isFirstParty: false,
    isAuthorized: true,
    supportedActivationPlatforms: [],
    officialWebsite: "https://www.humblebundle.com/store",
    displayPriority: 21,
  },
  "15": {
    slug: "fanatical",
    sellerType: "authorized_key_retailer",
    trustStatus: "verified",
    isFirstParty: false,
    isAuthorized: true,
    supportedActivationPlatforms: [],
    officialWebsite: "https://www.fanatical.com",
    displayPriority: 22,
  },
  "27": {
    slug: "gamesplanet",
    sellerType: "authorized_key_retailer",
    trustStatus: "verified",
    isFirstParty: false,
    isAuthorized: true,
    supportedActivationPlatforms: [],
    officialWebsite: "https://gamesplanet.com",
    displayPriority: 23,
  },
};
const blocked = new Set(["g2a", "kinguin", "eneba", "cdkeys-marketplace"]);
export function getStorePolicy(provider: string, externalId: string): StorePolicy {
  if (provider !== "cheapshark")
    return {
      slug: `${provider}-${externalId}`,
      sellerType: "unknown",
      trustStatus: "pending",
      isFirstParty: false,
      isAuthorized: false,
      supportedActivationPlatforms: [],
      officialWebsite: "",
      displayPriority: 100,
    };
  return (
    verified[externalId] ?? {
      slug: `cheapshark-${externalId}`,
      sellerType: blocked.has(externalId) ? "marketplace" : "unknown",
      trustStatus: blocked.has(externalId) ? "blocked" : "pending",
      isFirstParty: false,
      isAuthorized: false,
      supportedActivationPlatforms: [],
      officialWebsite: "",
      displayPriority: 100,
    }
  );
}
export function isPublicStore(provider: string, externalId: string) {
  const p = getStorePolicy(provider, externalId);
  return p.trustStatus === "verified" && (p.isFirstParty || p.isAuthorized);
}
export function classifyPurchase(provider: string, externalId: string) {
  const p = getStorePolicy(provider, externalId);
  if (p.isFirstParty)
    return {
      purchaseType: "direct",
      activationPlatform: p.supportedActivationPlatforms[0] ?? "unknown",
    };
  return { purchaseType: "activation_key", activationPlatform: "unknown" };
}
export const trustedStoreIds = Object.keys(verified);
