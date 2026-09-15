import { getCurrentSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return Response.json({ count: 0 }, { status: 401 });
  const count = await getPrisma().notification.count({
    where: { userId: session.user.id, readAt: null },
  });
  return Response.json(
    { count: Math.min(count, 99) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
