import { convertUsdCentsToCzkHalere, formatMoney } from "@/lib/money/money";
import type { ExchangeRateQuote, SearchResult } from "@/modules/prices/domain/types";
import { classifyPurchase, getStorePolicy } from "@/modules/stores/trusted-stores";

type Deal = SearchResult["offers"][number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date);
}

export function DealCard({ deal, rate }: { deal: Deal; rate: ExchangeRateQuote | null }) {
  const czkMinor = rate ? convertUsdCentsToCzkHalere(deal.price.minor, rate.rate) : null;
  const policy = getStorePolicy(deal.provider, deal.externalStoreId);
  const purchase = classifyPurchase(deal.provider, deal.externalStoreId);
  return (
    <article className="deal-card">
      <div className="store-name">
        <span className="store-dot" />
        {deal.storeName}
        <small>
          {policy.sellerType === "first_party_store"
            ? "Přímá platforma"
            : "Autorizovaný prodejce klíčů"}{" "}
          ·{" "}
          {purchase.activationPlatform === "unknown"
            ? "Aktivace neuvedena"
            : `Aktivace ${purchase.activationPlatform === "steam" ? "Steam" : purchase.activationPlatform === "epic" ? "Epic Games Store" : "GOG"}`}{" "}
          · {purchase.purchaseType === "direct" ? "Přímý nákup" : "Aktivační klíč"}
        </small>
        <span className="verified-badge">✓ Ověřený prodejce</span>
      </div>
      <div className="deal-prices">
        <strong>
          {czkMinor === null
            ? formatMoney(deal.price)
            : formatMoney({ minor: czkMinor, currency: "CZK" })}
        </strong>
        {rate && <span>Přesně {formatMoney(deal.price)}</span>}
        {deal.regularPrice.minor > deal.price.minor && (
          <s>Původně {formatMoney(deal.regularPrice)}</s>
        )}
      </div>
      {deal.savingsPercent > 0 && <span className="discount">−{deal.savingsPercent} %</span>}
      <div className="deal-meta">Aktualizováno {formatDate(deal.observedAt)}</div>
      {deal.persistedId ? (
        <a
          className="deal-link"
          href={`/go/${deal.persistedId}`}
          target="_blank"
          rel="nofollow sponsored noopener"
        >
          Přejít do obchodu <span>↗</span>
        </a>
      ) : (
        <span className="deal-link disabled">Odkaz není dostupný</span>
      )}
    </article>
  );
}
