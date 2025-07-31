import {
  getMaintenanceMessage,
  isPaymentMethodInMaintenance,
} from '@/config/paymentMaintenance';
import { generateVipPixCode, isVipUser } from '@/config/vipUsers';
import { axiosInstance } from '@/infrastructure/api/axiosInstance';
import { useAuth } from '@/view/hooks/useAuth';
import { useUserLevel } from '@/view/hooks/useUserLevel';
import axios from 'axios';
import { bech32 } from 'bech32';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Onchain from '../../../assets/bitcoin.svg';
import Liquid from '../../../assets/lbtc.svg';
import Lightning from '../../../assets/lightning.svg';
import Polygon from '../../../assets/polygon.png';
import Tron from '../../../assets/tron.svg';
import { ROUTES } from '../../../routes/Routes';
import { useCurrentLang } from '../../../utils/useCurrentLang';

type PaymentMethodType =
  | 'PIX'
  | 'PIX_MAINTENANCE'
  | 'NOMAD'
  | 'SWIFT'
  | 'PAYPAL'
  | 'BANK_TRANSFER'
  | 'TED'
  | 'CASH'
  | 'TICKET';

export function useDataForm() {
  const [network, setNetwork] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTransactionTimedOut, setIsTransactionTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [coldWallet, setColdWallet] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [cupom, setCupom] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenMethod, setIsDropdownOpenMethod] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>();
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fiatAmount, setfiatAmount] = useState('');
  const [fiatType, setFiatType] = useState('BRL');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('');
  const [acceptFees, setAcceptFees] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [alfredFeePercentage, setAlfredFeePercentage] = useState(0);
  const [isVipTransaction, setIsVipTransaction] = useState(false);

  const { user, login, register, refreshAccessToken } = useAuth();
  const { userLevel, userLevelName, restrictions, isPaymentMethodAllowed } =
    useUserLevel();
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();
  const { t } = useTranslation();

  useEffect(() => {
    const storedBrl = localStorage.getItem('fiatAmount');
    const storedFiatType = localStorage.getItem('fiatType');
    const storedCrypto = localStorage.getItem('cryptoAmount');
    const storedCryptoType = localStorage.getItem('cryptoType');
    if (storedBrl) setfiatAmount(storedBrl);
    if (storedFiatType) setFiatType(storedFiatType);
    if (storedCrypto) setCryptoAmount(storedCrypto);
    if (storedCryptoType) setCryptoType(storedCryptoType);
  }, []);

  useEffect(() => {
    const checkVipStatus = async () => {
      try {
        const isVip = await isVipUser();
        if (isVip) {
          setIsVipTransaction(true);
        }
      } catch {
        console.error('[useDataForm] Erro ao verificar status VIP.');
      }
    };

    checkVipStatus();
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const selectNetwork = (networkName: string) => {
    setNetwork(networkName);
    setIsDropdownOpen(false);
  };

  const toggleDropdownMethod = () => {
    setIsDropdownOpenMethod((prevState) => !prevState);
  };

  const selectPaymentMethod = (method: PaymentMethodType) => {
    if (method === 'PIX' && isPaymentMethodInMaintenance('PIX')) {
      toast.warning(getMaintenanceMessage('PIX'));
      setPaymentMethod('PIX_MAINTENANCE');
      setIsDropdownOpenMethod(false);
      return;
    }

    if (!isPaymentMethodAllowed(method)) {
      if (method === 'TED' || method === 'BANK_TRANSFER') {
        toast.warning(t('buycheckout.paymentLevelRestriction.ted'));
      } else if (method === 'TICKET') {
        toast.warning(t('buycheckout.paymentLevelRestriction.boleto'));
      } else if (method === 'CASH') {
        toast.warning(t('buycheckout.paymentLevelRestriction.cash'));
      } else {
        toast.warning(t('buycheckout.paymentLevelRestriction.general'));
      }
      return;
    }

    setPaymentMethod(method);
    setIsDropdownOpenMethod(false);
  };

  function decodeLnurl(lnurl: string): string {
    try {
      const words = bech32.decode(lnurl, 1023);
      const data = bech32.fromWords(words.words);
      const url = Buffer.from(data).toString();

      return url.startsWith('http') ? url : `https://${url}`;
    } catch (error) {
      console.error('Erro ao decodificar LNURL:', error);
      throw new Error('LNURL inválido');
    }
  }

  async function validateLightningWallet(
    coldWallet: string,
    t: (key: string) => string,
  ): Promise<string | null> {
    if (/^lnbc[0-9]{1,}[a-zA-Z0-9]+$/.test(coldWallet)) {
      return t('buycheckout.lightningInvoiceNotSupported');
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coldWallet)) {
      if (coldWallet.length < 5 || !coldWallet.includes('.')) {
        return t('buycheckout.invalidEmailLightning');
      }
      return null;
    }

    if (/^lnurl1[a-z0-9]+$/i.test(coldWallet)) {
      try {
        const decodedUrl = decodeLnurl(coldWallet);

        const response = await fetch(decodedUrl);

        if (!response.ok) {
          return t('buycheckout.invalidLnurlResponse');
        }

        const lnurlData = await response.json();

        if (
          lnurlData.tag === 'payRequest' &&
          lnurlData.minSendable === lnurlData.maxSendable &&
          lnurlData.minSendable > 0
        ) {
          return t('buycheckout.fixedAmountLnurlNotSupported');
        }

        return null;
      } catch (error) {
        console.error('Erro na validação de LNURL:', error);
        return t('buycheckout.invalidLnurl');
      }
    }

    return t('buycheckout.invalidColdWalletErrorLightning');
  }

  const validateFields = async () => {
    const newErrors: Record<string, string> = {};

    if (!coldWallet) {
      newErrors.coldWallet = t('buycheckout.coldWalletError');
    } else {
      if (
        cryptoType.toUpperCase() === 'USDT' ||
        cryptoType.toUpperCase() === 'BTC_USDT'
      ) {
        if (network === 'Liquid') {
          if (
            !/^VJL[a-km-zA-HJ-NP-Z0-9]{43,}$/i.test(coldWallet) &&
            !/^ex1[a-z0-9]{39,59}$/i.test(coldWallet) &&
            !/^CT[a-km-zA-HJ-NP-Z0-9]{40,64}$/i.test(coldWallet) &&
            !/^lq1[a-z0-9]{40,100}$/i.test(coldWallet)
          ) {
            newErrors.coldWallet = t(
              'buycheckout.invalidColdWalletErrorLiquid',
            );
          }
        } else if (network === 'Polygon') {
          if (!/^0x[a-fA-F0-9]{40}$/.test(coldWallet)) {
            newErrors.coldWallet = t(
              'buycheckout.invalidColdWalletErrorPolygon',
            );
          }
        } else if (network === 'Tron') {
          if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(coldWallet)) {
            newErrors.coldWallet = t('buycheckout.invalidColdWalletErrorTron');
          }
        } else {
          newErrors.coldWallet = t('buycheckout.invalidNetworkForUSDT');
        }
      } else {
        switch (network) {
          case 'Onchain':
            if (
              !/^(1|3)[a-km-zA-HJ-NP-Z0-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(
                coldWallet,
              )
            ) {
              newErrors.coldWallet = t(
                'buycheckout.invalidColdWalletErrorOnchain',
              );
            }
            break;
          case 'Liquid':
            if (
              !/^VJL[a-km-zA-HJ-NP-Z0-9]{43,}$/i.test(coldWallet) &&
              !/^ex1[a-z0-9]{39,59}$/i.test(coldWallet) &&
              !/^CT[a-km-zA-HJ-NP-Z0-9]{40,64}$/i.test(coldWallet) &&
              !/^lq1[a-z0-9]{40,100}$/i.test(coldWallet)
            ) {
              newErrors.coldWallet = t(
                'buycheckout.invalidColdWalletErrorLiquid',
              );
            }
            break;
          case 'Lightning': {
            const lightningError = await validateLightningWallet(coldWallet, t);
            if (lightningError) {
              newErrors.coldWallet = lightningError;
            }
            break;
          }
          default:
            newErrors.coldWallet = t('buycheckout.invalidColdWalletError');
            break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const networks = (() => {
    const crypto = cryptoType.toUpperCase();
    if (crypto === 'DEPIX') {
      return [{ name: 'Liquid', icon: Liquid }];
    }
    if (crypto === 'USDT' || crypto === 'BTC_USDT') {
      return [
        { name: 'Liquid', icon: Liquid },
        { name: 'Polygon', icon: Polygon },
        { name: 'Tron', icon: Tron },
      ];
    }
    return [
      { name: 'Onchain', icon: Onchain },
      { name: 'Liquid', icon: Liquid },
      { name: 'Lightning', icon: Lightning },
    ];
  })();

  const handleProcessPayment = async (username: string, password: string) => {
    localStorage.removeItem('timeLeft');
    setIsLoading(true);

    if (!user) {
      try {
        await register(username, password);

        await login(username, password);

        toast.success('Login efetuado com sucesso.');
      } catch (regError: unknown) {
        console.error('Erro no registro para usuário:', username, regError);
        if (
          axios.isAxiosError(regError) &&
          regError.response &&
          regError.response.status === 409
        ) {
          try {
            await login(username, password);

            toast.success('Login efetuado com sucesso.');
          } catch (loginError) {
            console.error('Erro no login:', loginError);
            toast.error(
              'Erro no login. Confira as credenciais. Em caso de primeira compra, altere o nome de usuário do registro',
            );
            setIsLoading(false);
            return;
          }
        } else {
          console.error('Erro no registro:', regError);
          toast.error('Erro no registro. Contate o suporte.');
          setIsLoading(false);
          return;
        }
      }
    }

    if (user) {
      try {
        await refreshAccessToken(user.id, user.acessToken);
      } catch (refreshError) {
        console.error('Erro ao atualizar token:', refreshError);
        toast.error('Erro ao atualizar token. Faça login novamente.');
        setIsLoading(false);
        return;
      }
    }

    if (!acceptFees || !acceptTerms) {
      toast.warning(t('buycheckout.termsAndFeesAlert'));
      setIsLoading(false);
      return;
    }

    if (!network) {
      toast.warning(t('buycheckout.networkSelectionAlert'));
      setIsLoading(false);
      return;
    }

    const valorBRL = parseFloat(fiatAmount.replace(/\D/g, ''));

    if (network === 'Lightning' && fiatType === 'BRL' && valorBRL < 25) {
      toast.warning('O valor mínimo para Lightning é R$ 25');
      setIsLoading(false);
      return;
    }

    if (fiatType === 'BRL' && valorBRL < 200 && network !== 'Lightning') {
      toast.warning(
        'Para valores abaixo de R$ 200, apenas a rede Lightning está disponível',
      );
      setIsLoading(false);
      return;
    }

    if (!(await validateFields())) {
      setIsLoading(false);
      return;
    }

    if (fiatType.toUpperCase() !== 'BRL') {
      const whatsappNumber = '5511911872097';
      const valorFormatado =
        fiatType === 'ARS' && fiatAmount.includes('ARS')
          ? fiatAmount
          : `${fiatAmount} (${fiatType})`;
      const message = `Olá! Estou Querendo comprar ${cryptoType.toUpperCase()} com ${fiatType} .
Valor: ${valorFormatado}
Crypto (${cryptoType}): ${cryptoAmount}
Rede: ${network}
Cold Wallet: ${coldWallet}
Telefone: ${transactionNumber}
Cupom: ${cupom}`;
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappLink;
      setIsLoading(false);
      return;
    }

    if (isVipTransaction) {
      try {
        const pixCodeVip = generateVipPixCode(valorBRL);

        localStorage.setItem('pixKey', pixCodeVip);
        localStorage.setItem('isVipTransaction', 'true');
        setPixKey(pixCodeVip);

        setTimeLeft(210);
        setIsLoading(false);

        navigate(ROUTES.checkoutPix.call(currentLang));
        return;
      } catch {
        toast.error('Erro ao gerar código PIX');
        setIsLoading(false);
        return;
      }
    }

    timeoutRef.current = setTimeout(
      () => {
        setIsTransactionTimedOut(true);
        setIsLoading(false);
      },
      4 * 60 * 1000,
    );

    // // Verificar se o valor está dentro do limite diário do usuário
    // // Agora apenas alertamos, mas permitimos prosseguir
    // if (!isWithinDailyLimit(valorBRL)) {
    //   toast.warning(
    //     `Atenção: Valor excede seu limite diário como ${userLevelName} (${restrictions.dailyLimit.toLocaleString(
    //       'pt-BR',
    //       {
    //         style: 'currency',
    //         currency: 'BRL',
    //       },
    //     )}).`,
    //   );
    // }

    const valorToSend = valorBRL;

    const userString = localStorage.getItem('user');
    const userObj = userString ? JSON.parse(userString) : null;

    if (
      paymentMethod !== undefined &&
      (paymentMethod === ('PIX_MAINTENANCE' as PaymentMethodType) ||
        isPaymentMethodInMaintenance(paymentMethod))
    ) {
      setIsLoading(false);

      const whatsappNumber = '5511911872097';
      let message = '';

      if (paymentMethod === ('PIX_MAINTENANCE' as PaymentMethodType)) {
        message = `Olá! Gostaria de comprar via PIX (atualmente em manutenção):\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: PIX\nUsuário: ${username}\nNível: ${userLevelName} (${userLevel})\nCupom: ${cupom || 'Nenhum'} `;
      } else {
        message = `Olá! Gostaria de comprar (sistema em manutenção):\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: ${paymentMethod}\nUsuário: ${username}\nNível: ${userLevelName} (${userLevel})\nCupom: ${cupom || 'Nenhum'} `;
      }

      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappLink;
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/deposit`,
        {
          valorBRL: valorToSend,
          valorBTC: parseFloat(cryptoAmount),

          paymentMethod:
            paymentMethod === 'PIX_MAINTENANCE'
              ? 'PIX_MAINTENANCE'
              : paymentMethod,
          network: network,
          coldWallet: coldWallet,
          cupom: cupom,
          cryptoType: cryptoType,
          amountType: 'BRL',
        },
        {
          headers: {
            Authorization: userObj?.acessToken
              ? `Bearer ${userObj.acessToken}`
              : '',
          },
        },
      );

      const pixKeyResponse = response.data.response?.qrCopyPaste;
      const status = response.data.response?.status;
      const transactionId = response.data.response?.id;
      const depositId = response.data.depositId;

      // Armazenar transactionId em todos os casos
      if (transactionId) {
        localStorage.setItem('transactionId', transactionId);
      }

      if (status) {
        localStorage.setItem('status', status);
      }

      if (paymentMethod === 'PIX' && !isPaymentMethodInMaintenance('PIX')) {
        if (pixKeyResponse) {
          localStorage.setItem('pixKey', pixKeyResponse);
          setPixKey(pixKeyResponse);
        }

        setTimeLeft(210);
        setIsLoading(false);

        const shouldRedirectToWhatsApp = localStorage.getItem(
          'redirectToWhatsAppAfterPayment',
        );
        const valorNumerico = parseFloat(fiatAmount.replace(/\D/g, ''));

        if (shouldRedirectToWhatsApp === 'true' && valorNumerico >= 5000) {
          localStorage.removeItem('redirectToWhatsAppAfterPayment');

          const message = `
Estou comprando mais de 5 mil reais no Alfred e preciso do formulário de Validação para Transações Anônimas.

- Valor: ${fiatType === 'ARS' && fiatAmount.includes('ARS') ? fiatAmount : `${fiatAmount} (${fiatType})`}
- Valor Crypto: ${cryptoAmount} ${cryptoType.toUpperCase()}
- Rede: ${network}
- Endereço da carteira: ${coldWallet}
- Método de pagamento: PIX
- ID da transação: ${depositId}
          `;

          const whatsappURL = `https://wa.me/5511911872097?text=${encodeURIComponent(message)}`;
          window.open(whatsappURL, '_blank');
        }

        if (pixKeyResponse) {
          navigate(ROUTES.checkoutPix.call(currentLang));
        }

        if (status === 'depix_sent' || status === 'paid') {
          toast.success(t('Pagamento confirmado'));

          navigate(ROUTES.paymentAlfredStatus.success.call(currentLang));
        }
        return;
      }

      setIsLoading(false);
      const whatsappNumber = '5511911872097';
      let message = '';

      switch (paymentMethod) {
        case 'PIX_MAINTENANCE' as PaymentMethodType:
          message = `Olá! Gostaria de comprar via PIX (atualmente em manutenção):\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: PIX\nUsuário: ${username}\nNível: ${userLevelName} (${userLevel})\nTelefone: ${transactionNumber}\nCupom: ${cupom || 'Nenhum'}\nID da transação: ${transactionId}`;
          break;
        case 'SWIFT':
          message = `Olá! Aqui estão os detalhes do pedido Swift:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Swift\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
          break;
        case 'PAYPAL':
          message = `Olá! Aqui estão os detalhes do pedido PayPal:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: PayPal\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
          break;
        case 'BANK_TRANSFER':
          message = `Olá! Aqui estão os detalhes do pedido Transferência Bancária:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Transferência Bancária\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
          break;
        case 'TED':
          message = `Olá! Sou usuário nível ${userLevelName} e gostaria de realizar uma compra via TED:\n\nValor: ${fiatAmount}\nCripto: ${cryptoAmount} ${cryptoType}\nRede: ${network}\nCarteira: ${coldWallet}\nTelefone: ${transactionNumber}\nCupom: ${cupom || 'Nenhum'}\nID da transação: ${transactionId}\n\nPor favor, me envie as instruções para transferência.`;
          break;
        case 'CASH':
          message = `Olá! Sou usuário nível ${userLevelName} e gostaria de fazer um depósito em espécie:\n\nValor: ${fiatAmount}\nCripto: ${cryptoAmount} ${cryptoType}\nRede: ${network}\nCarteira: ${coldWallet}\nTelefone: ${transactionNumber}\nCupom: ${cupom || 'Nenhum'}\nID da transação: ${transactionId}\n\nPor favor, me envie as instruções para o depósito em espécie.`;
          break;
        case 'TICKET':
          message = `Olá! Sou usuário nível ${userLevelName} e gostaria de realizar uma compra via Boleto Bancário:\n\nValor: ${fiatAmount}\nCripto: ${cryptoAmount} ${cryptoType}\nRede: ${network}\nCarteira: ${coldWallet}\nTelefone: ${transactionNumber}\nCupom: ${cupom || 'Nenhum'}\nID da transação: ${transactionId}\n\nPor favor, me envie as instruções para pagamento via boleto.`;
          break;
        case 'NOMAD':
          message = `Olá! Aqui estão os detalhes do pedido Nomad:\n\nValor ${fiatType}: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Nomad\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
          break;
        default:
          message = `Olá! Aqui estão os detalhes do meu pedido:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: ${paymentMethod}\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
      }

      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappLink;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'FIRST_PURCHASE'
      ) {
        toast.error('Na primeira compra, o valor deve ser menor que R$500.');
        setIsLoading(false);
        return;
      }

      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'BLOCKED'
      ) {
        const whatsappNumber = '5511911872097';
        const message = `Olá, estou recebendo o erro 171. Como posso resolver isso?`;
        toast.error('Erro 171. Entre em contato pelo WhatsApp.');
        setIsLoading(false);
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappLink;
        return;
      }

      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'LIMIT_EXCEEDED_COUPON'
      ) {
        toast.error(`Você usou o cupom "ZERO" mais de 1 vez.`);
      }
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'DAILY_LIMIT_EXCEEDED'
      ) {
        toast.error(`Limite diário excedido para seu nível ${userLevelName}.`);
        setIsLoading(false);
        return;
      }
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'TIME_LIMIT'
      ) {
        toast.error(`Você precisa aguardar 20 minutos entre transações.`);
      }

      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'LIMIT_EXCEEDED'
      ) {
        toast.error(
          `Limite excedido para seu nível ${userLevelName}. Por favor, aguarde a validação do seu perfil ou entre em contato com o suporte para aumentar seus limites.`,
        );
      }

      toast.error(t('buycheckout.paymentError'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pixKey) {
      localStorage.setItem('pixKey', pixKey);
    }
  }, [pixKey]);

  useEffect(() => {
    const storedPixKey = localStorage.getItem('pixKey');
    if (storedPixKey) {
      setPixKey(storedPixKey);
    }
  }, []);

  const copyToClipboard = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      toast.success(t('buycheckout.pixKeyCopied'));
    }
  };

  useEffect(() => {
    const isOnCheckoutPixPage = window.location.pathname.includes('/pix');

    if (!isOnCheckoutPixPage) {
      return;
    }

    if (timeLeft !== null && timeLeft <= 0) {
      setIsTransactionTimedOut(true);
      localStorage.removeItem('timeLeft');
      navigate(ROUTES.paymentAlfredStatus.failure.call(currentLang));
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prevTime) => {
        const newTime = (prevTime ?? 0) - 1;
        localStorage.setItem('timeLeft', newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, navigate, currentLang]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      localStorage.removeItem('timeLeft');
    };
  }, []);

  const checkCouponValidity = async () => {
    if (!cupom.trim()) {
      setErrors((prev) => ({ ...prev, cupom: '' }));
      return;
    }

    try {
      setIsLoading(true);

      const response = await axiosInstance.post(`coupons/is-valid`, {
        code: cupom.trim().toUpperCase(),
      });
      const coupon = response.data;

      if (!coupon.isActive) {
        setErrors((prev) => ({
          ...prev,
          cupom: t('buycheckout.couponInactive'),
        }));
        setCupom('');
        toast.error(t('buycheckout.couponInactive'));
        return;
      }

      // Remova a verificação do valorBRL para atualizar sempre a taxa do cupom
      if (coupon.discountType === 'percentage') {
        setAlfredFeePercentage(coupon.discountValue);
      }

      setCupom(cupom.toUpperCase());
      setErrors((prev) => ({ ...prev, cupom: '' }));
      toast.success(t('buycheckout.couponValid'));
    } catch (error) {
      console.error('Erro ao verificar o cupom:', error);

      // Verificação específica para erro de limite de uso do cupom excedido
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'LIMIT_EXCEEDED_COUPON'
      ) {
        setErrors((prev) => ({
          ...prev,
          cupom:
            error.response?.data?.message ||
            t('Você usou o cupom "ZERO" mais de 1 vez.'),
        }));
        setCupom('');
        toast.error(
          error.response?.data?.message ||
            t('Você usou o cupom "ZERO" mais de 1 vez.'),
        );
        return;
      }

      setErrors((prev) => ({
        ...prev,
        cupom: t('buycheckout.couponCheckError'),
      }));
      setCupom('');
      toast.error(t('buycheckout.couponCheckError'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    network,
    timeLeft,
    isTransactionTimedOut,
    coldWallet,
    transactionNumber,
    cupom,
    isDropdownOpen,
    isDropdownOpenMethod,
    paymentMethod,
    pixKey,
    isLoading,
    setIsLoading,
    errors,
    fiatAmount,
    fiatType,
    cryptoAmount,
    cryptoType,
    acceptFees,
    acceptTerms,
    networks,
    currentLang,
    alfredFeePercentage,
    userLevel,
    userLevelName,
    restrictions,
    isPaymentMethodAllowed,
    toggleDropdown,
    selectNetwork,
    toggleDropdownMethod,
    selectPaymentMethod,
    handleProcessPayment,
    copyToClipboard,
    checkCouponValidity,
    setColdWallet,
    setAcceptTerms,
    setAcceptFees,
    setCupom,
    setTransactionNumber,
    setPaymentMethod,
    setfiatAmount,
    setFiatType,
    setCryptoAmount,
    setCryptoType,
    validateFields,
    isPaymentMethodInMaintenance,
    isVipTransaction,
  };
}
