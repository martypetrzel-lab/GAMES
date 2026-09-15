export const PRICE_STALE_AFTER_MS = 12 * 60 * 60 * 1_000;

export function isPriceStale(observedAt: Date | string, now = new Date()): boolean {
  return now.getTime() - new Date(observedAt).getTime() > PRICE_STALE_AFTER_MS;
}

export function relativeUpdateLabel(observedAt: Date | string, now = new Date()): string {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - new Date(observedAt).getTime()) / 60_000),
  );
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `před ${hours} h`;
  return `před ${Math.floor(hours / 24)} d`;
}
