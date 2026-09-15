export type AlertRule = {
  targetPriceMinor: number | null;
  onHistoricalLow: boolean;
  lastTriggeredAt: Date | null;
  cooldownHours: number;
};
export type AlertPrice = {
  czkMinor: number;
  usdMinor: number;
  previousOwnMinimum: number | null;
  now: Date;
};
export function evaluateAlert(rule: AlertRule, price: AlertPrice) {
  const cooldown =
    rule.lastTriggeredAt &&
    price.now.getTime() - rule.lastTriggeredAt.getTime() < rule.cooldownHours * 3_600_000;
  const targetReached = rule.targetPriceMinor !== null && price.czkMinor <= rule.targetPriceMinor;
  const historicalLow =
    rule.onHistoricalLow &&
    (price.previousOwnMinimum === null || price.usdMinor < price.previousOwnMinimum);
  return {
    triggered: !cooldown && (targetReached || historicalLow),
    reason: targetReached ? "target" : historicalLow ? "historical-low" : null,
    cooldown: Boolean(cooldown),
  } as const;
}
export function notificationDeduplicationKey(alertId: string, reason: string, usdMinor: number) {
  return `${alertId}:${reason}:${usdMinor}`;
}
