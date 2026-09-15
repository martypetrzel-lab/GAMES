import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Přihlášení", robots: { index: false, follow: false } };
export default function LoginPage() {
  return (
    <section className="account-page shell">
      <div>
        <p className="eyebrow">Vítejte zpět</p>
        <h1>Přihlášení</h1>
        <p>Spravujte sledované hry a cenová upozornění.</p>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </section>
  );
}
