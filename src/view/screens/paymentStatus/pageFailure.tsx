import { Background } from '@/view/components/BackgroundAnimatedProduct';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaTimesCircle, FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/Routes';
import { useCurrentLang } from '../../utils/useCurrentLang';

export function PaymentAlfredFailure() {
  const { t } = useTranslation();
  const { currentLang } = useCurrentLang();
  const navigate = useNavigate();

  const handleOnLink = (path: string) => {
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen flex flex-col justify-center items-center px-6 text-center relative text-white"
    >
      <Background />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
        className="text-red-600 text-[12rem] mb-4"
      >
        <FaTimesCircle />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4"
      >
        {t('paymentFailure.title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-lg md:text-xl mb-6 max-w-2xl text-gray-100"
      >
        {t('paymentFailure.description')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <button
          onClick={() => handleOnLink(ROUTES.buyBitcoin.call(currentLang))}
          className="w-[220px] h-[50px] text-lg bg-[#F49300] border-[3px] border-white rounded-[40px] "
        >
          {t('paymentFailure.retryButton')}
        </button>
        <button
          onClick={() =>
            window.open(
              'https://api.whatsapp.com/send?phone=+5511911872097&text=Meu%20pagamento%20no%20Alfred%20falhou.%20Poderia%20me%20ajudar%3F',
              '_blank',
            )
          }
          className="bg-black w-[220px] h-[50px] text-lg text-[#00FC00] border-[3px] border-[#00FC00] rounded-[40px] flex items-center justify-center gap-2"
        >
          {t('paymentFailure.whatsapp')} <FaWhatsapp size={24} />
        </button>
      </motion.div>
    </motion.div>
  );
}
