import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useConfirmInfos } from './useConfirmInfos';

const Button = ({
  onClick,
  children,
  variant,
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 rounded-3xl font-bold text-sm sm:text-base transition duration-300 ${
      disabled
        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
        : variant === 'outline'
        ? 'border-2 border-[#F39200] text-[#F39200] hover:bg-[#F39200] hover:text-white'
        : 'bg-[#F39200] text-white hover:bg-orange-600'
    }`}
  >
    {children}
  </button>
);

interface ConfirmInfosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fiatAmount: string;
  fiatType: string;
  cryptoAmount: string;
  cryptoType: string;
  network: string;
  coldWallet: string;
  paymentMethod: string;
  cupom: string;
  alfredFeePercentage: number;
}

export default function ConfirmInfosModal({
  isOpen,
  onClose,
  onConfirm,
  fiatAmount,
  fiatType,
  cryptoAmount,
  cryptoType,
  network,
  coldWallet,
  paymentMethod,
  cupom,
  alfredFeePercentage,
}: ConfirmInfosModalProps) {
  const {
    onchainFee,
    btcToBrl,
    swapFee,
    totalFees,
    expectedAmount,
    expectedAmountCrypto,
    alfredFee,
    alfredFeeRate,
    conversionFeeUsdBrl,
    usdToBrl,
  }: {
    onchainFee: number | null;
    btcToBrl: number | null;
    swapFee: number;
    totalFees: number;
    expectedAmount: number;
    expectedAmountCrypto: string;
    alfredFee: number;
    alfredFeeRate: number;
    conversionFeeUsdBrl: number | null;
    usdToBrl: number | null;
  } = useConfirmInfos(
    network,
    fiatAmount,
    fiatType,
    alfredFeePercentage,
    cryptoType,
    paymentMethod,
    cupom,
  );

  const [isDataVisible, setIsDataVisible] = useState(false);
  const [isTaxVisible, setIsTaxVisible] = useState(false);
  const [isWalletConfirmed, setIsWalletConfirmed] = useState(false);

  const handleConfirm = () => {
    // Converte o valor do fiat para número
    const fiatAmountNum = parseFloat(
      fiatAmount.replace(/[^\d,]/g, '').replace(',', '.'),
    );

    const amountBRL =
      fiatType.toUpperCase() === 'BRL'
        ? fiatAmountNum
        : fiatAmountNum * (usdToBrl || 0);

    if (amountBRL > 5000) {
      const whatsappNumber = import.meta.env.VITE_SUPPORT_NUMBER || '5511911872097';
      const message = encodeURIComponent(
        `${t('confirm_infos.whatsapp_message.greeting')} ${fiatAmount} ${fiatType.toUpperCase()} para ${cryptoAmount} ${cryptoType.toUpperCase()}.\n\n` +
        `${t('confirm_infos.whatsapp_message.transaction_details')}\n` +
        `${t('confirm_infos.whatsapp_message.value_label')} ${fiatAmount} ${fiatType.toUpperCase()}\n` +
        `${t('confirm_infos.whatsapp_message.crypto_label')} ${cryptoAmount} ${cryptoType.toUpperCase()}\n` +
        `${t('confirm_infos.whatsapp_message.network_label')} ${network}\n` +
        `${t('confirm_infos.whatsapp_message.wallet_label')} ${coldWallet}\n` +
        `${t('confirm_infos.whatsapp_message.payment_method_label')} ${paymentMethod}\n` +
        `${cupom ? `${t('confirm_infos.whatsapp_message.coupon_label')} ${cupom}\n` : ''}` +
        `\n${t('confirm_infos.whatsapp_message.help_request')}`
      );
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
      onClose();
    } else {
      // Valor abaixo de 5000, segue com a lógica original
      onConfirm();
    }
  };

  if (!isOpen) return null;

  if (
    network.toLowerCase() === 'onchain' &&
    onchainFee === null &&
    btcToBrl === null
  )
    return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-[#040311] p-6 rounded-xl max-w-lg shadow-lg relative w-full max-h-[90vh] overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#040311 #0d131f',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl text-white font-semibold">
            {t('confirm_infos.title')}
          </h2>
          <p className="text-sm text-gray-300 mt-2">
            {t('confirm_infos.description')}
          </p>
        </div>

        <div className="space-y-6 text-white">
          {/* Seção de Valor */}
          <div className="bg-[#1a1d2b] p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-6 h-6 text-[#F39200]" />
              <h3 className="text-lg font-semibold">
                {t('confirm_infos.amount_section.title')}
              </h3>
            </div>
            <p>
              <span className="text-xl font-bold">{fiatAmount}</span>{' '}
              {fiatType.toUpperCase()}
            </p>
            <p>
              {t('confirm_infos.amount_section.crypto_label')}{' '}
              <span className="text-xl font-bold">
                {cryptoAmount} {cryptoType.toUpperCase()}
              </span>
            </p>
          </div>

          {/* Toggle Meus Dados */}
          <div
            className="bg-[#1a1d2b] p-4 rounded-lg cursor-pointer"
            onClick={() => setIsDataVisible(!isDataVisible)}
          >
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="w-6 h-6 text-[#F39200]" />
              <h3 className="text-lg font-semibold">
                {t('confirm_infos.user_data_section.title')}
              </h3>
              {isDataVisible ? (
                <ChevronUpIcon className="w-5 h-5 text-[#F39200]" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-[#F39200]" />
              )}
            </div>
            {isDataVisible && (
              <div className="mt-4 space-y-2">
                <p>
                  <strong>
                    {t('confirm_infos.user_data_section.wallet')}:
                  </strong>{' '}
                  {coldWallet}
                </p>
                <p>
                  <strong>
                    {t('confirm_infos.user_data_section.coupon')}:
                  </strong>{' '}
                  {cupom || t('confirm_infos.user_data_section.coupon_none')}
                </p>
                <p>
                  <strong>
                    {t('confirm_infos.user_data_section.network')}:
                  </strong>{' '}
                  {network}
                </p>
                <p>
                  <strong>
                    {t('confirm_infos.user_data_section.payment_method')}:
                  </strong>{' '}
                  {paymentMethod}
                </p>
              </div>
            )}
          </div>

          {/* Toggle Taxas */}
          <div
            className="bg-[#1a1d2b] p-4 rounded-lg cursor-pointer"
            onClick={() => setIsTaxVisible(!isTaxVisible)}
          >
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-6 h-6 text-[#F39200]" />
              <h3 className="text-lg font-semibold">
                {t('confirm_infos.fees_section.title')}
              </h3>
              {isTaxVisible ? (
                <ChevronUpIcon className="w-5 h-5 text-[#F39200]" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-[#F39200]" />
              )}
            </div>
            {isTaxVisible && (
              <div className="mt-4 space-y-2">
                {cryptoType.toLowerCase() === 'usdt' ? (
                  <p>
                    <strong>
                      {t('confirm_infos.fees_section.conversion_fee')}:
                    </strong>{' '}
                    R$ {swapFee.toFixed(2)}
                  </p>
                ) : (
                  <p>
                    <strong>
                      {t('confirm_infos.fees_section.conversion_fee')}:
                    </strong>{' '}
                    R$ {swapFee.toFixed(2)} (
                    {t('confirm_infos.fees_section.conversion_fee_value')} + R${' '}
                    {conversionFeeUsdBrl?.toFixed(2)})
                  </p>
                )}
                {network.toLowerCase() === 'onchain' && (
                  <p>
                    <strong>
                      {t('confirm_infos.fees_section.onchain_fee')}:
                    </strong>{' '}
                    R$ {onchainFee?.toFixed(2)}{' '}
                    {t('confirm_infos.fees_section.onchain_fee_variable')}
                  </p>
                )}
                <p>
                  <strong>{t('confirm_infos.fees_section.alfred_fee')}:</strong>{' '}
                  R$ {alfredFee.toFixed(2)} ({(alfredFeeRate * 100).toFixed(2)}
                  %)
                </p>
                <p>
                  <strong>{t('confirm_infos.fees_section.total_fees')}:</strong>{' '}
                  R$ {totalFees.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Resumo Final */}
          <div className="bg-[#1a1d2b] p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-6 h-6 text-[#F39200]" />
              <h3 className="text-lg font-semibold">
                {t('confirm_infos.final_summary.title')}
              </h3>
            </div>
            <p>
              <strong>
                {t('confirm_infos.final_summary.expected_amount')}:
              </strong>{' '}
              R$ {expectedAmount.toFixed(2)}
            </p>
            <p>
              <strong>
                {t('confirm_infos.final_summary.expected_amount_crypto')}:
              </strong>{' '}
              {expectedAmountCrypto} {cryptoType.toUpperCase()}
            </p>
          </div>

          {/* Confirmação de Endereço */}
          <div className="bg-[#1a1d2b] p-4 rounded-lg border-l-4 border-[#F39200]">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="walletConfirmation"
                checked={isWalletConfirmed}
                onChange={(e) => setIsWalletConfirmed(e.target.checked)}
                className="mt-1 w-5 h-5 text-[#F39200] bg-gray-100 border-gray-300 rounded focus:ring-[#F39200] focus:ring-2"
              />
              <label htmlFor="walletConfirmation" className="text-base text-gray-300 cursor-pointer">
                {t('confirm_infos.wallet_confirmation.checkbox_label')} <br /> <span className="text-[#F39200] break-all">{coldWallet}</span>
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between space-x-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              {t('confirm_infos.buttons.cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={!isWalletConfirmed}>
              {t('confirm_infos.buttons.confirm')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
