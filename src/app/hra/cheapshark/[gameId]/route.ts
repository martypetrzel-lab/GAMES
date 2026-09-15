import { NextResponse } from "next/server";

import { legacyRedirectDecision } from "@/modules/catalog/legacy-routing";
import { getGameDetail } from "@/modules/prices/services/price-service";
import { getCanonicalSlugForProvider } from "@/modules/prices/services/public-catalog-service";

const externalIdPattern = /^\d{1,12}$/;

export async function GET(request: Request, context: RouteContext<"/hra/cheapshark/[gameId]">) {
  const { gameId } = await context.params;
  if (!externalIdPattern.test(gameId)) {
    return NextResponse.redirect(new URL("/hledat", request.url), 307);
  }

  let slug = await getCanonicalSlugForProvider("cheapshark", gameId);
  if (!slug) {
    try {
      await getGameDetail(gameId);
      slug = await getCanonicalSlugForProvider("cheapshark", gameId);
    } catch {
      // Přechodová URL nesmí návštěvníkovi odhalit technickou chybu poskytovatele.
    }
  }

  const decision = legacyRedirectDecision(slug, gameId);
  return NextResponse.redirect(new URL(decision.path, request.url), decision.status);
}
