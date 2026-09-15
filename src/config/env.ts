import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL musí být platná PostgreSQL URL."),
  CHEAPSHARK_USER_AGENT: z.string().min(12, "CHEAPSHARK_USER_AGENT je příliš krátký."),
  CHEAPSHARK_CONTACT_EMAIL: z.union([z.literal(""), z.string().email()]).optional(),
  CNB_API_BASE_URL: z.string().url().default("https://api.cnb.cz/cnbapi"),
  ADS_ENABLED: z.enum(["true", "false"]).default("false"),
  AUTH_SECRET: z.string().min(32).optional(),
  APP_BASE_URL: z.string().url().optional(),
  EMAIL_PROVIDER: z.enum(["disabled", "log", "resend"]).default("disabled"),
  EMAIL_FROM: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  CRON_BATCH_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  ALERT_COOLDOWN_HOURS: z.coerce.number().int().min(1).max(720).default(24),
  STEAM_API_KEY: z.string().optional(),
  CATALOG_SYNC_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  CATALOG_SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(200).default(60),
  CATALOG_MAX_PAGES_PER_RUN: z.coerce.number().int().min(1).max(20).default(5),
  CATALOG_REQUEST_DELAY_MS: z.coerce.number().int().min(500).max(30000).default(2000),
  CATALOG_MAX_RUNTIME_MINUTES: z.coerce.number().int().min(1).max(30).default(10),
  PRICE_REFRESH_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
  VERIFIED_STORES_ONLY: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  DATABASE_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(5000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  READINESS_TIMEOUT_MS: z.coerce.number().int().min(250).max(10000).default(2000),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = serverEnvSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      CHEAPSHARK_USER_AGENT: process.env.CHEAPSHARK_USER_AGENT,
      CHEAPSHARK_CONTACT_EMAIL: process.env.CHEAPSHARK_CONTACT_EMAIL,
      CNB_API_BASE_URL: process.env.CNB_API_BASE_URL,
      ADS_ENABLED: process.env.ADS_ENABLED,
      AUTH_SECRET: process.env.AUTH_SECRET,
      APP_BASE_URL: process.env.APP_BASE_URL,
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_API_KEY: process.env.EMAIL_API_KEY,
      CRON_BATCH_SIZE: process.env.CRON_BATCH_SIZE,
      ALERT_COOLDOWN_HOURS: process.env.ALERT_COOLDOWN_HOURS,
      STEAM_API_KEY: process.env.STEAM_API_KEY,
      CATALOG_SYNC_ENABLED: process.env.CATALOG_SYNC_ENABLED,
      CATALOG_SYNC_BATCH_SIZE: process.env.CATALOG_SYNC_BATCH_SIZE,
      CATALOG_MAX_PAGES_PER_RUN: process.env.CATALOG_MAX_PAGES_PER_RUN,
      CATALOG_REQUEST_DELAY_MS: process.env.CATALOG_REQUEST_DELAY_MS,
      CATALOG_MAX_RUNTIME_MINUTES: process.env.CATALOG_MAX_RUNTIME_MINUTES,
      PRICE_REFRESH_BATCH_SIZE: process.env.PRICE_REFRESH_BATCH_SIZE,
      VERIFIED_STORES_ONLY: process.env.VERIFIED_STORES_ONLY,
      DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
      DATABASE_CONNECT_TIMEOUT_MS: process.env.DATABASE_CONNECT_TIMEOUT_MS,
      DATABASE_IDLE_TIMEOUT_MS: process.env.DATABASE_IDLE_TIMEOUT_MS,
      READINESS_TIMEOUT_MS: process.env.READINESS_TIMEOUT_MS,
    });
  }

  return cachedEnv;
}
