import { BitcoinRateRepositoryImpl } from '@/data/repositories/BitcoinRate.repository';
import { ListBitcoinRateUseCaseImpl } from './bitcoin/list-rate.usecase';

// const ApiUrl = import.meta.env.VITE_API_URL;
// const ApiKey = import.meta.env.VITE_API_KEY;

// const remoteAPI = new RemoteDataSource(ApiUrl, {
//   'x-api-key': ApiKey,
// });

const BitcoinRateRepository = new BitcoinRateRepositoryImpl();

export const usecases = {
  bitcoinRate: {
    list: new ListBitcoinRateUseCaseImpl(BitcoinRateRepository),
  },
};
