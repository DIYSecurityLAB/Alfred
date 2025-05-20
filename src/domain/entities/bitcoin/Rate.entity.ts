import { ListedCryptoRateModel } from '@/data/model/BitcoinRate.model';

export class ListedCryptoRate {
  bitcoin: { brl: number; eur?: number };
  tether: { brl: number; eur?: number };
  euro?: { brl: number };

  constructor() {
    this.bitcoin = { brl: 0 };
    this.tether = { brl: 0 };
  }

  static fromModel(model: ListedCryptoRateModel): ListedCryptoRate {
    const entity = new ListedCryptoRate();
    entity.bitcoin = {
      brl: model.bitcoin.brl,
      eur: model.bitcoin.eur,
    };
    entity.tether = {
      brl: model.tether.brl,
      eur: model.tether.eur,
    };
    if (model.euro) {
      entity.euro = { brl: model.euro.brl };
    }
    return entity;
  }
}
