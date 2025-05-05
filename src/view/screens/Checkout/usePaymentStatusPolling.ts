import { ROUTES } from '@/view/routes/Routes';
import { useCurrentLang } from '@/view/utils/useCurrentLang';
import axios from 'axios';
import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const usePaymentStatusPolling = () => {
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();
  const [isLoadingPayment, setIsLoadingPayment] = useState<boolean>(false);
  const [isVipTransaction, setIsVipTransaction] = useState<boolean>(false);

  const pollingInterval = 20000;
  const maxPollingTime = 300000;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number | null>(null);

  // Verificar se é uma transação VIP quando o hook é inicializado
  useEffect(() => {
    const vipFlag = localStorage.getItem('isVipTransaction');
    if (vipFlag === 'true') {
      setIsVipTransaction(true);
    }
  }, []);

  const verifyPaymentStatus = useCallback(async () => {
    // Para usuários VIP, não verificamos o status
    if (isVipTransaction) {
      return;
    }

    // Fluxo normal para usuários não-VIP
    const transaction = localStorage.getItem('transactionId');
    if (!transaction) {
      toast.error(t('buycheckout.transactionNumberError'));
      return;
    }
    setIsLoadingPayment(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/deposit-status?transactionId=${transaction}`,
      );
      const status = response.data.status;

      if (status === 'paid') {
        navigate(ROUTES.paymentAlfredStatus.success.call(currentLang));
        clearInterval(timerRef.current!);
      }
      if (status === 'review') {
        navigate(ROUTES.paymentAlfredStatus.review.call(currentLang));
        clearInterval(timerRef.current!);
      } else {
        toast.warn(t('buycheckout.paymentNotConfirmed'));
      }
    } catch (error) {
      console.error('Erro ao verificar o status do pagamento:', error);
      toast.warn(t('buycheckout.paymentNotConfirmed'));
    } finally {
      setIsLoadingPayment(false);
    }
  }, [currentLang, navigate, isVipTransaction]);

  useEffect(() => {
    // Para usuários VIP, não precisamos fazer polling no backend
    if (isVipTransaction) {
      return;
    }

    startTime.current = Date.now();

    timerRef.current = setInterval(() => {
      if (Date.now() - startTime.current! > maxPollingTime) {
        clearInterval(timerRef.current!);
        toast.warn(t('buycheckout.paymentTimeoutExceeded'));
        return;
      }
      verifyPaymentStatus();
    }, pollingInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [verifyPaymentStatus, isVipTransaction]);

  return {
    isLoadingPayment,
    verifyPaymentStatus,
    isVipTransaction,
  };
};
