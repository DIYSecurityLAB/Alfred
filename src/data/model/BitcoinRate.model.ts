import { z } from 'zod';

export const ListedCryptoRateModel = z.object({
  bitcoin: z.object({
    brl: z.number(),
    eur: z.number().optional(),
  }),
  tether: z.object({
    brl: z.number(),
    eur: z.number().optional(),
  }),
  euro: z
    .object({
      brl: z.number(),
    })
    .optional(),
});

export type ListedCryptoRateModel = z.infer<typeof ListedCryptoRateModel>;
