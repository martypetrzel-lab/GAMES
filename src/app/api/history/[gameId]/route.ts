import { NextResponse } from "next/server";
import { z } from "zod";

import { historyRanges } from "@/modules/prices/domain/history";
import { getGameHistory } from "@/modules/prices/services/history-service";

const paramsSchema = z.object({ gameId: z.string().regex(/^\d{1,12}$/) });
const querySchema = z.object({ range: z.enum(historyRanges).default("3m") });

export async function GET(request: Request, { params }: RouteContext<"/api/history/[gameId]">) {
  const parsedParams = paramsSchema.safeParse(await params);
  const parsedQuery = querySchema.safeParse({
    range: new URL(request.url).searchParams.get("range") ?? undefined,
  });
  if (!parsedParams.success || !parsedQuery.success) {
    return NextResponse.json({ status: "error", message: "Neplatné parametry." }, { status: 400 });
  }
  const points = await getGameHistory(parsedParams.data.gameId, parsedQuery.data.range);
  if (!points)
    return NextResponse.json({ status: "error", message: "Hra nebyla nalezena." }, { status: 404 });
  return NextResponse.json(
    {
      status: "ok",
      range: parsedQuery.data.range,
      points: points.map((point) => ({ ...point, observedAt: point.observedAt.toISOString() })),
    },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
