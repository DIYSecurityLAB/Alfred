import { DefaultResultError, Result } from '@/utils/Result';
import { z } from 'zod';
import { RemoteDataSource } from '../datasource/Remote.datasource';
import { ListedCryptoRateModel } from '../model/BitcoinRate.model';

// Schema for the new Market API response
export const MarketPriceModel = z.object({
  source: z.string(),
  timestamp: z.number(),
  bitcoin: z.object({
    brl: z.number(),
    eur: z.number().optional(),
    ars: z.number().optional(),
  }),
  usd: z.object({
    brl: z.number(),
    ars: z.number().optional(),
  }),
  euro: z
    .object({
      brl: z.number(),
      ars: z.number().optional(),
    })
    .optional(),
});

export type ListReq = object;

export type ValidateRes = Promise<
  Result<ListedCryptoRateModel, { code: 'SERIALIZATION' } | DefaultResultError>
>;

export interface BitcoinRateRepository {
  list(params?: ListReq): ValidateRes;
}

export class BitcoinRateRepositoryImpl implements BitcoinRateRepository {
  async list(): ValidateRes {
    try {
      const marketApiUrl = `${import.meta.env.VITE_API_URL || ''}/market`;
      const ApiKey = import.meta.env.VITE_API_KEY || '';

      const marketAPI = new RemoteDataSource(marketApiUrl, {
        'x-api-key': ApiKey,
      });

      // Call the new market API endpoint
      const marketData = await marketAPI.get({
        url: '/price/btc-usdt',
        model: MarketPriceModel,
      });

      if (!marketData) {
        return Result.Error({ code: 'SERIALIZATION' });
      }

      // Processar as taxas incluindo o Euro e ARS
      const result: ListedCryptoRateModel = {
        bitcoin: {
          brl: marketData.bitcoin.brl,
          eur: marketData.bitcoin.eur,
          // Garantir que ars seja incluído, mesmo que como undefined
          ars: marketData.bitcoin.ars,
        },
        tether: {
          brl: marketData.usd.brl,
          ars: marketData.usd.ars,
        },
      };

      // Adicionar dados do Euro se disponíveis
      if (marketData.euro) {
        result.euro = {
          brl: marketData.euro.brl,
          ars: marketData.euro.ars,
        };
      }

      // Adicionar dados do USD separadamente se necessário
      if (marketData.usd) {
        result.usd = {
          brl: marketData.usd.brl,
          ars: marketData.usd.ars,
        };
      }

      return Result.Success(result);
    } catch (error) {
      const err: DefaultResultError = {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : undefined,
      };
      return Result.Error(err);
    }
  }
}
