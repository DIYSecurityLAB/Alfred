// useDataForm.tsx
import {
  getMaintenanceMessage,
  isPaymentMethodInMaintenance,
} from '@/config/paymentMaintenance';
import { generateVipPixCode, isVipUser } from '@/config/vipUsers';
import { useAuth } from '@/view/hooks/useAuth';
import { useUserLevel } from '@/view/hooks/useUserLevel';
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

// Definindo um tipo para os métodos de pagamento
type PaymentMethodType =
  | 'PIX'
  | 'PIX_MAINTENANCE'
  | 'TICKET'
  | 'WISE'
  | 'SWIFT'
  | 'PAYPAL'
  | 'BANK_TRANSFER'
  | 'TED'
  | 'CASH';

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
  // Ajustando a tipagem do estado para usar o novo tipo
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>();
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
  const [isVipTransaction, setIsVipTransaction] = useState(false); // Novo estado para controlar transações VIP

  // Obtenção de dados de autenticação
  const { user, login, register, refreshAccessToken } = useAuth();
  const {
    userLevel,
    userLevelName,
    restrictions,
    // isWithinDailyLimit,
    isPaymentMethodAllowed,
  } = useUserLevel();
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

  // Verificar se o usuário atual é VIP logo ao carregar o hook
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

  const selectPaymentMethod = (method: PaymentMethodType) => {
    // Verificar se o método está em manutenção
    if (method === 'PIX' && isPaymentMethodInMaintenance('PIX')) {
      // Se o PIX estiver em manutenção, definimos como PIX_MAINTENANCE
      toast.warning(getMaintenanceMessage('PIX'));
      setPaymentMethod('PIX_MAINTENANCE');
      setIsDropdownOpenMethod(false);
      return;
    }

    // Verificar se o método é permitido para o nível do usuário
    if (!isPaymentMethodAllowed(method)) {
      if (method === 'TED' || method === 'BANK_TRANSFER') {
        toast.warning(
          `Método TED disponível apenas para nível Prata (2) ou superior. Seu nível: ${userLevelName} (${userLevel})`,
        );
      } else if (method === 'CASH') {
        toast.warning(
          `Depósito em espécie disponível apenas para nível Ouro (3) ou superior. Seu nível: ${userLevelName} (${userLevel})`,
        );
      } else {
        toast.warning(
          `Método de pagamento não disponível para seu nível atual: ${userLevelName} (${userLevel})`,
        );
      }
      return;
    }

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
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coldWallet)) {
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

    // Fluxo especial para usuários VIP - Não enviar para API, gerar QR code localmente
    if (isVipTransaction) {
      try {
        const valorBRL = parseFloat(fiatAmount.replace(/\D/g, ''));
        const pixCodeVip = generateVipPixCode(valorBRL);

        // Salvar no localStorage para usar na tela de pagamento
        localStorage.setItem('pixKey', pixCodeVip);
        localStorage.setItem('isVipTransaction', 'true');
        setPixKey(pixCodeVip);

        setTimeLeft(150);
        setIsLoading(false);

        // Navegar para tela de pagamento
        navigate(ROUTES.checkoutPix.call(currentLang));
        return;
      } catch {
        toast.error('Erro ao gerar código PIX');
        setIsLoading(false);
        return;
      }
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

    const valorBRL = parseFloat(fiatAmount.replace(/\D/g, ''));
    console.log('Valor BRL calculado:', valorBRL);

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

    const valorToSend = valorBRL; // Removida a condição especial para 100k
    console.log('Valor a enviar:', valorToSend);

    const userString = localStorage.getItem('user');
    const userObj = userString ? JSON.parse(userString) : null;

    // Verificar se o método está em manutenção - se estiver, pular a chamada à API
    if (
      paymentMethod !== undefined &&
      (paymentMethod === ('PIX_MAINTENANCE' as PaymentMethodType) ||
        isPaymentMethodInMaintenance(paymentMethod))
    ) {
      console.log('Método de pagamento em manutenção, pulando chamada à API');
      setIsLoading(false);

      // Configurar a mensagem para WhatsApp (sem ID de transação do banco)
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
      // Todos os métodos salvam no backend antes de redirecionar
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/deposit`,
        {
          valorBRL: valorToSend,
          valorBTC: parseFloat(cryptoAmount),
          // Se estiver em manutenção, enviar PIX_MAINTENANCE para rastreamento
          paymentMethod:
            paymentMethod === 'PIX_MAINTENANCE'
              ? 'PIX_MAINTENANCE'
              : paymentMethod,
          network: network,
          telefone: '111111111111',
          coldWallet: coldWallet,
          cupom: cupom,
          cryptoType: cryptoType,
          userLevel: userLevel,
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
      console.log(
        'Response:',
        response.data.response,
        'status:',
        status,
        'transactionId:',
        transactionId,
      );

      // Armazenar transactionId em todos os casos
      if (transactionId) {
        localStorage.setItem('transactionId', transactionId);
        console.log('transactionId salvo:', transactionId);
      }

      if (status) {
        localStorage.setItem('status', status);
        console.log('status salvo:', status);
      }

      // Lógica específica para PIX - Modificar para verificar se é PIX normal ou em manutenção
      if (paymentMethod === 'PIX' && !isPaymentMethodInMaintenance('PIX')) {
        // Lógica normal do PIX
        if (pixKeyResponse) {
          localStorage.setItem('pixKey', pixKeyResponse);
          setPixKey(pixKeyResponse);
          console.log('pixKey salvo:', pixKeyResponse);
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
        return;
      }

      // Se for PIX_MAINTENANCE ou qualquer outro método, redirecionamos para WhatsApp
      setIsLoading(false);
      const whatsappNumber = '5511911872097';
      let message = '';

      // Configurar a mensagem específica para cada método
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
        case 'WISE':
          message = `Olá! Aqui estão os detalhes do pedido Wise:\n\nValor ${fiatType}: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Wise\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
          break;
        case 'TICKET':
          message = `Olá! Aqui estão os detalhes do pedido Boleto Bancário:\n\nValor ${fiatType}: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: Boleto Bancário\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
          break;
        default:
          message = `Olá! Aqui estão os detalhes do meu pedido:\n\nValor BRL: ${fiatAmount}\n${cryptoType}: ${cryptoAmount}\nRede: ${network}\nCold Wallet: ${coldWallet}\nMétodo: ${paymentMethod}\nTelefone: ${transactionNumber}\nCupom: ${cupom}\nID da transação: ${transactionId}`;
      }

      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappLink;
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

      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === 'DAILY_LIMIT_EXCEEDED'
      ) {
        toast.error(`Limite diário excedido para seu nível ${userLevelName}.`);
        setIsLoading(false);
        return;
      }

      // Adicionar tratamento para o erro LIMIT_EXCEEDED
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
