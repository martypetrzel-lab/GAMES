import type { ExchangeRateQuote } from "@/modules/prices/domain/types";

export function RateNote({ rate }: { rate: ExchangeRateQuote | null }) {
  if (!rate)
    return (
      <p className="rate-note warning">
        Kurz ČNB nyní není dostupný. Zobrazujeme přesné ceny v USD.
      </p>
    );
  const date = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(rate.validFor);
  return (
    <p className="rate-note">
      Orientační přepočet podle kurzu ČNB platného pro {date}. Konečná částka se může lišit.
    </p>
  );
}
