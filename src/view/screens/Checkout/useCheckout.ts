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
  fiatType: 'BRL' | 'USD' | 'EUR';
  btcRate: number;
  usdtRate: number;
  usdRate: number;
  eurRate: number; // Nova taxa para Euro
};

export type WalletType = 'liquid' | 'lightning' | 'onchain';
export type PaymentMethod = 'pix' | 'wise' | 'boleto';

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
      eurRate: 0, // Valor padrão para a nova taxa do Euro
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

        form.setValue('btcRate', btcBrlRate);
        form.setValue('usdtRate', usdtBrlRate);
        form.setValue('usdRate', btcUsdRate);
        form.setValue('eurRate', eurRate);
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

  async function ValidateValues(data: Checkout) {
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

    if (data.cryptoType === 'USDT') {
      const minValue = data.fiatType === 'BRL' ? 500 : 100;
      if (numericValue < minValue) {
        toast.warning(t('checkout.min_value_error_usdt'));
        return;
      }
    } else {
      const minValue = data.fiatType === 'BRL' ? 200 : 50;
      if (numericValue < minValue) {
        toast.warning(t('checkout.min_value_error'));
        return;
      }
    }

    if (data.fiatType === 'BRL' && numericValue > 5000) {
      toast.warning(t('checkout.payment_error_above_5000'));
    }

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
