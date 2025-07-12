import { UserLevelBadge } from '@/view/components/UserLevelBadge';
import classNames from 'classnames';
import { t } from 'i18next';
import { ChangeEvent, useState } from 'react';
import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaMoneyBillWave,
  FaQuestionCircle,
  FaTools,
} from 'react-icons/fa';
import { FaPix } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import BankTransf from '../../../assets/bankIcon.png';
import BoletoIcon from '../../../assets/BoletoIcon.png';
import AlfredImg from '../../../assets/c1b28810-5a23-4e7c-bcce-bd1f42b271c5.png';
import NomadIcon from '../../../assets/nomadIcon.png';
import PayPalIcon from '../../../assets/paypalIcon.png';
import SwiftIcon from '../../../assets/swiftIcon.png';
import { ROUTES } from '../../../routes/Routes';
import ConfirmInfosModal from '../modal/ConfirmInfos';
import { useDataForm } from './useDataForm';

// Adicionando as importações no topo do arquivo
import {
  getMaintenanceMessage,
  isPaymentMethodInMaintenance,
} from '@/config/paymentMaintenance';

// Adicionar um tipo para os métodos de pagamento
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

// Adicionar a importação no topo do arquivo, se necessário
import { isVipUser } from '@/config/vipUsers';
import { AlfredLogo } from '@/view/components/Logo/AlfredLogo';
import { PaymentLoader } from '@/view/components/PaymentLoader';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function DataForm() {
  const {
    network,
    coldWallet,
    cupom,
    isDropdownOpen,
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
    paymentMethod,
    isDropdownOpenMethod,
    alfredFeePercentage,
    selectPaymentMethod,
    toggleDropdownMethod,
    toggleDropdown,
    selectNetwork,
    handleProcessPayment,
    checkCouponValidity,
    setColdWallet,
    setAcceptTerms,
    setAcceptFees,
    setCupom,
    validateFields,
    userLevel,

    // restrictions,
    isPaymentMethodAllowed,
    isVipTransaction,
  } = useDataForm();

  // Verifica se há um usuário logado via localStorage
  const storedUser = localStorage.getItem('user');
  const loggedUser = storedUser ? JSON.parse(storedUser) : null;

  // Se já estiver logado, o campo de usuário é pré-preenchido
  const [username, setUsername] = useState(loggedUser?.username || '');
  const [password, setPassword] = useState('');

  // Adicionamos os novos rótulos para os métodos de pagamento
  const paymentMethodLabels = {
    PIX: t('buycheckout.paymentMethod.PIX'),
    NOMAD: t('buycheckout.paymentMethod.NOMAD'),
    SWIFT: t('buycheckout.paymentMethod.SWIFT'),
    PAYPAL: t('buycheckout.paymentMethod.PAYPAL'),
    BANK_TRANSFER: t('buycheckout.paymentMethod.BANK_TRANSFER'),
    TED: t('buycheckout.paymentMethod.TED'),
    CASH: t('buycheckout.paymentMethod.CASH'),
    PIX_MAINTENANCE: t('buycheckout.paymentMethod.PIX'),
    TICKET: t('buycheckout.paymentMethod.BOLETO'),
  };

  const numericFiat = parseInt(fiatAmount.replace(/\D/g, ''), 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const closeModal = () => setIsModalOpen(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Funções para remover espaços dos campos de usuário e senha
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '');
    setUsername(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '');
    setPassword(value);
  };

  const handleApplyCoupon = async () => {
    await checkCouponValidity();
    if (!errors.cupom) {
      setCupom(cupom.toUpperCase());
      setCouponApplied(true);
    }
  };

  const handleOpenModal = async () => {
    if (!username || (!loggedUser && !password)) {
      toast.error(t('checkout.missingLogin'));
      return;
    }

    // Verificar se há espaços no nome de usuário ou senha
    if (username.includes(' ') || password.includes(' ')) {
      toast.error('Nome de usuário e senha não podem conter espaços.');
      return;
    }

    if (cupom.trim() && !couponApplied) {
      toast.error(t('checkout.applyCouponFirst'));
      return;
    }

    if (username.trim().length < 6) {
      toast.error(t('checkout.usernameLengthError'));
      return;
    }

    if (!loggedUser && password.trim().length < 6) {
      toast.error(t('checkout.passwordLengthError'));
      return;
    }

    if (!validateFields()) {
      toast.error(t('checkout.missingFields'));
      return;
    }

    try {
      const isVip = await isVipUser();

      if (isVip) {
        handleProcessPayment(username, password);
        return;
      }
    } catch (error) {
      console.error('[DataForm] Erro ao verificar se o usuário é VIP:', error);
      toast.error('Erro ao verificar status VIP. Tente novamente.');
      return;
    }

    if (userLevel === 0 && localStorage.getItem('dailyTransactions')) {
      const dailyTransactions = parseInt(
        localStorage.getItem('dailyTransactions') || '0',
        10,
      );
      if (dailyTransactions >= 2) {
        toast.warning(
          'Você já atingiu o limite de 2 transações diárias para nível Madeira. O sistema bancário poderá recusar a transação.',
        );
      }
    }

    if (fiatType.toUpperCase() !== 'BRL') {
      const whatsappNumber = '5511911872097';
      const message = `Olá! Estou Querendo comprar ${cryptoType.toUpperCase()} com ${fiatType} .
Valor: ${fiatAmount} (${fiatType})
Crypto (${cryptoType.toUpperCase()}): ${cryptoAmount}
Rede: ${network}
Endereço da carteira: ${coldWallet}
Usuário: ${username}
Cupom: ${cupom || 'Nenhum'}`;
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappLink, '_blank');
      return;
    }

    // Para valores acima de 5k, processar normalmente e depois redirecionar
    if (paymentMethod === 'PIX' && numericFiat > 5000) {
      // Salva um flag para redirecionar após o processamento
      localStorage.setItem('redirectToWhatsAppAfterPayment', 'true');
    }

    setIsModalOpen(true);
  };

  const [, setMaintenanceMessage] = useState<string | null>(null);

  const allPaymentMethods = [
    {
      id: 'PIX',
      label: t('buycheckout.paymentMethod.PIX'),
      icon: <FaPix className="w-6 h-6 mt-1" />,
      maintenance: isPaymentMethodInMaintenance('PIX'),
    },
    {
      id: 'NOMAD',
      label: t('buycheckout.paymentMethod.NOMAD'),
      icon: (
        <img
          src={NomadIcon}
          alt="Nomad"
          className="w-6 h-6 mt-1 rounded-full"
        />
      ),
    },
    {
      id: 'SWIFT',
      label: t('buycheckout.paymentMethod.SWIFT'),
      icon: (
        <img
          src={SwiftIcon}
          alt="Swift"
          className="w-6 h-6 mt-1 rounded-full"
        />
      ),
    },
    {
      id: 'PAYPAL',
      label: t('buycheckout.paymentMethod.PAYPAL'),
      icon: (
        <img
          src={PayPalIcon}
          alt="PayPal"
          className="w-6 h-6 mt-1 rounded-full"
        />
      ),
    },
    {
      id: 'BANK_TRANSFER',
      label: t('buycheckout.paymentMethod.BANK_TRANSFER'),
      icon: (
        <img
          src={BankTransf}
          alt="Transferência Bancária"
          className="w-6 h-6 mt-1 rounded-full"
        />
      ),
    },

    {
      id: 'TED',
      label: t('buycheckout.paymentMethod.TED'),
      icon: (
        <img src={BankTransf} alt="TED" className="w-6 h-6 mt-1 rounded-full" />
      ),
    },
    {
      id: 'CASH',
      label: t('buycheckout.paymentMethod.CASH'),
      icon: <FaMoneyBillWave className="w-6 h-6 mt-1" />,
    },
    {
      id: 'TICKET',
      label: t('buycheckout.paymentMethod.BOLETO'),
      icon: (
        <img
          src={BoletoIcon}
          alt="Boleto"
          className="w-6 h-6 mt-1 rounded-full"
        />
      ),
    },
  ];

  return (
    <>
      {isLoading && <PaymentLoader />}
      <main className="flex flex-col justify-center items-center pt-12 sm:pt-24 px-4 sm:px-6">
        <AlfredLogo />

        {loggedUser && (
          <div className="mb-4 mt-2">
            <UserLevelBadge />
          </div>
        )}

        <section className="flex flex-col items-center gap-y-4 pt-4 w-full relative">
          <p className="text-lg sm:text-xl text-center text-white">
            {t('buycheckout.value')}: {fiatAmount} {fiatType}
            <br />
            {t('buycheckout.valueCrypto')}: {cryptoAmount}{' '}
            {cryptoType.toUpperCase()}
          </p>

          <div className="w-full flex justify-center">
            {/* Container principal com posição relativa para posicionar o Alfred */}
            <div className="w-full max-w-2xl relative">
              {/* Área dos inputs */}
              <div className="w-full">
                <div className="flex justify-center items-center relative w-full">
                  <input
                    type="text"
                    value={network}
                    readOnly
                    placeholder={t('buycheckout.selectNetwork')}
                    onClick={toggleDropdown}
                    className="border-2 px-8 py-3 rounded-3xl text-base bg-black sm:text-lg text-white placeholder-white text-center w-full"
                  />
                  <button
                    onClick={toggleDropdown}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white"
                  >
                    {networks.find((net) => net.name === network)?.icon && (
                      <img
                        src={networks.find((net) => net.name === network)?.icon}
                        alt={network}
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                    )}
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 transition-all duration-300 ease-out transform scale-100 opacity-100">
                      <ul className="w-full">
                        {networks.map((net) => {
                          // Verificar se o valor é menor que 200 reais e bloquear outras redes que não sejam Lightning
                          const isValueTooLow =
                            fiatType === 'BRL' &&
                            numericFiat < 200 &&
                            net.name !== 'Lightning';
                          // Verificar se o valor é menor que 25 reais para Lightning
                          const isLightningValueTooLow =
                            fiatType === 'BRL' &&
                            numericFiat < 25 &&
                            net.name === 'Lightning';
                          const isDisabled =
                            isValueTooLow || isLightningValueTooLow;

                          return (
                            <li
                              key={net.name}
                              onClick={() => {
                                if (isDisabled) {
                                  if (isLightningValueTooLow) {
                                    toast.info(
                                      'O valor mínimo para Lightning é R$ 25',
                                    );
                                  } else if (isValueTooLow) {
                                    toast.info(
                                      'Para valores abaixo de R$ 200, apenas a rede Lightning está disponível',
                                    );
                                  }
                                } else {
                                  selectNetwork(net.name);
                                }
                              }}
                              className={`flex flex-col items-center justify-center px-4 py-2 cursor-pointer text-white ${
                                isDisabled
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-gray-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 w-full justify-center">
                                <span className="text-center">{net.name}</span>
                                {isDisabled && (
                                  <FaLock
                                    size={12}
                                    className="text-yellow-500"
                                  />
                                )}
                              </div>
                              <img
                                src={net.icon}
                                alt={net.name}
                                className="w-6 h-6 mt-1"
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex justify-center items-center relative w-full pt-4">
                  <div className="relative w-full">
                    <input
                      value={
                        paymentMethod ? paymentMethodLabels[paymentMethod] : ''
                      }
                      readOnly
                      placeholder={t('buycheckout.selectPaymentMethod')}
                      className="border-2 px-8 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                      onClick={toggleDropdownMethod}
                    />
                    <button
                      onClick={toggleDropdownMethod}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white"
                    >
                      {paymentMethod === 'PIX' ? (
                        <FaPix className="w-8 h-8 sm:w-10 sm:h-10" />
                      ) : paymentMethod === 'NOMAD' ? (
                        <img
                          src={NomadIcon}
                          alt="Nomad"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      ) : paymentMethod === 'SWIFT' ? (
                        <img
                          src={SwiftIcon}
                          alt="Swift"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      ) : paymentMethod === 'PAYPAL' ? (
                        <img
                          src={PayPalIcon}
                          alt="PayPal"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      ) : paymentMethod === 'BANK_TRANSFER' ? (
                        <img
                          src={BankTransf}
                          alt="Bank Transfer"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      ) : paymentMethod === 'TED' ? (
                        <img
                          src={BankTransf}
                          alt="TED"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      ) : paymentMethod === 'CASH' ? (
                        <FaMoneyBillWave className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                      ) : paymentMethod === 'TICKET' ? (
                        <img
                          src={BoletoIcon}
                          alt="Boleto"
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                        />
                      ) : null}
                    </button>
                    {isDropdownOpenMethod && (
                      <div className="absolute left-0 top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 transition-all duration-300 ease-out transform scale-100 opacity-100">
                        <ul className="grid grid-cols-2 gap-4 w-full">
                          {allPaymentMethods.map((method) => {
                            const isAllowed = isPaymentMethodAllowed(method.id);
                            const isInMaintenance = method.maintenance;

                            return (
                              <li
                                key={method.id}
                                onClick={() => {
                                  if (isInMaintenance) {
                                    // Se estiver em manutenção, ainda permitimos selecionar, mas com aviso
                                    selectPaymentMethod(
                                      method.id as PaymentMethodType,
                                    );
                                    setMaintenanceMessage(
                                      getMaintenanceMessage(method.id),
                                    );
                                  } else if (isAllowed) {
                                    selectPaymentMethod(
                                      method.id as PaymentMethodType,
                                    );
                                    setMaintenanceMessage(null);
                                  } else {
                                    let message = '';
                                    if (method.id === 'TED') {
                                      message = t(
                                        'buycheckout.paymentLevelRestriction.ted',
                                      );
                                    } else if (method.id === 'BOLETO') {
                                      message = t(
                                        'buycheckout.paymentLevelRestriction.boleto',
                                      );
                                    } else if (method.id === 'CASH') {
                                      message = t(
                                        'buycheckout.paymentLevelRestriction.cash',
                                      );
                                    } else {
                                      message = t(
                                        'buycheckout.paymentLevelRestriction.general',
                                      );
                                    }
                                    toast.warning(message);
                                  }
                                }}
                                className={`flex flex-col items-center justify-center px-4 py-2 cursor-pointer text-white ${
                                  !isAllowed
                                    ? 'opacity-50 cursor-not-allowed'
                                    : isInMaintenance
                                      ? 'opacity-70 bg-yellow-900 bg-opacity-30'
                                      : 'hover:bg-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-full text-center">
                                    {method.label}
                                  </span>
                                  {!isAllowed && (
                                    <FaLock
                                      size={12}
                                      className="text-yellow-500"
                                    />
                                  )}
                                  {isInMaintenance && (
                                    <FaTools
                                      size={12}
                                      className="text-yellow-500"
                                    />
                                  )}
                                </div>
                                {method.icon}
                                {isInMaintenance && (
                                  <span className="text-xs text-yellow-500 mt-1">
                                    Em Manutenção
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-center items-center relative w-full pt-4">
                  <div className="relative w-full">
                    <input
                      value={coldWallet}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setColdWallet(e.target.value)
                      }
                      placeholder={t('buycheckout.bitcoinWallet')}
                      className="border-2 px-8 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                    />
                    {errors.coldWallet && (
                      <p className="text-white text-sm mt-2 p-3 bg-red-900 bg-opacity-40 rounded-lg border-2 border-red-500 shadow-md">
                        {errors.coldWallet}
                      </p>
                    )}
                  </div>
                </div>

                {/* Campos de login */}
                {loggedUser ? (
                  <div className="flex justify-center items-center pt-4">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={username}
                        readOnly
                        placeholder={
                          t('buycheckout.usernamePlaceholder') || 'Usuário'
                        }
                        className="border-2 pl-10 px-8 py-3 rounded-3xl text-base sm:text-lg text-white bg-black text-center w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center pt-4">
                    <div className="flex flex-row gap-4 w-full">
                      <div className="relative w-1/2">
                        <FaQuestionCircle
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white cursor-pointer"
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          onClick={() => setShowTooltip(!showTooltip)}
                        />
                        <input
                          type="text"
                          value={username}
                          onChange={handleUsernameChange}
                          placeholder={
                            t('buycheckout.usernamePlaceholder') ||
                            'Usuário (sem espaços)'
                          }
                          className="border-2 pl-10 px-8 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                        />
                        {showTooltip && (
                          <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white text-sm p-3 rounded-lg shadow-lg z-10">
                            <p>
                              {t('buycheckout.loginTooltip.message') ||
                                'Por segurança, informe seu usuário e senha para acessar a plataforma. Não use espaços no usuário ou senha.'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="w-1/2 relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder={
                            t('buycheckout.passwordPlaceholder') ||
                            'Senha (sem espaços)'
                          }
                          className="border-2 px-8 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                        >
                          {showPassword ? (
                            <FaEyeSlash size={20} />
                          ) : (
                            <FaEye size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center mt-4">
                  <input
                    type="text"
                    value={cupom}
                    onChange={(e) => {
                      setCupom(e.target.value);
                      setCouponApplied(false);
                    }}
                    placeholder={t('buycheckout.couponPlaceholder')}
                    className="border-2 px-8 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="ml-4 px-6 py-3 bg-[#F39200] text-white rounded-3xl font-bold"
                  >
                    {t('buycheckout.apply')}
                  </button>
                </div>
                {errors.cupom && (
                  <div className="w-full">
                    <p className="text-white text-sm mt-2 p-3 bg-red-900 bg-opacity-40 rounded-lg border-2 border-red-500 shadow-md">
                      {errors.cupom}
                    </p>
                  </div>
                )}

                {/* Seção de termos e taxas com toggles melhorados */}
                <div className="flex flex-col justify-center space-y-3 pt-6 max-w-md mx-auto w-full">
                  <div className="bg-gray-800 bg-opacity-50 rounded-xl p-3 transition-all hover:bg-opacity-70">
                    <label className="flex items-center text-white cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={acceptFees}
                          onChange={() => setAcceptFees(!acceptFees)}
                          className="sr-only"
                        />
                        <div
                          className={`w-10 h-5 ${
                            acceptFees ? 'bg-[#F39200]' : 'bg-gray-600'
                          } rounded-full shadow-inner transition-colors duration-300`}
                        ></div>
                        <div
                          className={`absolute w-4 h-4 bg-white rounded-full shadow top-0.5 left-0.5 transition-transform transform ${
                            acceptFees ? 'translate-x-5' : ''
                          }`}
                        ></div>
                      </div>
                      <div
                        onClick={() =>
                          window.open(
                            ROUTES.fee.call(currentLang),
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        className="ml-3 text-sm sm:text-base cursor-pointer text-blue-500 hover:text-blue-400 transition-colors flex items-center"
                      >
                        {t('buycheckout.acceptFees')}
                        <FaExternalLinkAlt className="ml-1 text-blue-500 text-xs" />
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-800 bg-opacity-50 rounded-xl p-3 transition-all hover:bg-opacity-70">
                    <label className="flex items-center text-white cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={() => setAcceptTerms(!acceptTerms)}
                          className="sr-only"
                        />
                        <div
                          className={`w-10 h-5 ${
                            acceptTerms ? 'bg-[#F39200]' : 'bg-gray-600'
                          } rounded-full shadow-inner transition-colors duration-300`}
                        ></div>
                        <div
                          className={`absolute w-4 h-4 bg-white rounded-full shadow top-0.5 left-0.5 transition-transform transform ${
                            acceptTerms ? 'translate-x-5' : ''
                          }`}
                        ></div>
                      </div>
                      <div
                        onClick={() =>
                          window.open(
                            ROUTES.term.call(currentLang),
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        className="ml-3 text-sm sm:text-base cursor-pointer text-blue-500 hover:text-blue-400 transition-colors flex items-center"
                      >
                        {t('buycheckout.acceptTerms')}
                        <FaExternalLinkAlt className="ml-1 text-blue-500 text-xs" />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-center items-center pt-6">
                  <button
                    onClick={handleOpenModal}
                    type="button"
                    disabled={!acceptFees || !acceptTerms}
                    className={classNames(
                      'w-full h-12 sm:h-14 bg-[#F39200] text-white rounded-3xl font-bold text-sm sm:text-base mb-[10%]',
                      (!acceptFees || !acceptTerms) && 'opacity-50',
                    )}
                  >
                    {t('buycheckout.getPixKey')}
                  </button>
                </div>
              </div>

              {/* Imagem do Alfred posicionada à direita, fora do fluxo normal */}
              <div className="hidden lg:block absolute -right-72 top-0 h-full">
                <img
                  src={AlfredImg}
                  alt="Alfred"
                  className="h-[400px] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {!isVipTransaction && (
          <ConfirmInfosModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onConfirm={() => {
              closeModal();
              handleProcessPayment(username, password);
            }}
            fiatAmount={fiatAmount || ''}
            fiatType={fiatType || ''}
            cryptoAmount={cryptoAmount || ''}
            network={network || ''}
            coldWallet={coldWallet || ''}
            paymentMethod={paymentMethod || ''}
            cupom={cupom || ''}
            alfredFeePercentage={alfredFeePercentage}
            cryptoType={cryptoType || ''}
          />
        )}
      </main>
    </>
  );
}
