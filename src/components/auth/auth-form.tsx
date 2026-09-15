"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");
    const result = isRegister
      ? await authClient.signUp.email({ email, password, name: email.split("@")[0] || "Hráč" })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(
        result.error.status === 429
          ? "Příliš mnoho pokusů. Zkuste to prosím později."
          : "Údaje se nepodařilo ověřit. Zkontrolujte je nebo to zkuste později.",
      );
      return;
    }
    const target = search.get("returnTo");
    router.push(target?.startsWith("/") && !target.startsWith("//") ? target : "/muj-prehled");
    router.refresh();
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <label>
        Heslo
        <span className="password-field">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={10}
            maxLength={128}
            required
          />
          <button type="button" onClick={() => setShow((value) => !value)}>
            {show ? "Skrýt" : "Zobrazit"}
          </button>
        </span>
      </label>
      {isRegister && (
        <p className="form-help">Alespoň 10 znaků. Doporučujeme dlouhou unikátní frázi.</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button-primary" disabled={pending}>
        {pending ? "Pracuji…" : isRegister ? "Vytvořit účet" : "Přihlásit se"}
      </button>
      <p>
        {isRegister ? "Už účet máte? " : "Ještě nemáte účet? "}
        <Link href={isRegister ? "/prihlaseni" : "/registrace"}>
          {isRegister ? "Přihlásit se" : "Zaregistrovat se"}
        </Link>
      </p>
    </form>
  );
}
