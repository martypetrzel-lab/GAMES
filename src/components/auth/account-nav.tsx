"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

export function AccountNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!session) return;
    fetch("/api/notifications/unread", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : { count: 0 }))
      .then((data: { count?: number }) => setUnread(data.count ?? 0))
      .catch(() => setUnread(0));
  }, [session]);
  if (isPending) return <span className="account-nav-placeholder" />;
  if (!session)
    return (
      <Link className="header-login" href="/prihlaseni">
        Přihlásit
      </Link>
    );
  return (
    <details className="account-menu">
      <summary>
        {session.user.name || "Můj účet"}
        {unread > 0 ? ` · ${unread}` : ""}
      </summary>
      <nav>
        <Link href="/muj-prehled">Můj přehled</Link>
        <Link href="/seznam-prani">Seznam přání</Link>
        <Link href="/upozorneni">Upozornění</Link>
        <Link href="/nastaveni">Nastavení</Link>
        <button
          onClick={async () => {
            await authClient.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Odhlásit se
        </button>
      </nav>
    </details>
  );
}
