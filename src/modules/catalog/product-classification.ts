import type { ProductType } from "@/generated/prisma/enums";

const patterns: Array<[ProductType, RegExp]> = [
  ["SOUNDTRACK", /(?:^|[\s:–—_-])(?:soundtrack|original soundtrack|ost)(?:$|[\s:–—_-])/i],
  ["DEMO", /(?:^|[\s:–—_-])demo(?:$|[\s:–—_-])/i],
  ["DLC", /(?:^|[\s:–—_-])(?:dlc|expansion|season pass)(?:$|[\s:–—_-])/i],
  ["SOFTWARE", /(?:^|[\s:–—_-])(?:editor|tool|sdk|software)(?:$|[\s:–—_-])/i],
];

export function classifyProduct(title: string, providerType?: string | null): ProductType {
  const normalizedProviderType = providerType?.toLowerCase();
  if (normalizedProviderType === "game") return "GAME";
  if (normalizedProviderType === "dlc") return "DLC";
  if (normalizedProviderType === "demo") return "DEMO";
  if (normalizedProviderType === "soundtrack") return "SOUNDTRACK";
  if (normalizedProviderType === "software") return "SOFTWARE";
  if (normalizedProviderType === "unknown") return "UNKNOWN";
  return patterns.find(([, pattern]) => pattern.test(title))?.[0] ?? "GAME";
}

export function effectiveProductType<T extends ProductType>(automatic: T, override?: T | null): T {
  return override ?? automatic;
}
