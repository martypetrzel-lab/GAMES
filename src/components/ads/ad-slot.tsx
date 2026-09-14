import { adConfig, type AdPlacement } from "@/config/ads";

export function AdSlot({ placement }: { placement: AdPlacement }) {
  void placement;
  if (!adConfig.enabled) return null;
  return null;
}
