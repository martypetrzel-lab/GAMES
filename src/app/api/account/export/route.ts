import { getCurrentSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return Response.json({ error: "Přihlášení je vyžadováno." }, { status: 401 });
  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      marketingEmails: true,
      createdAt: true,
      updatedAt: true,
      wishlistItems: {
        select: {
          note: true,
          createdAt: true,
          game: { select: { title: true, slug: true } },
          alerts: {
            select: {
              targetPriceMinor: true,
              currency: true,
              onHistoricalLow: true,
              enabled: true,
              createdAt: true,
            },
          },
        },
      },
      notifications: {
        select: { type: true, title: true, message: true, readAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      },
      consents: { select: { kind: true, version: true, granted: true, createdAt: true } },
    },
  });
  return Response.json(
    { exportedAt: new Date().toISOString(), user },
    {
      headers: {
        "Content-Disposition": `attachment; filename="gameradar-data.json"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
