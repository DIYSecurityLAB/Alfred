import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCopy } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface TransactionIdDisplayProps {
  delay?: number;
}

export function TransactionIdDisplay({
  delay = 0.75,
}: TransactionIdDisplayProps) {
  const { t } = useTranslation();
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    const storedTransactionId = localStorage.getItem('transactionId');
    if (storedTransactionId) {
      setTransactionId(storedTransactionId);
    }
  }, []);

  const copyToClipboard = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
      toast.success(t('paymentReview.idCopied') || 'ID copiado com sucesso!');
    }
  };

  if (!transactionId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg mb-6 max-w-md w-full"
    >
      <p className="text-sm text-yellow-400 mb-2">
        {t('paymentReview.saveIdMessage')}
      </p>
      <div className="flex items-center justify-between bg-gray-900/70 p-3 rounded">
        <p className="text-gray-200 font-mono text-sm md:text-base truncate mr-2">
          {transactionId}
        </p>
        <button
          onClick={copyToClipboard}
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full flex-shrink-0 transition-colors"
          title={t('paymentReview.copyId')}
        >
          <FaCopy className="text-white" />
        </button>
      </div>
    </motion.div>
  );
}
