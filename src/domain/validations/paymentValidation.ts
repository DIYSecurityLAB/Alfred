import { z } from 'zod';

export const paymentSchema = z.object({
  realValue: z.number().positive(),
  bitcoinValue: z.number().positive(),
  paymentMethod: z.enum([
    'PIX',
    'Cartão de Crédito',
    'Boleto Bancário',
    'TICKET',
    'TED',
    'CASH',
    'BANK_TRANSFER',
    'SWIFT',
    'PAYPAL',
    'NOMAD',
  ]),
  network: z.string().min(1, 'Network is required'),
  phone: z.string().regex(/^\d{9,15}$/, 'Invalid phone number'),
  coldWalletId: z
    .string()
    .regex(
      /^(1|3)[a-km-zA-HJ-NP-Z0-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/,
      'Invalid cold wallet',
    ),
  coupon: z.string().optional(),
});
