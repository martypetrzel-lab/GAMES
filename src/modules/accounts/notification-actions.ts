"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function markNotificationRead(form: FormData) {
  const user = await requireUser("/upozorneni");
  const id = z.string().uuid().parse(form.get("notificationId"));
  await getPrisma().notification.updateMany({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/upozorneni");
}
export async function markAllNotificationsRead() {
  const user = await requireUser("/upozorneni");
  await getPrisma().notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/upozorneni");
}
