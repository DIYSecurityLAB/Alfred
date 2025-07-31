import { z } from 'zod';

export const ListedCryptoRateModel = z.object({
  bitcoin: z.object({
    brl: z.number(),
    eur: z.number().optional(),
    ars: z.number().optional(),
  }),
  tether: z.object({
    brl: z.number(),
    eur: z.number().optional(),
    ars: z.number().optional(),
  }),
  euro: z
    .object({
      brl: z.number(),
      ars: z.number().optional(),
    })
    .optional(),
  usd: z
    .object({
      brl: z.number(),
      ars: z.number().optional(),
    })
    .optional(),
});

export type ListedCryptoRateModel = z.infer<typeof ListedCryptoRateModel>;
