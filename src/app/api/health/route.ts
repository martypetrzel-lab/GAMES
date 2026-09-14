export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", service: "gameradar-cz", timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
