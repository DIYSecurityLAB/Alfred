import { Background } from '@/view/components/BackgroundAnimatedProduct';
import { motion } from 'framer-motion';
import { CSSProperties, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Alfred from '../../assets/AlfredComercial.png';
import logoSucces from '../../assets/Check_Tela_Alfred.png';
import TalkBallon from '../../assets/talk.png';
import { ROUTES } from '../../routes/Routes';
import { useCurrentLang } from '../../utils/useCurrentLang';

export function PaymentAlfredSuccess() {
  const { t } = useTranslation();
  const { currentLang } = useCurrentLang();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOnLink = (path: string, callback?: () => void) => {
    if (callback) {
      callback();
    }
    navigate(path);
  };

  const alfredStyle: CSSProperties = {
    position: 'absolute',
    top: '7rem',
    right: windowWidth < 768 ? '3rem' : '5rem',
    width: windowWidth < 768 ? '12rem' : '18rem',
    height: 'auto',
    transform: 'rotate(12deg)',
  };

  const talkBallonStyle: CSSProperties = {
    position: 'absolute',
    top: '2rem',
    right: windowWidth < 768 ? '2rem' : '5rem',
    width: windowWidth < 768 ? '6.3rem' : '8rem',
    zIndex: 10,
  };

  const textStyle: CSSProperties = {
    position: 'absolute',
    top:
      windowWidth < 768
        ? currentLang === 'es'
          ? '1rem' // Ajuste para espanhol quando a tela for pequena
          : currentLang === 'en'
            ? '1.5rem' // Ajuste para inglês quando a tela for pequena
            : '1.7rem' // Ajuste para português quando a tela for pequena
        : currentLang === 'es'
          ? '1.4rem' // Ajuste para espanhol quando a tela for grande
          : currentLang === 'en'
            ? '2rem' // Ajuste para inglês quando a tela for grande
            : '2.4rem', // Ajuste para português quando a tela for grande
    left:
      windowWidth < 768
        ? currentLang === 'es'
          ? '0.2rem' // Ajuste para espanhol quando a tela for pequena
          : currentLang === 'en'
            ? '0.2rem' // Ajuste para inglês quando a tela for pequena
            : '0.5rem' // Ajuste para português quando a tela for pequena
        : currentLang === 'es'
          ? '0.2rem' // Ajuste para espanhol quando a tela for grande
          : currentLang === 'en'
            ? '0.2rem' // Ajuste para inglês quando a tela for grande
            : '1rem', // Ajuste para português quando a tela for grande
    fontSize:
      windowWidth < 768
        ? currentLang === 'es'
          ? '1rem' // Ajuste para espanhol quando a tela for pequena
          : currentLang === 'en'
            ? '0.9rem' // Ajuste para inglês quando a tela for pequena
            : '1rem' // Ajuste para português quando a tela for pequena
        : currentLang === 'es'
          ? '1.3rem' // Ajuste para espanhol quando a tela for grande
          : currentLang === 'en'
            ? '1rem' // Ajuste para inglês quando a tela for grande
            : '1.2rem', // Ajuste para português quando a tela for grande
    fontWeight: 'bold',
    color: 'black',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col justify-center items-center px-6 text-center relative text-white"
    >
      <Background />
      <motion.img
        src={Alfred}
        alt="Alfred Mascote"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={alfredStyle}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={talkBallonStyle}
      >
        <img
          src={TalkBallon}
          alt="Balão de fala"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        <p style={textStyle}>{t('paymentSuccess.Ballon')}</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
      >
        <img src={logoSucces} alt="check" className="w-60" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-4"
      >
        {t('paymentSuccess.title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-lg md:text-xl mb-8 max-w-xl text-gray-100"
      >
        {t('paymentSuccess.description')}{' '}
        <strong>{t('paymentSuccess.transactionTime')}</strong>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <button
          onClick={() => handleOnLink(ROUTES.buyBitcoin.call(currentLang))}
          className="w-[200px] h-[50px] bg-[#F49300] border-[3px] border-white rounded-[40px] "
        >
          {t('paymentSuccess.redirectButton')}
        </button>
        <button
          onClick={() =>
            window.open(
              'https://api.whatsapp.com/send?phone=+5511911872097&text=Meu%20pagamento%20no%20Alfred%20foi%20conclu%C3%ADdo%20e%20tenho%20algumas%20d%C3%BAvidas.%20Poderia%20me%20ajudar%3F',
              '_blank',
            )
          }
          className="bg-black w-[200px] h-[50px] text-[#00FC00] border-[3px] border-[#00FC00] rounded-[40px] flex items-center justify-center gap-2"
        >
          {t('paymentSuccess.whatsapp')} <FaWhatsapp />
        </button>
      </motion.div>
    </motion.div>
  );
}
