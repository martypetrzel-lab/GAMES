export type HistoryRange = "30d" | "3m" | "6m" | "1y" | "all";
export const historyRanges: HistoryRange[] = ["30d", "3m", "6m", "1y", "all"];

export function rangeStart(range: HistoryRange, now = new Date()): Date | undefined {
  const days = { "30d": 30, "3m": 92, "6m": 183, "1y": 366, all: 0 }[range];
  return days ? new Date(now.getTime() - days * 86_400_000) : undefined;
}

export function aggregateHistory<T extends { observedAt: Date }>(points: T[], maximum = 500): T[] {
  if (points.length <= maximum) return points;
  const step = Math.ceil(points.length / maximum);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
}
