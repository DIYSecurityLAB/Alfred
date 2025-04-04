import { ExceptionHandler } from '@/utils/ExceptionHandler';
import { DefaultResultError, Result } from '@/utils/Result';
import { z } from 'zod';
import { RemoteDataSource } from '../datasource/Remote.datasource';
import { ListedCryptoRateModel } from '../model/BitcoinRate.model';

export const CryptoComparePriceModel = z.object({
  BRL: z.number(),
});

export const BinancePriceModel = z.object({
  price: z.string(),
});

export type ListReq = object;

export type ValidateRes = Promise<
  Result<ListedCryptoRateModel, { code: 'SERIALIZATION' } | DefaultResultError>
>;

export interface BitcoinRateRepository {
  list(req: ListReq): ValidateRes;
}

export class BitcoinRateRepositoryImpl implements BitcoinRateRepository {
  constructor(private api: RemoteDataSource) {}

  @ExceptionHandler()
  async list(): ValidateRes {
    let result = await this.api.get({
      url: `/price?ids=bitcoin,tether&vs_currencies=brl`,
      model: ListedCryptoRateModel,
    });

    if (!result || !result.bitcoin || !result.tether) {
      const backupUrl = 'https://min-api.cryptocompare.com/data';
      const backupApi = new RemoteDataSource(backupUrl);

      const btcRes = await backupApi.get({
        url: `/price?fsym=BTC&tsyms=BRL`,
        model: CryptoComparePriceModel,
      });
      const usdtRes = await backupApi.get({
        url: `/price?fsym=USDT&tsyms=BRL`,
        model: CryptoComparePriceModel,
      });

      if (btcRes && usdtRes) {
        result = {
          bitcoin: { brl: btcRes.BRL || 0 },
          tether: { brl: usdtRes.BRL || 0 },
        };
      }
    }

    // Adicionando a Binance como segunda opção de backup
    if (!result || !result.bitcoin || !result.tether) {
      const binanceUrl = 'https://api.binance.com/api/v3';
      const binanceApi = new RemoteDataSource(binanceUrl);

      const btcToBrlRes = await binanceApi.get({
        url: `/ticker/price?symbol=BTCBRL`,
        model: BinancePriceModel,
      });

      const usdtToBtcRes = await binanceApi.get({
        url: `/ticker/price?symbol=BTCUSDT`,
        model: BinancePriceModel,
      });

      if (btcToBrlRes && usdtToBtcRes) {
        result = {
          bitcoin: { brl: parseFloat(btcToBrlRes.price) || 0 },
          tether: { brl: parseFloat(usdtToBtcRes.price) || 0 },
        };
      }
    }

    if (!result) {
      return Result.Error({ code: 'SERIALIZATION' });
    }

    return Result.Success(result);
  }
}
