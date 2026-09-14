import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`Chyba konfigurace: ${message}`);
  process.exit(1);
}

const value = process.env.DATABASE_URL?.trim();
if (!value) {
  fail("DATABASE_URL je povinná pro běh aplikace a databázové příkazy.");
}

let databaseUrl;
try {
  databaseUrl = new URL(value);
} catch {
  fail("DATABASE_URL není platná URL.");
}

if (databaseUrl.protocol !== "postgresql:" && databaseUrl.protocol !== "postgres:") {
  fail("DATABASE_URL musí používat protokol postgresql:// nebo postgres://.");
}

const [command, ...args] = process.argv.slice(2);
if (!command) fail("Nebyl zadán příkaz, který má být spuštěn.");

const result = spawnSync(command, args, {
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
