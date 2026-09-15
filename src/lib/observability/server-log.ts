import "server-only";

import { sanitizeLogMessage } from "@/lib/observability/sanitize-log";

type Area =
  | "environment"
  | "database"
  | "cheapshark"
  | "cnb"
  | "external-validation"
  | "persistence"
  | "search"
  | "cron"
  | "catalog";
type SafeContext = Readonly<{
  operation?: string;
  provider?: string;
  code?: string;
  status?: number;
  gameId?: string;
  itemCount?: number;
}>;

export function logServerError(area: Area, error: unknown, context: SafeContext = {}) {
  const source = error instanceof Error ? error : undefined;
  const errorCode =
    typeof (error as { code?: unknown } | null)?.code === "string"
      ? (error as { code: string }).code
      : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      event: "server-operation-failed",
      area,
      ...context,
      errorName: source?.name ?? "UnknownError",
      errorCode,
      message: source ? sanitizeLogMessage(source.message) : "Neznámá chyba",
      timestamp: new Date().toISOString(),
    }),
  );
}
