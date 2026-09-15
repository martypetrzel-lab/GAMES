import { getServerEnv } from "@/config/env";
import { getPrisma } from "@/lib/db/prisma";
import { logServerError } from "@/lib/observability/server-log";
import { checkReadiness } from "./readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const ready = await checkReadiness(
    () => getPrisma().$queryRaw`SELECT 1`,
    getServerEnv().READINESS_TIMEOUT_MS,
  );
  if (!ready) {
    logServerError("database", new Error("Readiness database check failed."), {
      operation: "readiness",
    });
  }
  return Response.json(
    { status: ready ? "ready" : "unavailable", service: "gameradar-cz", checkedAt },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
