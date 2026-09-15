import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Registrace", robots: { index: false, follow: false } };
export default function RegisterPage() {
  return (
    <section className="account-page shell">
      <div>
        <p className="eyebrow">GameRadar CZ</p>
        <h1>Vytvořit účet</h1>
        <p>Registrací nevzniká souhlas s marketingem. Účet můžete kdykoliv smazat.</p>
        <Suspense>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </section>
  );
}
