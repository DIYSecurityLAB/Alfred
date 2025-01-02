import classNames from 'classnames';
import { QRCodeSVG } from 'qrcode.react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { CiCreditCard1 } from 'react-icons/ci';
import { FaBarcode, FaPix } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import Liquid from '../../assets/lbtc.svg';
// import Lightning from '../../assets/lightning.svg';
import axios from 'axios';
import Onchain from '../../assets/bitcoin.svg';
import { BackgroundAnimatedProduct } from '../../components/BackgroundAnimatedProduct';
import WhatsAppButton from '../../components/buttonWhatsApp';
import { Loader } from '../../components/Loader';
import { ROUTES } from '../../routes/Routes';
import { useCurrentLang } from '../../utils/useCurrentLang';
import HeaderAlfred from './HeaderAlfred';

export default function BuyCheckout() {
  const [network, setNetwork] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(240);
  const [isTransactionTimedOut, setIsTransactionTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [coldWallet, setColdWallet] = useState<string>('');
  const [transactionNumber, setTransactionNumber] = useState<string>('');
  const [cupom, setCupom] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDropdownOpenMethod, setIsDropdownOpenMethod] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    'PIX' | 'Cartão de Crédito' | 'Boleto Bancário'
  >('PIX');
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brlAmount, setBrlAmount] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [, setIsWaitingForPayment] = useState(false);
  const [acceptFees, setAcceptFees] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();
  // const cupomValue = cupom.toUpperCase;

  useEffect(() => {
    const storedBrl = localStorage.getItem('brlAmount');
    const storedBtc = localStorage.getItem('btcAmount');
    if (storedBrl && storedBtc) {
      setBrlAmount(storedBrl);
      setBtcAmount(storedBtc);
    }
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

  const selectPaymentMethod = (method: 'PIX') => {
    setPaymentMethod(method);
    setIsDropdownOpenMethod(false);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!coldWallet) {
      newErrors.coldWallet = 'O endereço da carteira não pode estar vazio.';
    } else if (
      !/^(1|3)[a-km-zA-HJ-NP-Z0-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(
        coldWallet,
      )
    ) {
      newErrors.coldWallet = 'Endereço da carteira inválido.';
    }

    if (!transactionNumber) {
      newErrors.transactionNumber = 'O número de telefone é obrigatório.';
    } else if (!/^\d{9,15}$/.test(transactionNumber)) {
      newErrors.transactionNumber =
        'Insira um número de telefone válido (9 a 15 dígitos).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const networks = [
    // { name: 'Lightning', icon: Lightning },
    { name: 'Onchain', icon: Onchain },
    { name: 'Liquid', icon: Liquid },
  ];

  const handleProcessPayment = async () => {
    if (!acceptFees || !acceptTerms) {
      alert('Você precisa aceitar as taxas e os termos de uso.');
      return;
    }
    if (!network) {
      alert('Você precisa selecionar uma rede de Bitcoin antes de prosseguir.');
      return;
    }

    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(
      () => {
        setIsTransactionTimedOut(true);
        setIsLoading(false);
      },
      4 * 60 * 1000,
    );

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/create-order`,
        {
          realValue: parseFloat(brlAmount.replace(/\D/g, '')),
          bitcoinValue: parseFloat(btcAmount),
          paymentMethod: 'PIX',
          network: network,
          phone: transactionNumber,
          coldWalletId: coldWallet,
          cupom: cupom,
        },
      );
      if (isTransactionTimedOut) return;

      const pixKey = response.data.order.pixKey;
      setPixKey(pixKey);

      setTimeLeft(240);

      setIsLoading(false);

      verifyPaymentStatus(response.data.order.id);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar o pagamento.');
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      alert('Chave PIX copiada para a área de transferência!');
    }
  };

  const verifyPaymentStatus = async (orderId: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/confirm-payment`,
        { orderId },
      );

      if (response.data === 'confirmed') {
        navigate(ROUTES.paymentAlfredStatus.success.call(currentLang));
      } else {
        console.warn('Pagamento ainda não confirmado. Tente novamente.');
        setIsWaitingForPayment(false);
      }
    } catch (error) {
      console.error('Erro ao verificar o status do pagamento:', error);
      setIsWaitingForPayment(false);
    }
  };

  useEffect(() => {
    if (!pixKey) {
      console.log(pixKey);
      return;
    }
    if (timeLeft <= 0) {
      setIsTransactionTimedOut(true);
      navigate(ROUTES.paymentAlfredStatus.failure.call(currentLang));
      return;
    }

    const timer = setTimeout(
      () => setTimeLeft((prevTime) => prevTime - 1),
      1000,
    );

    return () => clearTimeout(timer);
  }, [timeLeft, navigate, currentLang, pixKey]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  const checkCouponValidity = async () => {
    try {
      setIsLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/coupons/is-valid`,
        { code: cupom.trim() },
      );

      const coupon = response.data;

      if (!coupon.isActive) {
        alert('O cupom não está ativo.');
        return;
      }

      const currentDate = new Date();
      const validUntilDate = new Date(coupon.validUntil);
      if (currentDate > validUntilDate) {
        alert('O cupom expirou.');
        return;
      }

      if (coupon.usedCount >= coupon.usageLimit) {
        alert('O cupom atingiu o limite de uso.');
        return;
      }

      alert('O cupom é válido!');
    } catch (error) {
      console.error('Erro ao verificar o cupom:', error);
      alert('Houve um erro ao verificar o cupom.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <BackgroundAnimatedProduct />
      <HeaderAlfred />
      <div className="pt-[10%] pb-[10%] lg:pt-8 lg:pb-8 flex items-center justify-center mt-[20%] sm:mt-[10%]">
        <h1 className="text-[#F39200] dark:text-[#F39200] font-black text-7xl flex items-center">
          ALFRED
        </h1>
      </div>
      <div className="flex justify-center">
        <div>
          <p className="text-xl text-center text-black dark:text-white">
            Valor: {brlAmount} BRL
            <br /> Valor: {btcAmount} BTC
          </p>

          {pixKey ? (
            <div className="flex flex-col items-center pt-4">
              <p className="text-center text-red-600">
                Tempo restante para pagamento: {Math.floor(timeLeft / 60)}:
                {timeLeft % 60 < 10 ? '0' : ''}
                {timeLeft % 60} minutos
              </p>

              <p className="text-xl text-center text-black dark:text-white mb-4">
                Escaneie o QR Code ou copie a chave PIX abaixo:
              </p>

              <QRCodeSVG value={pixKey} size={256} />

              <textarea
                value={pixKey}
                readOnly
                className="border px-4 py-3 rounded-3xl text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 w-full mt-4"
                rows={6}
              />

              <button
                onClick={copyToClipboard}
                className="mt-4 px-6 py-3 bg-[#F39200] text-white rounded-3xl font-bold"
              >
                Copiar Chave PIX
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center px-4 sm:px-8 lg:px-0">
                <div className="w-full max-w-lg">
                  <div className="flex justify-center items-center space-x-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={network}
                        readOnly
                        placeholder="Selecione uma rede"
                        className="border pl-16 pr-16 py-3 rounded-3xl text-base sm:text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 text-center w-full"
                        onClick={toggleDropdown}
                      />
                      <button
                        onClick={toggleDropdown}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white"
                      >
                        {networks.find((net) => net.name === network)?.icon && (
                          <img
                            src={
                              networks.find((net) => net.name === network)?.icon
                            }
                            alt={network}
                            className="w-8 h-8 sm:w-10 sm:h-10"
                          />
                        )}
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                          <ul>
                            {networks.map((net) => (
                              <li
                                key={net.name}
                                onClick={() => selectNetwork(net.name)}
                                className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {net.name}
                                <img
                                  src={net.icon}
                                  alt={net.name}
                                  className="w-8 h-8 ml-2 sm:w-10 sm:h-10"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center items-center pt-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={paymentMethod}
                        readOnly
                        placeholder="Selecione o método de pagamento"
                        className="border pl-16 pr-16 py-3 rounded-3xl text-base sm:text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 cursor-pointer w-full"
                        onClick={toggleDropdownMethod}
                      />
                      <button
                        onClick={toggleDropdownMethod}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white"
                      >
                        {paymentMethod === 'PIX' ? (
                          <FaPix className="w-8 h-8 sm:w-10 sm:h-10" />
                        ) : paymentMethod === 'Cartão de Crédito' ? (
                          <CiCreditCard1 className="w-8 h-8 sm:w-10 sm:h-10" />
                        ) : (
                          <FaBarcode className="w-8 h-8 sm:w-10 sm:h-10" />
                        )}
                      </button>
                      {isDropdownOpenMethod && (
                        <div className="absolute z-50 right-0 top-full mt-2 w-full sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <ul>
                            <li
                              onClick={() => selectPaymentMethod('PIX')}
                              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              PIX
                              <FaPix className="w-8 h-8 sm:w-10 sm:h-10" />
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center items-center pt-4">
                    <div className="relative w-full">
                      <input
                        value={coldWallet}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setColdWallet(e.target.value)
                        }
                        placeholder="Endereço da carteira Bitcoin (wallet)"
                        className="border pl-4 pr-6 py-3 rounded-3xl text-base sm:text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 w-full"
                      />
                      {errors.coldWallet && (
                        <p className="text-red-500 text-sm">
                          {errors.coldWallet}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center items-center pt-4">
                    <div className="relative w-full">
                      <input
                        value={transactionNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setTransactionNumber(e.target.value)
                        }
                        placeholder="Telefone para contato (WhatsApp)"
                        className="border pl-4 pr-6 py-3 rounded-3xl text-base sm:text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 w-full"
                      />
                      {errors.transactionNumber && (
                        <p className="text-red-500 text-sm">
                          {errors.transactionNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center mt-4">
                    <input
                      type="text"
                      value={cupom}
                      onChange={(e) => setCupom(e.target.value)}
                      placeholder="Digite o cupom"
                      className="border px-4 py-3 rounded-3xl text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 w-full"
                    />
                    <button
                      onClick={checkCouponValidity}
                      className="ml-4 px-6 py-3 bg-[#F39200] text-white rounded-3xl font-bold"
                    >
                      Aplicar
                    </button>
                  </div>

                  <div className="flex flex-col justify-center items-start pt-4">
                    <label className="flex items-center dark:text-white">
                      <input
                        type="checkbox"
                        checked={acceptFees}
                        onChange={() => setAcceptFees(!acceptFees)}
                        className="mr-2"
                      />
                      <span
                        onClick={() =>
                          window.open(
                            ROUTES.fee.call(currentLang),
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        className="cursor-pointer text-blue-500 hover:underline"
                      >
                        ACEITO AS TAXAS
                      </span>
                    </label>
                    <label className="flex items-center dark:text-white">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={() => setAcceptTerms(!acceptTerms)}
                        className="mr-2"
                      />
                      <span
                        onClick={() =>
                          window.open(
                            ROUTES.term.call(currentLang),
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        className="cursor-pointer text-blue-500 hover:underline"
                      >
                        ACEITO OS TERMOS DE USO
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-center items-center pt-4">
                    {isLoading ? (
                      <Loader />
                    ) : (
                      <button
                        onClick={handleProcessPayment}
                        type="button"
                        disabled={!acceptFees || !acceptTerms}
                        className={classNames(
                          'w-full h-12 sm:h-14 bg-[#F39200] text-black dark:text-white rounded-3xl font-bold text-sm sm:text-base mb-4',
                          (!acceptFees || !acceptTerms) && 'opacity-50',
                        )}
                      >
                        Obter Chave PIX
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <WhatsAppButton />
    </div>
  );
}
