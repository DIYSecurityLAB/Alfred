// useDataForm.tsx
import { useAuth } from '@/view/hooks/useAuth';
import axios from 'axios';
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

export function useDataForm() {
  // Estados do formulário
  const [network, setNetwork] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(150);
  const [isTransactionTimedOut, setIsTransactionTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [coldWallet, setColdWallet] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [cupom, setCupom] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenMethod, setIsDropdownOpenMethod] = useState(false);
  // Atualize o tipo para incluir os novos métodos:
  const [paymentMethod, setPaymentMethod] = useState<
    'PIX' | 'TICKET' | 'WISE' | 'SWIFT' | 'PAYPAL' | 'BANK_TRANSFER'
  >();
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Valores fiat e crypto
  const [fiatAmount, setfiatAmount] = useState('');
  const [fiatType, setFiatType] = useState('BRL'); // Agora armazenamos o tipo fiat (padrão BRL)
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoType, setCryptoType] = useState(''); // Valores possíveis: "BITCOIN", "USDT", "BTC_USDT", etc.
  const [acceptFees, setAcceptFees] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [alfredFeePercentage, setAlfredFeePercentage] = useState(5);

  // Obtenção de dados de autenticação
  const { user, login, register, refreshAccessToken } = useAuth();
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();
  const { t } = useTranslation();

  // Recupera valores salvos no localStorage (incluindo fiatType)
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

  // Funções de dropdown
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

  const selectPaymentMethod = (
    method: 'PIX' | 'TICKET' | 'WISE' | 'SWIFT' | 'PAYPAL' | 'BANK_TRANSFER',
  ) => {
    setPaymentMethod(method);
    setIsDropdownOpenMethod(false);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!coldWallet) {
      newErrors.coldWallet = t('buycheckout.coldWalletError');
    } else {
      // Validação específica para USDT (compra com USDT ou BTC via USDT)
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
        // Validações para compra tradicional de Bitcoin
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
          case 'Lightning':
            if (
              !/^lnbc[0-9]{1,}[a-zA-Z0-9]+$/.test(coldWallet) &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coldWallet) &&
              !/^lnurl1[a-z0-9]+$/i.test(coldWallet)
            ) {
              newErrors.coldWallet = t(
                'buycheckout.invalidColdWalletErrorLightning',
              );
            }
            break;
          default:
            newErrors.coldWallet = t('buycheckout.invalidColdWalletError');
            break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Define as redes disponíveis com base na criptomoeda selecionada.
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
    console.log('Iniciando handleProcessPayment com username:', username);
    setIsLoading(true);

    if (!user) {
      try {
        console.log('Tentando registrar usuário:', username);
        await register(username, password);
        console.log('Registro realizado com sucesso para:', username);
        await login(username, password);
        console.log('Login realizado com sucesso para:', username);
        toast.success('Login efetuado com sucesso.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (regError: any) {
        console.error('Erro no registro para usuário:', username, regError);
        if (regError.response && regError.response.status === 409) {
          console.log('Usuário já existe. Tentando login para:', username);
          try {
            await login(username, password);
            console.log('Login realizado com sucesso para:', username);
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
    } else {
      console.log('Usuário já autenticado:', user.username);
    }

    if (user) {
      try {
        console.log(
          'Tentando atualizar o token via refresh para o usuário:',
          user.username,
        );
        await refreshAccessToken(user.id, user.acessToken);
        console.log('Token atualizado.');
      } catch (refreshError) {
        console.error('Erro ao atualizar token:', refreshError);
        toast.error('Erro ao atualizar token. Faça login novamente.');
        setIsLoading(false);
        return;
      }
    }

    if (!acceptFees || !acceptTerms) {
      console.log('Termos ou taxas não aceitos.');
      toast.warning(t('buycheckout.termsAndFeesAlert'));
      setIsLoading(false);
      return;
    }

    if (!network) {
      console.log('Rede não selecionada.');
      toast.warning(t('buycheckout.networkSelectionAlert'));
      setIsLoading(false);
      return;
    }

    if (!validateFields()) {
      console.log('Falha na validação dos campos.');
      setIsLoading(false);
      return;
    }

    // Verifica o valor fiat: se fiatType não for "BRL", redireciona para o WhatsApp
    if (fiatType.toUpperCase() !== 'BRL') {
      console.log(
        `Fiat type ${fiatType} não suportado. Redirecionando para WhatsApp.`,
      );
      const whatsappNumber = '5511911872097';
      const message = `Olá! Estou Querendo comprar ${cryptoType.toUpperCase()} com ${fiatType} .
Valor: ${fiatAmount} (${fiatType})
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

    console.log('Iniciando processo de pagamento.');
    timeoutRef.current = setTimeout(
      () => {
        console.log('Timeout atingido. Transação expirada.');
        setIsTransactionTimedOut(true);
        setIsLoading(false);
      },
      4 * 60 * 1000,
    );

    // Caso o método seja SWIFT, PAYPAL ou BANK_TRANSFER, redireciona direto para o WhatsApp
    if (
      paymentMethod === 'SWIFT' ||
      paymentMethod === 'PAYPAL' ||
      paymentMethod === 'BANK_TRANSFER'
    ) {
      const whatsappNumber = '5511993439032';
      let message = '';
      if (paymentMethod === 'SWIFT') {
        message = `Olá! Aqui estão os detalhes do pedido Swift:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Swift\nTelefone: ${transactionNumber}\nCupom: ${cupom}`;
      } else if (paymentMethod === 'PAYPAL') {
        message = `Olá! Aqui estão os detalhes do pedido PayPal:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: PayPal\nTelefone: ${transactionNumber}\nCupom: ${cupom}`;
      } else if (paymentMethod === 'BANK_TRANSFER') {
        message = `Olá! Aqui estão os detalhes do pedido Transferência Bancária:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Transferência Bancária\nTelefone: ${transactionNumber}\nCupom: ${cupom}`;
      }
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappLink;
      return;
    }

    if (cryptoType.toUpperCase() === 'USDT') {
      console.log('Criptomoeda USDT detectada.');
      const whatsappNumber = '5511993439032';
      let PaymentMethodFormatted = '';
      if (paymentMethod === 'TICKET') {
        PaymentMethodFormatted = 'Boleto Bancário';
      } else if (paymentMethod === 'WISE') {
        PaymentMethodFormatted = 'Wise';
      }
      if (paymentMethod === 'TICKET' || paymentMethod === 'WISE') {
        const message = `Olá! Aqui estão os detalhes do pedido :\n\nValor ${fiatType}: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: ${PaymentMethodFormatted}\nTelefone: ${transactionNumber}\nCupom: ${cupom}`;
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappLink;
        return;
      }
    }

    const valorBRL = parseFloat(fiatAmount.replace(/\D/g, ''));
    console.log('Valor BRL calculado:', valorBRL);
    const valorToSend = valorBRL === 100000 ? 300 : valorBRL;
    console.log('Valor a enviar:', valorToSend);

    const userString = localStorage.getItem('user');
    const userObj = userString ? JSON.parse(userString) : null;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/deposit`,
        {
          valorBRL: valorToSend,
          valorBTC: parseFloat(cryptoAmount),
          paymentMethod: paymentMethod,
          network: network,
          telefone: '111111111111',
          coldWallet: coldWallet,
          cupom: cupom,
          cryptoType: cryptoType,
        },
        {
          headers: {
            Authorization: userObj?.acessToken
              ? `Bearer ${userObj.acessToken}`
              : '',
          },
        },
      );

      // Redirecionamento para WhatsApp conforme o método escolhido (para métodos que não entraram no if acima)
      if (paymentMethod === 'WISE') {
        const whatsappNumber = '5511993439032';
        const message = `Olá! Aqui estão os detalhes do pedido Wise:\n\n Valor ${fiatType}: ${fiatAmount} \n ${cryptoType}: ${cryptoAmount}\n Rede: ${network}\n Cold Wallet: ${coldWallet} \n Método: Wise\n Telefone: ${transactionNumber}\n Cupom: ${cupom}`;
        console.log(
          'Redirecionando para WhatsApp (Wise) com mensagem:',
          message,
        );
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappLink;
        return;
      }

      if (paymentMethod === 'TICKET') {
        const whatsappNumber = '5511993439032';
        const message = `Olá! Aqui estão os detalhes do pedido Boleto Bancário:\n\n Valor ${fiatType}: ${fiatAmount} \n ${cryptoType}: ${cryptoAmount}\n Rede: ${network}\n Cold Wallet: ${coldWallet} \n Método: Boleto Bancário\n Telefone: ${transactionNumber}\n Cupom: ${cupom}`;
        console.log(
          'Redirecionando para WhatsApp (TICKET) com mensagem:',
          message,
        );
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.location.href = whatsappLink;
        return;
      }

      const pixKeyResponse = response.data.response?.qrCopyPaste;
      const status = response.data.response?.status;
      const transactionId = response.data.response?.id;
      console.log(
        'pixKeyResponse:',
        pixKeyResponse,
        'status:',
        status,
        'transactionId:',
        transactionId,
      );

      if (transactionId) {
        localStorage.setItem('transactionId', transactionId);
        console.log('transactionId salvo:', transactionId);
      }
      if (pixKeyResponse) {
        localStorage.setItem('pixKey', pixKeyResponse);
        setPixKey(pixKeyResponse);
        console.log('pixKey salvo:', pixKeyResponse);
      }
      if (status) {
        localStorage.setItem('status', status);
        console.log('status salvo:', status);
      }

      setTimeLeft(150);
      setIsLoading(false);

      if (pixKeyResponse) {
        console.log('Navegando para checkoutPix.');
        navigate(ROUTES.checkoutPix.call(currentLang));
      }

      if (status === 'depix_sent' || status === 'paid') {
        toast.success(t('Pagamento confirmado'));
        console.log('Pagamento confirmado, navegando para success.');
        navigate(ROUTES.paymentAlfredStatus.success.call(currentLang));
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
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

      toast.error(t('buycheckout.paymentError'));
      setIsLoading(false);
    }
  };

  // Sincroniza o pixKey e o tempo restante com o localStorage
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
    const storedTimeLeft = localStorage.getItem('timeLeft');
    if (storedTimeLeft) {
      setTimeLeft(parseInt(storedTimeLeft, 10));
    }
  }, []);

  useEffect(() => {
    if (!pixKey) return;

    if (timeLeft <= 0) {
      setIsTransactionTimedOut(true);
      localStorage.removeItem('timeLeft');
      navigate(ROUTES.paymentAlfredStatus.failure.call(currentLang));
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        localStorage.setItem('timeLeft', newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, navigate, currentLang, pixKey]);

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
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/coupons/is-valid`,
        { code: cupom.trim().toUpperCase() },
      );
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
  };
}
