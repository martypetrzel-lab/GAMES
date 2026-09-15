"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser, safeReturnTo } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

const externalId = z.string().regex(/^\d{1,12}$/);
const uuid = z.string().uuid();

export async function addToWishlist(form: FormData) {
  const returnTo = safeReturnTo(String(form.get("returnTo") ?? "/seznam-prani"));
  const user = await requireUser(returnTo);
  const providerGame = await getPrisma().providerGame.findUnique({
    where: {
      provider_externalId: {
        provider: "cheapshark",
        externalId: externalId.parse(form.get("externalGameId")),
      },
    },
    include: { game: { include: { offers: { orderBy: { priceMinor: "asc" }, take: 1 } } } },
  });
  if (!providerGame) return;
  const best = providerGame.game.offers[0];
  await getPrisma().wishlistItem.upsert({
    where: { userId_gameId: { userId: user.id, gameId: providerGame.gameId } },
    create: {
      userId: user.id,
      gameId: providerGame.gameId,
      priceAtAddMinor: best?.priceMinor,
      priceCurrency: best?.currency,
    },
    update: {},
  });
  revalidatePath(returnTo);
  revalidatePath("/seznam-prani");
}

export async function removeFromWishlist(form: FormData) {
  const user = await requireUser("/seznam-prani");
  const id = uuid.parse(form.get("wishlistId"));
  await getPrisma().wishlistItem.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/seznam-prani");
}

export async function updateWishlist(form: FormData) {
  const user = await requireUser("/seznam-prani");
  const id = uuid.parse(form.get("wishlistId"));
  const note = z.string().trim().max(500).parse(form.get("note"));
  const targetText = String(form.get("targetPrice") ?? "").replace(",", ".");
  const targetMinor = targetText
    ? Math.round(z.coerce.number().positive().max(1_000_000).parse(targetText) * 100)
    : null;
  const enabled = form.get("enabled") === "on";
  await getPrisma().$transaction(async (tx) => {
    const item = await tx.wishlistItem.findFirst({ where: { id, userId: user.id } });
    if (!item) return;
    await tx.wishlistItem.update({ where: { id }, data: { note: note || null } });
    const existing = await tx.priceAlert.findFirst({
      where: { wishlistItemId: id, currency: "CZK" },
    });
    if (targetMinor || existing) {
      if (existing)
        await tx.priceAlert.update({
          where: { id: existing.id },
          data: { targetPriceMinor: targetMinor, enabled },
        });
      else
        await tx.priceAlert.create({
          data: {
            wishlistItemId: id,
            targetPriceMinor: targetMinor,
            currency: "CZK",
            onHistoricalLow: true,
            enabled,
          },
        });
    }
  });
  revalidatePath("/seznam-prani");
  revalidatePath("/cenova-upozorneni");
}
