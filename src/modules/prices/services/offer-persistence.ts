import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import { isApprovedOfferTarget } from "@/lib/urls/safe-url";
import type { ProviderOffer, ProviderStore } from "@/modules/prices/domain/types";
import { hasRelevantPriceChange } from "@/modules/prices/domain/price-change";
import { classifyPurchase, getStorePolicy } from "@/modules/stores/trusted-stores";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function persistOffers(
  offers: ProviderOffer[],
  stores: ProviderStore[],
): Promise<Map<string, string>> {
  const db = getPrisma();
  const storeMap = new Map(stores.map((store) => [store.externalId, store]));
  const persistedIds = new Map<string, string>();

  await db.$transaction(async (tx) => {
    for (const offer of offers) {
      if (!isApprovedOfferTarget(offer.targetUrl, offer.provider)) {
        throw new Error("Poskytovatel vrátil nepovolený cílový odkaz.");
      }

      const storeSource = storeMap.get(offer.externalStoreId);
      if (!storeSource) continue;
      const policy = getStorePolicy(offer.provider, offer.externalStoreId);
      if (policy.trustStatus !== "verified") continue;
      const purchase = classifyPurchase(offer.provider, offer.externalStoreId);

      const providerGame = await tx.providerGame.findUnique({
        where: {
          provider_externalId: {
            provider: offer.provider,
            externalId: offer.externalGameId,
          },
        },
        select: { gameId: true },
      });

      let gameId = providerGame?.gameId;
      if (gameId) {
        await tx.game.update({
          where: { id: gameId },
          data: {
            title: offer.title,
            steamAppId: offer.steamAppId,
            imageUrl: offer.imageUrl,
          },
        });
      } else {
        const game = await tx.game.create({
          data: {
            slug: `${slugify(offer.title) || "hra"}-${offer.provider}-${offer.externalGameId}`,
            title: offer.title,
            steamAppId: offer.steamAppId,
            imageUrl: offer.imageUrl,
          },
        });
        gameId = game.id;
        await tx.providerGame.create({
          data: { provider: offer.provider, externalId: offer.externalGameId, gameId },
        });
      }

      const store = await tx.store.upsert({
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

      const latest = await tx.priceObservation.findFirst({
        where: { offerId: persisted.id },
        orderBy: { observedAt: "desc" },
      });
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
      }

      persistedIds.set(offer.externalOfferId, persisted.id);
    }
  });

  return persistedIds;
}
