CREATE TABLE "Game" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "steamAppId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Store" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderGame" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "gameId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderGame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Offer" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "gameId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "regularPriceMinor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "savingsPercent" INTEGER NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceObservation" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "regularPriceMinor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderRun" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "query" TEXT,
    "status" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "ProviderRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExchangeRate" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "baseCurrency" CHAR(3) NOT NULL,
    "quoteCurrency" CHAR(3) NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "sourceAmount" INTEGER NOT NULL DEFAULT 1,
    "validFor" DATE NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
CREATE INDEX "Game_title_idx" ON "Game"("title");
CREATE INDEX "Game_steamAppId_idx" ON "Game"("steamAppId");
CREATE UNIQUE INDEX "Store_provider_externalId_key" ON "Store"("provider", "externalId");
CREATE INDEX "Store_name_idx" ON "Store"("name");
CREATE UNIQUE INDEX "ProviderGame_provider_externalId_key" ON "ProviderGame"("provider", "externalId");
CREATE UNIQUE INDEX "ProviderGame_provider_gameId_key" ON "ProviderGame"("provider", "gameId");
CREATE INDEX "ProviderGame_gameId_idx" ON "ProviderGame"("gameId");
CREATE UNIQUE INDEX "Offer_provider_externalId_key" ON "Offer"("provider", "externalId");
CREATE INDEX "Offer_gameId_priceMinor_idx" ON "Offer"("gameId", "priceMinor");
CREATE INDEX "Offer_storeId_idx" ON "Offer"("storeId");
CREATE INDEX "Offer_observedAt_idx" ON "Offer"("observedAt");
CREATE UNIQUE INDEX "PriceObservation_offerId_priceMinor_regularPriceMinor_currency_observedAt_key" ON "PriceObservation"("offerId", "priceMinor", "regularPriceMinor", "currency", "observedAt");
CREATE INDEX "PriceObservation_offerId_observedAt_idx" ON "PriceObservation"("offerId", "observedAt");
CREATE INDEX "ProviderRun_provider_startedAt_idx" ON "ProviderRun"("provider", "startedAt");
CREATE INDEX "ProviderRun_status_startedAt_idx" ON "ProviderRun"("status", "startedAt");
CREATE UNIQUE INDEX "ExchangeRate_provider_baseCurrency_quoteCurrency_validFor_key" ON "ExchangeRate"("provider", "baseCurrency", "quoteCurrency", "validFor");
CREATE INDEX "ExchangeRate_baseCurrency_quoteCurrency_validFor_idx" ON "ExchangeRate"("baseCurrency", "quoteCurrency", "validFor" DESC);
CREATE INDEX "ExchangeRate_fetchedAt_idx" ON "ExchangeRate"("fetchedAt");

ALTER TABLE "ProviderGame" ADD CONSTRAINT "ProviderGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
