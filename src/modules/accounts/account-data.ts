import "server-only";

import { getPrisma } from "@/lib/db/prisma";

export async function getWishlist(userId: string) {
  return getPrisma().wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      game: {
        include: {
          offers: { orderBy: { priceMinor: "asc" }, take: 1 },
          providerGames: { where: { provider: "cheapshark" }, take: 1 },
        },
      },
      alerts: { where: { enabled: true }, take: 1 },
    },
  });
}

export async function getDashboard(userId: string) {
  const [wishlist, unread] = await Promise.all([
    getWishlist(userId),
    getPrisma().notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  return {
    wishlist,
    unread,
    activeAlerts: wishlist.filter((item) => item.alerts.length > 0).length,
  };
}
