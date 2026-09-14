import { z } from "zod";

export const cnbDailyRatesSchema = z.object({
  rates: z.array(
    z.object({
      validFor: z.iso.date(),
      amount: z.number().int().positive(),
      currencyCode: z.string().length(3),
      rate: z.number().positive(),
    }),
  ),
});
