export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "ok", service: "gameradar-cz", checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
