CREATE TYPE "ProductType" AS ENUM ('GAME', 'DLC', 'DEMO', 'SOUNDTRACK', 'SOFTWARE', 'UNKNOWN');

ALTER TABLE "Game"
  ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "productTypeOverride" "ProductType",
  ADD COLUMN "productTypeSource" TEXT;

CREATE TABLE "GameSlugAlias" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "gameId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameSlugAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameSlugAlias_slug_key" ON "GameSlugAlias"("slug");
CREATE INDEX "GameSlugAlias_gameId_idx" ON "GameSlugAlias"("gameId");
CREATE INDEX "Game_catalogActive_productType_updatedAt_idx" ON "Game"("catalogActive", "productType", "updatedAt" DESC);
CREATE INDEX "Offer_gameId_observedAt_idx" ON "Offer"("gameId", "observedAt" DESC);

ALTER TABLE "GameSlugAlias" ADD CONSTRAINT "GameSlugAlias_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Původní publikované slugy uchováme jako aliasy před přechodem na čitelné adresy.
INSERT INTO "GameSlugAlias" ("slug", "gameId")
SELECT "slug", "id" FROM "Game" ON CONFLICT ("slug") DO NOTHING;

-- Nejprve uvolníme původní unikátní hodnoty, potom nastavíme čitelný stabilní slug.
UPDATE "Game" SET "slug" = 'migrating-' || replace("id"::text, '-', '');
WITH candidates AS (
  SELECT
    "id",
    COALESCE(NULLIF(trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')), ''), 'hra') AS base_slug,
    row_number() OVER (
      PARTITION BY COALESCE(NULLIF(trim(both '-' from regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')), ''), 'hra')
      ORDER BY "id"
    ) AS collision_rank
  FROM "Game"
)
UPDATE "Game" AS game
SET "slug" = CASE
  WHEN candidates.collision_rank = 1 THEN left(candidates.base_slug, 72)
  ELSE left(candidates.base_slug, 63) || '-' || left(replace(game."id"::text, '-', ''), 8)
END
FROM candidates
WHERE game."id" = candidates."id";

UPDATE "Game"
SET "productType" = CASE
  WHEN lower("title") ~ '(^|[[:space:]:_-])(soundtrack|ost)([[:space:]:_-]|$)' THEN 'SOUNDTRACK'::"ProductType"
  WHEN lower("title") ~ '(^|[[:space:]:_-])(demo)([[:space:]:_-]|$)' THEN 'DEMO'::"ProductType"
  WHEN lower("title") ~ '(^|[[:space:]:_-])(dlc|expansion|season pass)([[:space:]:_-]|$)' THEN 'DLC'::"ProductType"
  ELSE 'GAME'::"ProductType"
END,
"productTypeSource" = 'migration-title-conservative'
WHERE "productTypeOverride" IS NULL;
