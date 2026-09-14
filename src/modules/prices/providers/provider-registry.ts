import "server-only";

import { getServerEnv } from "@/config/env";
import { CheapSharkProvider } from "@/modules/prices/providers/cheapshark/cheapshark-provider";
import { CnbExchangeRateProvider } from "@/modules/prices/providers/cnb/cnb-provider";

let cheapShark: CheapSharkProvider | undefined;
let cnb: CnbExchangeRateProvider | undefined;

export function getCheapSharkProvider() {
  const env = getServerEnv();
  cheapShark ??= new CheapSharkProvider({
    userAgent: env.CHEAPSHARK_USER_AGENT,
    contactEmail: env.CHEAPSHARK_CONTACT_EMAIL || undefined,
  });
  return cheapShark;
}

export function getCnbProvider() {
  cnb ??= new CnbExchangeRateProvider({ baseUrl: getServerEnv().CNB_API_BASE_URL });
  return cnb;
}
