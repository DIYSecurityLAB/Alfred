import { t } from 'i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AlfredQr from '../../assets/_DIY SEC LAB - Apresentação Comercial (1).png';
import { ROUTES } from '../../routes/Routes';
import { useCurrentLang } from '../../utils/useCurrentLang';
import { useDataForm } from './DataForm/useDataForm';
import { usePaymentStatusPolling } from './usePaymentStatusPolling';

export function CheckoutPix() {
  const { pixKey } = useDataForm();
  const { isLoadingPayment, verifyPaymentStatus } = usePaymentStatusPolling();
  const [cryptoType, setCryptoType] = useState('');
  const [isVipTransaction, setIsVipTransaction] = useState(false);
  const [easyReadMode, setEasyReadMode] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(210);
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();

  const qrCodeSize = easyReadMode ? 340 : 280;

  // Mock de pixKey para teste
  const mockPixKey =
    '00020126580014br.gov.bcb.pix013636401f28-9a12-4c4a-b5d5-1234567890ab5204000053039865802BR5925TESTE ALFRED BITCOIN6009SAO PAULO62140510ABC12345676304ABCD';
  const displayPixKey = pixKey || mockPixKey;

  useEffect(() => {
    const storedTimeLeft = localStorage.getItem('timeLeft');
    if (storedTimeLeft) {
      setLocalTimeLeft(parseInt(storedTimeLeft, 10));
    } else {
      localStorage.setItem('timeLeft', '210');
    }

    const timer = setInterval(() => {
      setLocalTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        localStorage.setItem('timeLeft', newTime.toString());

        if (newTime <= 0) {
          clearInterval(timer);
          navigate(ROUTES.paymentAlfredStatus.failure.call(currentLang));
        }

        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [navigate, currentLang]);

  useEffect(() => {
    const storedCryptoType = localStorage.getItem('cryptoType');
    if (storedCryptoType) {
      setCryptoType(storedCryptoType);
    } else {
      // Mock para teste
      setCryptoType('BITCOIN');
    }

    const vipFlag = localStorage.getItem('isVipTransaction');
    if (vipFlag === 'true' && displayPixKey?.includes('vip@depix.info')) {
      setIsVipTransaction(true);
    } else {
      setIsVipTransaction(false);
    }
  }, [displayPixKey]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(displayPixKey ?? '');
    toast.success(t('buycheckout.copyPixKey'));
  };

  const toggleEasyReadMode = () => {
    setEasyReadMode(!easyReadMode);
  };

  return (
    <div className="flex flex-col items-center pt-4">
      <h3 className="text-red-600 text-3xl font-semibold mb-2">
        {t('buycheckout.attention')}
      </h3>

      {isVipTransaction && (
        <div className="bg-green-700 text-white p-3 rounded-lg mb-4">
          Usuário VIP - Pagamento Prioritário
          <div className="text-xs mt-1">
            Não há confirmação automática de pagamento para usuários VIP.
          </div>
        </div>
      )}

      <p className="text-lg text-center text-gray-100 mb-4">
        {t('buycheckout.instruction')}
      </p>
      <p className="text-center text-red-600">
        {t('buycheckout.timeRemaining')}: {Math.floor(localTimeLeft / 60)}:
        {localTimeLeft % 60 < 10 && '0'}
        {localTimeLeft % 60} {t('buycheckout.minutes')}
      </p>

      {!isVipTransaction && (
        <button
          onClick={verifyPaymentStatus}
          disabled={isLoadingPayment}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-all duration-300 shadow-md mb-8"
        >
          {isLoadingPayment
            ? t('buycheckout.verifying')
            : t('buycheckout.makePayment')}
        </button>
      )}

      <p className="text-xl text-center text-white">
        {t('buycheckout.scanQRCode')}
      </p>
      <div className="relative flex justify-center items-center p-4">
        <div
          className="relative rounded-lg shadow-lg"
          style={{
            backgroundColor: 'white',
            padding: '1px',
            transform: easyReadMode ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s ease',
          }}
        >
          <div className="relative">
            <QRCodeSVG
              value={displayPixKey ?? ''}
              size={qrCodeSize}
              level="H"
              marginSize={2}
              className="z-0"
              bgColor="white"
            />

            {/* LOGO CENTRALIZADA SOBRE O QR CODE */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Círculo branco central */}
              <div
                style={{
                  width: easyReadMode ? 70 : 80,
                  height: easyReadMode ? 70 : 80,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: '50%',
                  position: 'absolute',
                  zIndex: 10,
                }}
              />
              {/* Logo centralizada, maior que o círculo */}
              <img
                src={AlfredQr}
                alt={t('buycheckout.alfredLogoAlt')}
                style={{
                  width: easyReadMode ? 110 : 140, // ajuste aqui para o tamanho desejado
                  height: easyReadMode ? 110 : 140,
                  objectFit: 'contain',
                  borderRadius: '50%',
                  zIndex: 20,
                  position: 'relative',
                }}
              />
            </div>

            {/* Aviso de compra em bitcoin */}
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{
                top: '38px', // aumenta a distância do topo
              }}
            >
              <span
                className="text-xs font-bold px-2 py-1 rounded"
                style={{
                  color: '#dc2626',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  fontSize: '11px', // aumenta o tamanho da fonte
                  whiteSpace: 'nowrap',
                }}
              >
                {t('buycheckout.bitcoinPurchaseWarning')}{' '}
                {cryptoType === 'BITCOIN' ? 'Bitcoin' : cryptoType}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={toggleEasyReadMode}
        className="text-sm mt-2 mb-4 px-4 py-2 rounded-md bg-[#000E16] text-white border border-[#F39200]"
      >
        {easyReadMode
          ? t('buycheckout.normalQrMode')
          : t('buycheckout.easyQrMode')}
      </button>

      <textarea
        value={displayPixKey ?? ''}
        readOnly
        className="border border-[#F39200] px-4 py-3 rounded-2xl text-base text-white bg-[#000E16] w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl overflow-hidden"
        rows={4}
      />

      <button
        onClick={handleCopyToClipboard}
        className="pt-4 px-6 py-3 bg-[#F39200] text-white rounded-3xl font-bold m-3 mb-[5%]"
      >
        {t('buycheckout.copyPixKey')}
      </button>
    </div>
  );
}
