import { useEffect, useState } from 'react';

export function useConfirmInfos(
  network: string,
  fiatAmount: string,
  fiatType: string,
  alfredFeePercentage: number,
  cryptoType: string,
  paymentMethod?: string,
  cupom?: string,
) {
  const [localAlfredFeePercentage, setLocalAlfredFeePercentage] =
    useState<number>(alfredFeePercentage);

  useEffect(() => {
    setLocalAlfredFeePercentage(alfredFeePercentage);
  }, [alfredFeePercentage]);

  const [onchainFee, setOnchainFee] = useState<number | null>(null);
  const [btcToBrl, setBtcToBrl] = useState<number | null>(null);
  const [usdToBrl, setUsdToBrl] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,usd&vs_currencies=brl',
        );
        const data = await response.json();
        setBtcToBrl(data.bitcoin.brl || 0);
        setUsdToBrl(data.usd.brl || 0);
      } catch (error) {
        console.error('Erro ao buscar cotações:', error);
        setBtcToBrl(0);
        setUsdToBrl(0);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    const fetchOnchainFee = async () => {
      if (network.toLowerCase() !== 'onchain') {
        setOnchainFee(null);
        return;
      }
      try {
        const response = await fetch(
          'https://mempool.space/api/v1/fees/recommended',
        );
        const data = await response.json();
        const satPerVByte = data.halfHourFee;
        const transactionSize = 140;
        const feeInSats = satPerVByte * transactionSize;
        const feeInBTC = feeInSats / 1e8;
        const feeInBRL = btcToBrl ? feeInBTC * btcToBrl : 0;
        setOnchainFee(feeInBRL);
      } catch (error) {
        console.error('Erro ao buscar a taxa on-chain:', error);
        setOnchainFee(null);
      }
    };

    fetchOnchainFee();
  }, [network, btcToBrl]);

  // Converte o valor do fiat para número (supondo que o valor seja formatado com vírgula como separador decimal)
  const fiatAmountNum = parseFloat(
    fiatAmount.replace(/[^\d,]/g, '').replace(',', '.'),
  );

  // Calcula o valor em BRL – se o fiat for USD, multiplica pelo câmbio USD→BRL
  const amountBRL =
    fiatType.toUpperCase() === 'BRL'
      ? fiatAmountNum
      : fiatAmountNum * (usdToBrl || 0);

  // Lógica atualizada de definição da taxa (alfredFeeRate):
  // - Para valores até 6000 BRL:
  //   - Taxa base: 4.99% (0.0499)
  // - Para valores acima de 6000 BRL:
  //   - Taxa base: 5.99% (0.0599)
  // - Se houver cupom válido com percentual > 0:
  //   - Para qualquer valor: aplica desconto completo
  let baseFeeRate: number;
  if (amountBRL < 6000) {
    baseFeeRate = 0.0499;
  } else {
    baseFeeRate = 0.0599;
  }

  let alfredFeeRate: number = baseFeeRate;
  if (cupom && cupom.trim() !== '' && localAlfredFeePercentage > 0) {
    const cupomDiscountPercentage = localAlfredFeePercentage / 100;
    alfredFeeRate = Math.max(0, baseFeeRate - cupomDiscountPercentage);
  }

  const alfredFee = amountBRL * alfredFeeRate;

  // Branch para criptomoedas
  if (cryptoType.toLowerCase() === 'usdt') {
    // Cálculo para USDT
    const swapFee = amountBRL * 0.0158; // taxa de swap de 1.58%
    const totalFees = alfredFee + swapFee + (onchainFee || 0);
    const finalAmount = amountBRL - totalFees;

    // Para USDT, converte o finalAmount (BRL) para USD
    const expectedAmountUSDT = usdToBrl
      ? (finalAmount / usdToBrl).toFixed(2)
      : '0.00';

    return {
      onchainFee,
      btcToBrl,
      usdToBrl,
      swapFee,
      totalFees,
      expectedAmount: finalAmount,
      expectedAmountCrypto: expectedAmountUSDT,
      alfredFee,
      alfredFeeRate,
      conversionFeeUsdBrl: 0,
    };
  } else if (cryptoType.toLowerCase() === 'depix') {
    // Para Depix: a conversão é 1:1 com o Real
    // Se o fiat for USD, usamos amountBRL já convertido (via usdToBrl)
    // Usamos a mesma taxa de swap que para USDT.
    const swapFee = amountBRL * 0.0158; // taxa de swap de 1.58%
    const totalFees = alfredFee + swapFee + (onchainFee || 0);
    const finalAmount = amountBRL - totalFees;
    // Como Depix é 1:1 com o Real, o valor esperado em Depix é o finalAmount (formata com 2 decimais)
    const expectedAmountDepix = finalAmount.toFixed(2);

    return {
      onchainFee,
      btcToBrl,
      usdToBrl,
      swapFee,
      totalFees,
      expectedAmount: finalAmount,
      expectedAmountCrypto: expectedAmountDepix,
      alfredFee,
      alfredFeeRate,
      conversionFeeUsdBrl: 0,
    };
  } else {
    // Para BTC (ou outros que usem a lógica de conversão via BTC)
    const conversionFeeUsd = 0.65;
    const conversionFeeBrl = conversionFeeUsd * (usdToBrl || 0);
    const swapFee = amountBRL * 0.025 + conversionFeeBrl;
    const totalFees = alfredFee + swapFee + (onchainFee || 0);
    const finalAmount = amountBRL - totalFees;
    const expectedAmountBTC = btcToBrl
      ? (finalAmount / btcToBrl).toFixed(8)
      : '0.00000000';

    return {
      onchainFee,
      btcToBrl,
      usdToBrl,
      swapFee,
      totalFees,
      expectedAmount: finalAmount,
      expectedAmountCrypto: expectedAmountBTC,
      alfredFee,
      alfredFeeRate,
      conversionFeeUsdBrl: conversionFeeBrl,
    };
  }
}
