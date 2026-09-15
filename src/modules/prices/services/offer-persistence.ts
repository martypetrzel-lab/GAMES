import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import { isApprovedOfferTarget } from "@/lib/urls/safe-url";
import type { ProviderOffer, ProviderStore } from "@/modules/prices/domain/types";
import { hasRelevantPriceChange } from "@/modules/prices/domain/price-change";
import { classifyPurchase, getStorePolicy } from "@/modules/stores/trusted-stores";
import { classifyProduct } from "@/modules/catalog/product-classification";
import { stableGameSlug } from "@/modules/catalog/slug";
import { revalidateTag } from "next/cache";

export async function persistOffers(
  offers: ProviderOffer[],
  stores: ProviderStore[],
): Promise<Map<string, string>> {
  const db = getPrisma();
  const storeMap = new Map(stores.map((store) => [store.externalId, store]));
  const persistedIds = new Map<string, string>();

  await db.$transaction(async (tx) => {
    const externalGameIds = [...new Set(offers.map((offer) => offer.externalGameId))];
    const externalOfferIds = [...new Set(offers.map((offer) => offer.externalOfferId))];
    const existingGames = await tx.providerGame.findMany({
      where: { provider: "cheapshark", externalId: { in: externalGameIds } },
      select: { externalId: true, gameId: true, game: { select: { productTypeOverride: true } } },
    });
    const gamesByExternalId = new Map(existingGames.map((item) => [item.externalId, item]));
    const existingOffers = await tx.offer.findMany({
      where: { provider: "cheapshark", externalId: { in: externalOfferIds } },
      select: {
        externalId: true,
        observations: { orderBy: { observedAt: "desc" }, take: 1 },
      },
    });
    const observationsByOffer = new Map(
      existingOffers.map((item) => [item.externalId, item.observations[0] ?? null]),
    );
    const storesByExternalId = new Map<string, { id: string }>();
    const updatedGames = new Set<string>();

    for (const offer of offers) {
      if (!isApprovedOfferTarget(offer.targetUrl, offer.provider)) {
        throw new Error("Poskytovatel vrátil nepovolený cílový odkaz.");
      }

      const storeSource = storeMap.get(offer.externalStoreId);
      if (!storeSource) continue;
      const policy = getStorePolicy(offer.provider, offer.externalStoreId);
      if (policy.trustStatus !== "verified") continue;
      const purchase = classifyPurchase(offer.provider, offer.externalStoreId);

      const providerGame = gamesByExternalId.get(offer.externalGameId);

      let gameId = providerGame?.gameId;
      if (gameId && !updatedGames.has(gameId)) {
        await tx.game.update({
          where: { id: gameId },
          data: {
            title: offer.title,
            steamAppId: offer.steamAppId,
            imageUrl: offer.imageUrl,
            ...(providerGame?.game.productTypeOverride
              ? {}
              : {
                  productType: classifyProduct(offer.title),
                  productTypeSource: "title-conservative",
                }),
          },
        });
        updatedGames.add(gameId);
      } else {
        if (!gameId) {
          const baseSlug = stableGameSlug(offer.title);
          const collision = await tx.game.findUnique({
            where: { slug: baseSlug },
            select: { id: true },
          });
          const game = await tx.game.create({
            data: {
              slug: collision
                ? stableGameSlug(offer.title, `${offer.provider}:${offer.externalGameId}`)
                : baseSlug,
              title: offer.title,
              steamAppId: offer.steamAppId,
              imageUrl: offer.imageUrl,
              productType: classifyProduct(offer.title),
              productTypeSource: "title-conservative",
            },
          });
          gameId = game.id;
          await tx.providerGame.create({
            data: { provider: offer.provider, externalId: offer.externalGameId, gameId },
          });
          gamesByExternalId.set(offer.externalGameId, {
            externalId: offer.externalGameId,
            gameId,
            game: { productTypeOverride: null },
          });
          updatedGames.add(gameId);
        }
      }

      let store = storesByExternalId.get(offer.externalStoreId);
      if (!store)
        store = await tx.store.upsert({
          where: {
            provider_externalId: { provider: offer.provider, externalId: storeSource.externalId },
          },
          create: {
            provider: offer.provider,
            externalId: storeSource.externalId,
            name: storeSource.name,
            isActive: storeSource.active,
            imageUrl: storeSource.imageUrl,
            slug: policy.slug,
            sellerType: policy.sellerType,
            trustStatus: policy.trustStatus,
            isFirstParty: policy.isFirstParty,
            isAuthorized: policy.isAuthorized,
            supportedActivationPlatforms: policy.supportedActivationPlatforms,
            officialWebsite: policy.officialWebsite,
            verificationSource: "cheapshark-store-id-allowlist",
            verifiedAt: new Date(),
            disabledAt: storeSource.active ? null : new Date(),
            displayPriority: policy.displayPriority,
          },
          update: {
            name: storeSource.name,
            isActive: storeSource.active,
            imageUrl: storeSource.imageUrl,
            sellerType: policy.sellerType,
            trustStatus: policy.trustStatus,
            isFirstParty: policy.isFirstParty,
            isAuthorized: policy.isAuthorized,
            supportedActivationPlatforms: policy.supportedActivationPlatforms,
            officialWebsite: policy.officialWebsite,
            verificationSource: "cheapshark-store-id-allowlist",
            verifiedAt: new Date(),
            disabledAt: storeSource.active ? null : new Date(),
            displayPriority: policy.displayPriority,
          },
        });
      storesByExternalId.set(offer.externalStoreId, store);

      const persisted = await tx.offer.upsert({
        where: {
          provider_externalId: { provider: offer.provider, externalId: offer.externalOfferId },
        },
        create: {
          provider: offer.provider,
          externalId: offer.externalOfferId,
          gameId,
          storeId: store.id,
          priceMinor: offer.price.minor,
          regularPriceMinor: offer.regularPrice.minor,
          currency: offer.price.currency,
          savingsPercent: offer.savingsPercent,
          targetUrl: offer.targetUrl,
          observedAt: offer.observedAt,
          ...purchase,
        },
        update: {
          gameId,
          storeId: store.id,
          priceMinor: offer.price.minor,
          regularPriceMinor: offer.regularPrice.minor,
          currency: offer.price.currency,
          savingsPercent: offer.savingsPercent,
          targetUrl: offer.targetUrl,
          observedAt: offer.observedAt,
          ...purchase,
        },
      });

      const latest = observationsByOffer.get(offer.externalOfferId) ?? null;
      if (
        hasRelevantPriceChange(latest, {
          priceMinor: offer.price.minor,
          regularPriceMinor: offer.regularPrice.minor,
          currency: offer.price.currency,
        })
      ) {
        await tx.priceObservation.create({
          data: {
            offerId: persisted.id,
            priceMinor: offer.price.minor,
            regularPriceMinor: offer.regularPrice.minor,
            currency: offer.price.currency,
            observedAt: offer.observedAt,
          },
        });
        observationsByOffer.set(offer.externalOfferId, {
          id: "pending",
          offerId: persisted.id,
          priceMinor: offer.price.minor,
          regularPriceMinor: offer.regularPrice.minor,
          currency: offer.price.currency,
          observedAt: offer.observedAt,
        });
      }

      persistedIds.set(offer.externalOfferId, persisted.id);
    }
  });

  try {
    revalidateTag("public-offers", "max");
    revalidateTag("public-catalog", "max");
    revalidateTag("home-highlights", "max");
    revalidateTag("free-games", "max");
  } catch {
    // Samostatný worker nemá Next request kontext; webová cache má proto i konečnou TTL.
  }

  return persistedIds;
}
