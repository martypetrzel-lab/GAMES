# GameRadar CZ

Český srovnávač cen digitálních PC her. Fáze 2 přidává profesionální responzivní rozhraní, filtrování, vlastní cenové statistiky a interaktivní graf nad bezpečně uloženými daty z CheapSharku. Ceny v CZK jsou orientačně přepočítané podle kurzovního lístku České národní banky.

## Použité technologie

- Next.js 16 s App Routerem, React 19 a TypeScriptem
- Tailwind CSS 4 a vlastní responzivní vizuální vrstva
- PostgreSQL, Prisma ORM 7 a ovladač `pg`
- Vitest, ESLint a Prettier
- CheapShark jako první implementace `PriceProvider`
- API ČNB jako první implementace `ExchangeRateProvider`
- Recharts načítaný pouze na detailu hry

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

Health endpoint kontroluje i skutečné připojení k databázi. Vrací pouze bezpečný stav `ok`/`degraded` a čas kontroly, nikdy připojovací údaje.

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

`pnpm install` a `pnpm db:generate` fungují bez `DATABASE_URL`, protože pouze generují Prisma Clienta. Běh aplikace a příkazy `db:migrate`, `db:deploy` a `db:seed` naopak platnou PostgreSQL `DATABASE_URL` povinně kontrolují a bez ní skončí s chybou. Build nepoužívá žádnou náhradní ani falešnou databázi.

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

## Vlastní historie a graf

Detail hry počítá minimum, maximum, průměr a medián výhradně z tabulky `PriceObservation`. Externí historické minimum CheapSharku zůstává oddělené a výslovně označené. Hodnocení výhodnosti vyžaduje alespoň pět pozorování v období minimálně 14 dní; do té doby se zobrazuje „Zatím nedostatek dat“.

Interní endpoint `/api/history/[gameId]?range=3m` přijímá jen číselné CheapShark ID a rozsahy `30d`, `3m`, `6m`, `1y` nebo `all`. Databázový dotaz je omezen na 5 000 záznamů a odpověď je agregována nejvýše přibližně na 500 bodů.

## Šetrná aktualizace cen

Samostatný ukončitelný příkaz aktualizuje pouze omezenou dávku již uložených her, jejichž nabídky jsou starší než 12 hodin:

```bash
pnpm prices:refresh
```

Výchozí dávka je 10 her, maximum 25. Velikost lze snížit proměnnou `PRICE_REFRESH_BATCH_SIZE`. Mezi hrami je prodleva a zůstávají zachované cache a timeouty poskytovatele. Příkaz není součástí webového procesu a ve Fázi 2 se cron na Railway automaticky nezapíná.

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

## Fáze 3: účty a cenová upozornění

Autentizaci zajišťuje Better Auth s Prisma adaptérem. Hesla jsou hashována pomocí scrypt a sessions jsou uloženy v PostgreSQL. Osobní stránky ověřují session na serveru a všechny změny filtrují podle přihlášeného uživatele.

| Nová Railway Variable  | Povinná        | Tajná | Chování při absenci                                                              |
| ---------------------- | -------------- | ----- | -------------------------------------------------------------------------------- |
| `AUTH_SECRET`          | ano v produkci | ano   | autentizace nesmí být používána; vytvořte `openssl rand -base64 48`              |
| `APP_BASE_URL`         | ano v produkci | ne    | lokálně `http://localhost:3000`, na Railway veřejná HTTPS URL                    |
| `EMAIL_PROVIDER`       | ne             | ne    | `disabled` nic neposílá, `log` vypíše bezpečné preview, `resend` aktivuje Resend |
| `EMAIL_FROM`           | jen pro Resend | ne    | bez něj se provider bezpečně vypne                                               |
| `EMAIL_API_KEY`        | jen pro Resend | ano   | klíč patří pouze do Railway Variables                                            |
| `CRON_BATCH_SIZE`      | ne             | ne    | výchozí 10, povoleno 1–50                                                        |
| `ALERT_COOLDOWN_HOURS` | ne             | ne    | výchozí 24 hodin                                                                 |
| `STEAM_API_KEY`        | ne             | ano   | Steam synchronizace není aktivní                                                 |

E-mail je ve výchozím stavu vypnutý. Produkční Resend vyžaduje ověřenou doménu, odesílatele a API klíč. Aplikace bez úplné konfigurace nikdy nepředstírá úspěšné odeslání.

### Samostatná Railway cron služba

Cron bez schválení nezapínejte. Po schválení vytvořte z téhož repozitáře samostatnou Railway službu se stejnou databází a proměnnými. Start Command nastavte na `pnpm alerts:check`, odstraňte veřejnou doménu a zvolte plán například každé dvě hodiny. Proces používá PostgreSQL advisory lock, omezenou dávku, seskupení her a sekvenční požadavky; po dokončení skončí.

Steam identita je pouze datově připravená. Aplikace nepoužívá scraping ani soukromé endpointy. Export a smazání osobních dat jsou v nastavení účtu. Text zásad soukromí je provozní návrh, nikoliv právní stanovisko.
