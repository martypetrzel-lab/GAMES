const CHEAPSHARK_ORIGIN = "https://www.cheapshark.com";

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
