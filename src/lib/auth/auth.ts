import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { getPrisma } from "@/lib/db/prisma";
import { getEmailProvider } from "@/modules/email/provider";
import { accountEmail } from "@/modules/email/templates";

const secret = process.env.AUTH_SECRET;
const baseURL = process.env.APP_BASE_URL;

function createAuth() {
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32 || !baseURL)) {
    throw new Error("AUTH_SECRET a APP_BASE_URL jsou povinné pro produkční autentizaci.");
  }
  return betterAuth({
    appName: "GameRadar CZ",
    baseURL,
    secret,
    database: prismaAdapter(getPrisma(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const message = accountEmail("reset", url);
        await getEmailProvider().send({
          ...message,
          to: user.email,
          idempotencyKey: `password-reset-${crypto.randomUUID()}`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      sendVerificationEmail: async ({ user, url }) => {
        const message = accountEmail("verify", url);
        await getEmailProvider().send({
          ...message,
          to: user.email,
          idempotencyKey: `email-verification-${crypto.randomUUID()}`,
        });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 300, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      cookiePrefix: "gameradar",
      defaultCookieAttributes: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      database: { generateId: "uuid", defaultFindManyLimit: 100 },
    },
    user: {
      deleteUser: { enabled: true },
      additionalFields: {
        marketingEmails: { type: "boolean", required: false, defaultValue: false, input: false },
      },
    },
    trustedOrigins: baseURL ? [baseURL] : [],
    plugins: [nextCookies()],
  });
}

let cachedAuth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  cachedAuth ??= createAuth();
  return cachedAuth;
}
