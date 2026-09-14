import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Generování klienta databázi nepoužívá a smí proběhnout během buildu bez URL.
    // Databázové příkazy a runtime kontroluje scripts/with-database-url.mjs.
    url: process.env.DATABASE_URL!,
  },
});
