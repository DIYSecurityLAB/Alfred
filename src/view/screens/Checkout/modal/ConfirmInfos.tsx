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
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-3xl font-bold text-sm sm:text-base transition duration-300 ${
      variant === 'outline'
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

          {/* Botões */}
          <div className="flex justify-between space-x-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              {t('confirm_infos.buttons.cancel')}
            </Button>
            <Button onClick={onConfirm}>
              {t('confirm_infos.buttons.confirm')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
