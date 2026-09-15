import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { getServerEnv } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const env = getServerEnv();
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    connectionTimeoutMillis: env.DATABASE_CONNECT_TIMEOUT_MS,
    idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
  });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  const client = globalForPrisma.prisma ?? createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}
