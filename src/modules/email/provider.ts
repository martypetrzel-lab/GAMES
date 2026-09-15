import "server-only";
import { Resend } from "resend";
import { getServerEnv } from "@/config/env";
import { logServerError } from "@/lib/observability/server-log";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};
export interface EmailProvider {
  id: string;
  send(message: EmailMessage): Promise<{ id: string | null }>;
}
class DisabledProvider implements EmailProvider {
  id = "disabled";
  async send(): Promise<{ id: string | null }> {
    throw new Error("Odesílání e-mailů není nakonfigurováno.");
  }
}
class PreviewProvider implements EmailProvider {
  id = "preview";
  async send(message: EmailMessage) {
    console.info(
      JSON.stringify({
        level: "info",
        event: "email-preview",
        subject: message.subject,
        idempotencyKey: message.idempotencyKey,
        timestamp: new Date().toISOString(),
      }),
    );
    return { id: null };
  }
}
class ResendProvider implements EmailProvider {
  readonly id = "resend";
  constructor(
    private client: Resend,
    private from: string,
  ) {}
  async send(message: EmailMessage) {
    const result = await this.client.emails.send(
      {
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      },
      { idempotencyKey: message.idempotencyKey },
    );
    if (result.error) throw new Error(`Email provider odmítl zprávu: ${result.error.name}`);
    return { id: result.data?.id ?? null };
  }
}
export function getEmailProvider(): EmailProvider {
  const env = getServerEnv();
  if (env.EMAIL_PROVIDER === "disabled") return new DisabledProvider();
  if (env.EMAIL_PROVIDER === "log") return new PreviewProvider();
  if (!env.EMAIL_API_KEY || !env.EMAIL_FROM) {
    logServerError("environment", new Error("Neúplná konfigurace e-mailu"), {
      operation: "email-provider",
    });
    return new DisabledProvider();
  }
  return new ResendProvider(new Resend(env.EMAIL_API_KEY), env.EMAIL_FROM);
}
