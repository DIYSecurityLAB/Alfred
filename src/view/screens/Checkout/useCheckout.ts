import { usecases } from '@/domain/usecases/UseCases';
import { ROUTES } from '@/view/routes/Routes';
import { useCurrentLang } from '@/view/utils/useCurrentLang';
import { toZonedTime } from 'date-fns-tz';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export type Checkout = {
  fiatAmount: string;
  cryptoAmount: string;
  cryptoType: 'BITCOIN' | 'USDT' | 'DEPIX';
  fiatType: 'BRL' | 'USD' | 'EUR' | 'ARS';
  btcRate: number;
  usdtRate: number;
  usdRate: number;
  eurRate: number;
  arsRate: number;
};

export type WalletType = 'liquid' | 'lightning' | 'onchain';
export type PaymentMethod = 'pix' | 'nomad' | 'swift';

export function useCheckout() {
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransactionAllowed, setIsTransactionAllowed] = useState(false);
  const [isAlfred24h] = useState(true);
  const [walletType, setWalletType] = useState<WalletType>('liquid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  const form = useForm<Checkout>({
    mode: 'onChange',
    defaultValues: {
      fiatAmount: '',
      cryptoAmount: '',
      cryptoType: 'BITCOIN',
      fiatType: 'BRL',
      btcRate: 0,
      usdtRate: 0,
      usdRate: 0,
      eurRate: 0, // Valor padrão para a taxa do Euro
      arsRate: 0, // Valor padrão para a taxa do Peso Argentino
    },
  });

  // Sempre que o formulário mudar, salva os valores relevantes no localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('fiatAmount', value.fiatAmount || '');
      localStorage.setItem('fiatType', value.fiatType || '');
      localStorage.setItem('cryptoAmount', value.cryptoAmount || '');
      localStorage.setItem('cryptoType', value.cryptoType || '');
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const fetchCryptoRates = async () => {
      try {
        const { result } = await usecases.bitcoinRate.list.execute();
        if (result.type === 'ERROR') return;

        const btcBrlRate = result.data.bitcoin.brl;
        const usdtBrlRate = result.data.tether.brl;
        const btcUsdRate = btcBrlRate / usdtBrlRate;

        // Calcular a taxa para Euro se disponível, ou estimar
        let eurRate = undefined;
        if (result.data.bitcoin.eur) {
          // Se a API fornece diretamente a taxa BTC/EUR
          eurRate = result.data.bitcoin.eur;
        } else if (result.data.euro?.brl) {
          // Se temos taxa EUR/BRL, calculamos BTC/EUR
          const eurBrlRate = result.data.euro.brl;
          eurRate = btcBrlRate / eurBrlRate;
        } else {
          // Estimamos usando uma conversão aproximada EUR/USD de 1.08
          eurRate = btcUsdRate / 1.08;
        }

        // Buscar a taxa ARS diretamente da resposta da API
        console.log('Dados brutos da API:', JSON.stringify(result.data));

        // Inicializar com um valor seguro
        let arsRateValue = 0;

        // Buscar ARS nos logs mostrados no console
        // A estrutura parece ser diferente do que estamos esperando
        // Verificar diretamente o bitcoin.ars que deveria estar nos dados
        try {
          console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
          const apiUrl = `${import.meta.env.VITE_API_URL || ''}/market/price/btc-usdt`;
          console.log('Tentando buscar dados diretamente de:', apiUrl);

          // Usar uma chamada direta para obter o valor ARS da API original
          const apiResponse = await fetch(apiUrl, {
            headers: {
              'x-api-key': import.meta.env.VITE_API_KEY || '',
            },
          });

          console.log('Status da resposta API:', apiResponse.status);

          if (apiResponse.ok) {
            const rawData = await apiResponse.json();
            console.log(
              'Resposta direta da API (estrutura completa):',
              JSON.stringify(rawData),
            );

            // Buscar o valor ARS na estrutura correta
            if (rawData && rawData.bitcoin && rawData.bitcoin.ars) {
              arsRateValue = rawData.bitcoin.ars;
              console.log('ARS encontrado diretamente na API:', arsRateValue);
            } else if (rawData && rawData.usd && rawData.usd.ars) {
              // Alternativa: calcular via USD
              const usdArsRate = rawData.usd.ars;
              arsRateValue = btcUsdRate * usdArsRate;
              console.log('ARS calculado via USD da API:', arsRateValue);
            }

            // Verificar outros lugares possíveis onde o valor ARS possa estar
            console.log(
              'Verificando todas as propriedades da resposta para "ars":',
            );
            Object.keys(rawData).forEach((key) => {
              const value = rawData[key];
              if (typeof value === 'object' && value !== null) {
                Object.keys(value).forEach((subKey) => {
                  if (subKey === 'ars') {
                    console.log(
                      `Encontrado ars em rawData.${key}.${subKey} =`,
                      value[subKey],
                    );
                    // Se ainda não temos um valor ARS, use este
                    if (!arsRateValue) {
                      arsRateValue = value[subKey];
                    }
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error('Erro ao buscar ARS diretamente:', error);
        }

        form.setValue('btcRate', btcBrlRate);
        form.setValue('usdtRate', usdtBrlRate);
        form.setValue('usdRate', btcUsdRate);
        form.setValue('eurRate', eurRate || 0);

        // Garantir que o valor ARS seja válido e maior que zero antes de usar
        if (arsRateValue && arsRateValue > 0) {
          console.log('Definindo taxa ARS no formulário:', arsRateValue);
          form.setValue('arsRate', arsRateValue);
        } else {
          console.warn(
            'Taxa ARS inválida ou zero, usando valor fixo temporário para evitar erros',
          );

          // Usar um valor razoável para ARS baseado na cotação atual do BTC em BRL
          // 1 USD ≈ 1350 ARS (aproximação da cotação atual)
          // Taxa aproximada do peso argentino
          const usdToBrlRate = usdtBrlRate; // Usamos a taxa USDT/BRL como aproximação de USD/BRL
          const estimatedUsdToArsRate = 1350; // Aproximação da cotação USD/ARS
          const brlToArsRate = estimatedUsdToArsRate / usdToBrlRate;
          const tempArsRate = btcBrlRate * brlToArsRate;

          console.log('Cálculo de fallback para taxa ARS:', {
            btcBrlRate,
            usdToBrlRate,
            estimatedUsdToArsRate,
            brlToArsRate,
            tempArsRate,
          });

          form.setValue('arsRate', tempArsRate);
        }
      } catch (error) {
        console.error('Erro ao buscar taxas:', error);
        toast.error(t('checkout.rates_error'));
      }
    };
    fetchCryptoRates();

    const interval = setInterval(fetchCryptoRates, 300000);
    return () => clearInterval(interval);
  }, [form, t]);

  useEffect(() => {
    const timeZone = 'America/Sao_Paulo';
    const now = new Date();
    const zonedTime = toZonedTime(now, timeZone);
    const currentHour = zonedTime.getHours();

    if (isAlfred24h || (currentHour >= 8 && currentHour < 22)) {
      setIsTransactionAllowed(true);
    } else {
      setIsTransactionAllowed(false);
      if (!isAlfred24h) {
        toast.info(t('checkout.outside_hours'));
      }
    }
  }, [isAlfred24h, t]);

  async function ValidateValues(data: Checkout, selectedNetwork?: string) {
    if (!isTransactionAllowed) {
      toast.error(t('checkout.transaction_error'));
      return;
    }

    const numericValue = parseInt(
      form.getValues('fiatAmount').replace(/\D/g, ''),
      10,
    );

    if (!numericValue || numericValue <= 0) {
      toast.warning(t('checkout.min_value_error'));
      return;
    }

    if (data.cryptoType === 'USDT' && data.fiatType === 'USD') {
      toast.warning(t('checkout.usdt_to_usd_error'));
      return;
    }

    // Validação específica para Lightning Network
    if (selectedNetwork === 'Lightning' && data.fiatType === 'BRL') {
      if (numericValue < 25) {
        toast.warning('O valor mínimo para Lightning é R$ 25');
        return;
      }
    }

    // Pular validação de valor mínimo para ARS
    if (data.fiatType !== 'ARS') {
      if (data.cryptoType === 'USDT') {
        let minValue: number;
        if (data.fiatType === 'BRL') {
          minValue = 500;
        } else {
          minValue = 100;
        }

        if (numericValue < minValue) {
          toast.warning(t('checkout.min_value_error_usdt'));
          return;
        }
      } else {
        let minValue: number;
        if (data.fiatType === 'BRL') {
          minValue = 25;
        } else {
          minValue = 50;
        }

        if (numericValue < minValue) {
          toast.warning(t('checkout.min_value_error'));
          return;
        }
      }
    }

    // Apenas exibe alerta para BRL acima de 5000
    if (data.fiatType === 'BRL' && numericValue > 5000) {
      toast.warning(t('checkout.payment_error_above_5000'));
    }
    // Removendo verificações de limite máximo para ARS

    localStorage.setItem('checkoutData', JSON.stringify(data));
    navigate(ROUTES.buyCheckout.call(currentLang));
  }

  return {
    steps: {
      current: currentStep,
      next: () => setCurrentStep(currentStep + 1),
      prev: () => setCurrentStep(currentStep - 1),
    },
    form,
    ValidateValues,
    isTransactionAllowed,
    t,
    walletType,
    setWalletType,
    paymentMethod,
    setPaymentMethod,
    isAlfred24h,
  };
}
