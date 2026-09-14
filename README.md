# GameRadar CZ

Český srovnávač cen digitálních PC her. Fáze 1 načítá nabídky serverově z CheapSharku, ukládá aktuální ceny a jejich změny do PostgreSQL a zobrazuje orientační přepočet do CZK podle kurzovního lístku České národní banky.

## Použité technologie

- Next.js 16 s App Routerem, React 19 a TypeScriptem
- Tailwind CSS 4 a vlastní responzivní vizuální vrstva
- PostgreSQL, Prisma ORM 7 a ovladač `pg`
- Vitest, ESLint a Prettier
- CheapShark jako první implementace `PriceProvider`
- API ČNB jako první implementace `ExchangeRateProvider`

## Požadavky

- Node.js 24
- pnpm 11.19 nebo kompatibilní
- dostupná PostgreSQL databáze

## Lokální spuštění

1. Naklonujte repozitář a přejděte do jeho složky.
2. Zkopírujte `.env.example` jako `.env` a upravte `DATABASE_URL`.
3. Nainstalujte závislosti:

   ```bash
   pnpm install
   ```

4. Vytvořte databázové tabulky z verzovaných migrací:

   ```bash
   pnpm db:deploy
   ```

5. Volitelně přidejte bezpečná ukázková data:

   ```bash
   pnpm db:seed
   ```

6. Spusťte vývojový server:

   ```bash
   pnpm dev
   ```

Web bude dostupný na `http://localhost:3000`. Kontrola běhu služby je na `http://localhost:3000/api/health`. Produkční sestavení vytvoříte přes `pnpm build` a lokálně spustíte přes `pnpm start`. Railway na Linuxu používá samostatný server přes `pnpm start:standalone`.

Pro vývoj nové migrace po změně schématu použijte `pnpm db:migrate --name popis-zmeny`. Pro aplikování již vytvořených migrací používejte `pnpm db:deploy`; produkční databázi nepřipojujte k příkazu `migrate dev`.

## Proměnné prostředí

| Proměnná                   | Povinná | Popis                                                                |
| -------------------------- | ------- | -------------------------------------------------------------------- |
| `DATABASE_URL`             | ano     | Připojovací URL PostgreSQL. Nikdy ji necommitujte.                   |
| `CHEAPSHARK_USER_AGENT`    | ano     | Identifikace serverových požadavků vůči CheapSharku.                 |
| `CHEAPSHARK_CONTACT_EMAIL` | ne      | Neveřejný provozní kontakt připojený k User-Agentu.                  |
| `CNB_API_BASE_URL`         | ne      | Výchozí hodnota je `https://api.cnb.cz/cnbapi`.                      |
| `ADS_ENABLED`              | ne      | Ve Fázi 1 musí zůstat `false`; žádné reklamní skripty se nenačítají. |

Soubor `.env.example` obsahuje pouze bezpečné vzory. Skutečné e-maily, hesla a tokeny patří do lokálního `.env` nebo do správy proměnných Railway.

## Ceny a kurz

CheapShark poskytuje ceny v USD. Aplikace je parsuje přes `decimal.js` a ukládá jako celé centy. Převod USD/CZK probíhá přesnou desetinnou aritmetikou se zaokrouhlením half-up na celé haléře.

Kurz se načítá serverově z endpointu ČNB `/exrates/daily` nejvýše jednou za 24 hodin. Platné kurzy se ukládají do tabulky `ExchangeRate`. Při výpadku ČNB se použije poslední uložený kurz; pokud žádný není, UI zobrazí pouze přesnou cenu v USD.

## Cenové zdroje a bezpečné odkazy

Rozhraní `PriceProvider` odděluje aplikaci od konkrétního zdroje. CheapShark adaptér používá timeout, runtime validaci odpovědí, krátkou cache a srozumitelné chyby včetně stavu 429. Neprovádí hromadné stahování katalogu; data se ukládají při uživatelském hledání nebo otevření detailu.

Odkaz „Přejít do obchodu“ vede nejprve na `/go/[offerId]`. Endpoint přijímá pouze UUID nabídky uložené v databázi, záznam načte serverově a znovu ověří přesný HTTPS origin a cestu CheapSharku. Libovolnou cílovou URL z query parametru nepřijímá.

## Databázové modely

- `Game` – interní záznam hry
- `Store` – obchod konkrétního poskytovatele
- `ProviderGame` – vazba externího a interního ID hry
- `Offer` – idempotentně aktualizovaná aktuální nabídka
- `PriceObservation` – nový záznam pouze při změně ceny
- `ProviderRun` – provozní výsledek uživatelského hledání
- `ExchangeRate` – denní kurz a čas jeho stažení

## Kontroly

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm format:check
pnpm build
```

GitHub Actions spouští lint, kontrolu TypeScriptu, testy, validaci Prisma schématu a produkční build. Samotná migrace proti databázi není v CI předstírána bez skutečné PostgreSQL služby.

## Příprava na Railway

Repozitář obsahuje `railway.json` s Railpack buildem, health endpointem a pre-deploy příkazem `pnpm db:deploy`. Budoucí nasazení:

1. Na Railway vytvořte projekt, PostgreSQL službu a Next.js službu z tohoto repozitáře.
2. Nastavte `DATABASE_URL` referencí na Railway PostgreSQL a doplňte ostatní proměnné podle `.env.example`.
3. Ověřte, že build používá Node.js 24 a healthcheck `/api/health`.
4. Spusťte nasazení. Pre-deploy krok aplikuje pouze čekající verzované migrace.

Projekt v této fázi na Railway nasazen není.

## Omezení Fáze 1

Projekt neobsahuje uživatelské účty, administraci, e-mailová upozornění, prémiové funkce, ostré reklamy ani plánovaný hromadný sběr katalogu. Historické minimum poskytnuté CheapSharkem je v UI výslovně označeno jako externí údaj, nikoli jako vlastní historie GameRadar CZ.
