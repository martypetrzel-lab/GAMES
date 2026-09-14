import { z } from "zod";

const nullableNumericString = z.string().nullable();

export const cheapSharkDealSchema = z.object({
  title: z.string().min(1),
  dealID: z.string().min(1),
  storeID: z.string().min(1),
  gameID: z.string().min(1),
  salePrice: z.string().regex(/^\d+(?:\.\d+)?$/),
  normalPrice: z.string().regex(/^\d+(?:\.\d+)?$/),
  savings: z.string().regex(/^\d+(?:\.\d+)?$/),
  steamAppID: nullableNumericString,
  lastChange: z.number().int().nonnegative(),
  thumb: z.string().url().nullable().catch(null),
});

export const cheapSharkDealsSchema = z.array(cheapSharkDealSchema);

export const cheapSharkStoreSchema = z.object({
  storeID: z.string().min(1),
  storeName: z.string().min(1),
  isActive: z.union([z.literal(0), z.literal(1)]),
  images: z.object({
    banner: z.string(),
    logo: z.string(),
    icon: z.string(),
  }),
});

export const cheapSharkStoresSchema = z.array(cheapSharkStoreSchema);

export const cheapSharkGameSchema = z.object({
  info: z.object({
    title: z.string().min(1),
    steamAppID: nullableNumericString,
    thumb: z.string().url().nullable().catch(null),
  }),
  cheapestPriceEver: z
    .object({
      price: z.string().regex(/^\d+(?:\.\d+)?$/),
      date: z.number().int().nonnegative(),
    })
    .nullable(),
  deals: z.array(
    z.object({
      storeID: z.string().min(1),
      dealID: z.string().min(1),
      price: z.string().regex(/^\d+(?:\.\d+)?$/),
      retailPrice: z.string().regex(/^\d+(?:\.\d+)?$/),
      savings: z.string().regex(/^\d+(?:\.\d+)?$/),
    }),
  ),
});
