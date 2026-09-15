import { getPrisma } from "@/lib/db/prisma";
import { logServerError } from "@/lib/observability/server-log";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", service: "gameradar-cz", database: "ok", checkedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logServerError("database", error, { operation: "healthcheck" });
    return Response.json(
      { status: "degraded", service: "gameradar-cz", database: "unavailable", checkedAt },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
