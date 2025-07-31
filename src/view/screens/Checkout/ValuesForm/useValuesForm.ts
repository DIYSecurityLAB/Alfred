import { useCallback, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Checkout } from '../useCheckout';

export function useValuesForm() {
  const { t } = useTranslation();
  const form = useFormContext<Checkout>();

  const cryptoType = form.watch('cryptoType');
  const fiatType = form.watch('fiatType');

  const calculateCryptoAmount = useCallback(
    (numericValue: number) => {
      if (cryptoType === 'BITCOIN') {
        if (fiatType === 'BRL') {
          const btcAmount = numericValue / form.getValues('btcRate');
          form.setValue('cryptoAmount', btcAmount.toFixed(8));
        } else if (fiatType === 'EUR') {
          const btcAmount = numericValue / form.getValues('eurRate');
          form.setValue('cryptoAmount', btcAmount.toFixed(8));
        } else if (fiatType === 'ARS') {
          const arsRate = form.getValues('arsRate');
          // Verificar se a taxa ARS é válida antes de fazer a divisão
          if (arsRate && arsRate > 0) {
            const btcAmount = numericValue / arsRate;
            form.setValue('cryptoAmount', btcAmount.toFixed(8));
          } else {
            console.error('Taxa ARS inválida:', arsRate);
            form.setValue('cryptoAmount', '0.00000000');
          }
        } else {
          const btcAmount = numericValue / form.getValues('usdRate');
          form.setValue('cryptoAmount', btcAmount.toFixed(8));
        }
      } else if (cryptoType === 'DEPIX') {
        if (fiatType === 'BRL') {
          form.setValue('cryptoAmount', numericValue.toString());
        } else if (fiatType === 'EUR') {
          // Para DEPIX com EUR, usamos a taxa EUR/BRL para conversão
          const euroRate =
            form.getValues('eurRate') / form.getValues('btcRate');
          const depixAmount = numericValue / euroRate;
          form.setValue('cryptoAmount', depixAmount.toFixed(2));
        } else if (fiatType === 'ARS') {
          // Para DEPIX com ARS, calculamos usando a taxa direta de ARS/BTC
          const arsRate = form.getValues('arsRate');
          const brlRate = form.getValues('btcRate');

          // Verificar se a taxa ARS é válida antes de fazer a divisão
          if (arsRate && arsRate > 0) {
            // Usando valores diretos da API sem correções
            const arsToBrlRate = brlRate / arsRate;
            const depixAmount = numericValue * arsToBrlRate;
            form.setValue('cryptoAmount', depixAmount.toFixed(2));
          } else {
            console.error('Taxa ARS inválida para DEPIX:', arsRate);
            form.setValue('cryptoAmount', '0.00');
          }
        } else {
          const depixAmount = numericValue / form.getValues('usdtRate');
          form.setValue('cryptoAmount', depixAmount.toFixed(2));
        }
      } else {
        if (fiatType === 'BRL') {
          const usdtAmount = numericValue / form.getValues('usdtRate');
          form.setValue('cryptoAmount', usdtAmount.toFixed(2));
        } else if (fiatType === 'EUR') {
          // Cálculo correto para USDT em EUR usando taxas reais
          // 1. Calculamos quanto vale 1 BRL em EUR
          const brlToEurRate =
            form.getValues('eurRate') / form.getValues('btcRate');

          // 2. Calculamos quanto vale 1 USDT em EUR
          const usdtToEurRate = form.getValues('usdtRate') * brlToEurRate;

          // 3. Calculamos quantos USDT correspondem ao valor em EUR
          const usdtAmount = numericValue / usdtToEurRate;

          form.setValue('cryptoAmount', usdtAmount.toFixed(2));
        } else if (fiatType === 'ARS') {
          // Cálculo para USDT em ARS usando valores diretos da API
          // 1. Calculamos quanto vale 1 ARS em BRL
          const arsRate = form.getValues('arsRate');
          const brlRate = form.getValues('btcRate');

          // Verificar se as taxas são válidas antes de fazer os cálculos
          if (arsRate && arsRate > 0) {
            // Usamos valores exatos da API sem modificações
            const arsToBrlRate = brlRate / arsRate;
            const usdtRate = form.getValues('usdtRate');

            if (usdtRate && usdtRate > 0) {
              // 2. Calculamos o valor em USDT usando a taxa BRL/USDT
              const usdtAmount = (numericValue * arsToBrlRate) / usdtRate;
              form.setValue('cryptoAmount', usdtAmount.toFixed(2));
            } else {
              console.error('Taxa USDT inválida:', usdtRate);
              form.setValue('cryptoAmount', '0.00');
            }
          } else {
            console.error('Taxa ARS inválida para USDT:', arsRate);
            form.setValue('cryptoAmount', '0.00');
          }
        } else {
          form.setValue('cryptoAmount', numericValue.toFixed(2));
        }
      }
    },
    [cryptoType, fiatType, form],
  );

  const handleFiatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let numericValue = parseInt(value, 10);

    if (isNaN(numericValue)) {
      form.setValue('fiatAmount', '');
      form.setValue('cryptoAmount', '');
      return;
    }

    // Remover limite para ARS, manter para outras moedas
    if (fiatType !== 'ARS' && numericValue > 1000000) {
      numericValue = 1000000;
    }

    // Formatação específica para cada moeda
    let formattedValue: string;

    if (fiatType === 'ARS') {
      try {
        // Formatação para Peso Argentino - sem símbolo $
        // Verificamos se o valor já contém "ARS" para evitar duplicação
        const formattedNumber = numericValue.toLocaleString('es-AR');
        formattedValue = `ARS ${formattedNumber}`;
      } catch (error) {
        // Fallback simples caso a formatação falhe
        formattedValue = `ARS ${numericValue.toLocaleString()}`;
        console.error('Erro na formatação ARS:', error);
      }
    } else {
      // Formatação padrão para outras moedas
      formattedValue = new Intl.NumberFormat(
        fiatType === 'BRL' ? 'pt-BR' : fiatType === 'EUR' ? 'de-DE' : 'en-US',
        {
          style: 'currency',
          currency: fiatType,
          minimumFractionDigits: 0,
        },
      ).format(numericValue);
    }

    form.setValue('fiatAmount', formattedValue);
    calculateCryptoAmount(numericValue);
  };

  const toggleFiatType = () => {
    // Rotação entre BRL -> USD -> EUR -> ARS -> BRL
    let newFiatType: 'BRL' | 'USD' | 'EUR' | 'ARS';

    // Lógica especial para USDT: pular USD, já que não faz sentido comprar USDT com USDT
    if (cryptoType === 'USDT') {
      if (fiatType === 'BRL') {
        newFiatType = 'EUR'; // Pular diretamente para EUR
      } else if (fiatType === 'EUR') {
        newFiatType = 'ARS'; // De EUR para ARS
      } else if (fiatType === 'ARS') {
        newFiatType = 'BRL'; // Volta para BRL
      } else {
        newFiatType = 'BRL';
      }
    } else {
      // Lógica normal para outras criptomoedas
      if (fiatType === 'BRL') {
        newFiatType = 'USD';
      } else if (fiatType === 'USD') {
        newFiatType = 'EUR';
      } else if (fiatType === 'EUR') {
        newFiatType = 'ARS';
      } else {
        newFiatType = 'BRL';
      }
    }

    form.setValue('fiatType', newFiatType);
    form.setValue('fiatAmount', '');
    form.setValue('cryptoAmount', '');
  };

  const toggleCryptoType = () => {
    let newCryptoType: 'BITCOIN' | 'DEPIX' | 'USDT';

    if (fiatType === 'USD') {
      // Para USD, mantenha a lógica atual que exclui USDT
      newCryptoType = cryptoType === 'BITCOIN' ? 'DEPIX' : 'BITCOIN';
    } else if (fiatType === 'EUR') {
      // Para EUR, permita a alternância entre as três criptomoedas
      if (cryptoType === 'BITCOIN') {
        newCryptoType = 'USDT';
      } else if (cryptoType === 'USDT') {
        newCryptoType = 'DEPIX';
      } else {
        newCryptoType = 'BITCOIN';
      }
    } else {
      // Para BRL, mantenha a lógica existente
      if (cryptoType === 'BITCOIN') {
        newCryptoType = 'USDT';
      } else if (cryptoType === 'USDT') {
        newCryptoType = 'DEPIX';
      } else {
        newCryptoType = 'BITCOIN';
      }
    }

    form.setValue('cryptoType', newCryptoType);
    form.setValue('fiatAmount', '');
    form.setValue('cryptoAmount', '');
  };

  const prevValues = useRef({ cryptoType, fiatType });

  useEffect(() => {
    const fiatStr = form.getValues('fiatAmount');
    if (!fiatStr) return;

    const numericValue = parseInt(fiatStr.replace(/\D/g, ''), 10);
    if (isNaN(numericValue)) return;

    if (
      prevValues.current.cryptoType !== cryptoType ||
      prevValues.current.fiatType !== fiatType
    ) {
      calculateCryptoAmount(numericValue);
      prevValues.current = { cryptoType, fiatType };
    }
  }, [cryptoType, fiatType, calculateCryptoAmount, form]);

  return {
    t,
    form,
    handleFiatChange,
    toggleFiatType,
    toggleCryptoType,
  };
}
