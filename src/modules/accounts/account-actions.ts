"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { requireUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function updatePrivacySettings(form: FormData) {
  const user = await requireUser("/nastaveni");
  const granted = form.get("marketingEmails") === "on";
  await getPrisma().$transaction([
    getPrisma().user.update({ where: { id: user.id }, data: { marketingEmails: granted } }),
    getPrisma().userConsent.create({
      data: { userId: user.id, kind: "marketing-email", version: "2026-09-15", granted },
    }),
  ]);
}
export async function deleteAccount() {
  await requireUser("/nastaveni");
  await getAuth().api.deleteUser({ headers: await headers(), body: {} });
  redirect("/");
}
