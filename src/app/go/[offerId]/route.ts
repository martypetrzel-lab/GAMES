import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrisma } from "@/lib/db/prisma";
import { isApprovedOfferTarget } from "@/lib/urls/safe-url";

const offerIdSchema = z.uuid();

export async function GET(_request: Request, { params }: RouteContext<"/go/[offerId]">) {
  const parsedId = offerIdSchema.safeParse((await params).offerId);
  if (!parsedId.success) return new Response("Neplatný odkaz.", { status: 400 });

  const offer = await getPrisma().offer.findUnique({
    where: { id: parsedId.data },
    select: { provider: true, targetUrl: true },
  });
  if (!offer || !isApprovedOfferTarget(offer.targetUrl, offer.provider)) {
    return new Response("Nabídka nebyla nalezena.", { status: 404 });
  }

  const response = NextResponse.redirect(offer.targetUrl, 302);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
