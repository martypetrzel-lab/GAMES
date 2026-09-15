const CHEAPSHARK_ORIGIN = "https://www.cheapshark.com";
const APPROVED_IMAGE_HOSTS = new Set([
  "cdn.humblebundle.com",
  "cdn1.epicgames.com",
  "images.gog-statics.com",
  "shared.fastly.steamstatic.com",
  "steamcdn-a.akamaihd.net",
  "sttc.gamersgate.com",
]);

export function approvedProviderImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && APPROVED_IMAGE_HOSTS.has(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function createCheapSharkRedirectUrl(rawDealId: string): string {
  const url = new URL("/redirect", CHEAPSHARK_ORIGIN);
  url.searchParams.set("dealID", rawDealId);
  return url.toString();
}

export function isApprovedOfferTarget(value: string, provider: string): boolean {
  if (provider !== "cheapshark") return false;

  try {
    const url = new URL(value);
    return (
      url.origin === CHEAPSHARK_ORIGIN &&
      url.pathname === "/redirect" &&
      url.searchParams.has("dealID") &&
      [...url.searchParams.keys()].every((key) => key === "dealID")
    );
  } catch {
    return false;
  }
}
