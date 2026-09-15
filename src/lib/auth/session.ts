import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth/auth";
import { safeReturnTo } from "@/lib/auth/redirects";

export async function getCurrentSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function requireUser(returnTo = "/muj-prehled") {
  const session = await getCurrentSession();
  if (!session) redirect(`/prihlaseni?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return session.user;
}

export { safeReturnTo } from "@/lib/auth/redirects";
