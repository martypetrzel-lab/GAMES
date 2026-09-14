import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL musí být platná PostgreSQL URL."),
  CHEAPSHARK_USER_AGENT: z.string().min(12, "CHEAPSHARK_USER_AGENT je příliš krátký."),
  CHEAPSHARK_CONTACT_EMAIL: z.union([z.literal(""), z.string().email()]).optional(),
  CNB_API_BASE_URL: z.string().url().default("https://api.cnb.cz/cnbapi"),
  ADS_ENABLED: z.enum(["true", "false"]).default("false"),
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
    });
  }

  return cachedEnv;
}
