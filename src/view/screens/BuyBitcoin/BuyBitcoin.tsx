import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Btc from '../../assets/bitcoin.svg';
import Brl from '../../assets/brl.svg';
import Alfred from '../../assets/image-alfred-removebg-preview.png';
import { BackgroundAnimatedProduct } from '../../components/BackgroundAnimatedProduct';
import WhatsAppButton from '../../components/buttonWhatsApp';
import { ROUTES } from '../../routes/Routes';
import { useCurrentLang } from '../../utils/useCurrentLang';
import HeaderAlfred from './HeaderAlfred';

export default function BuyBitcoinAndCheckout() {
  const navigate = useNavigate();
  const { currentLang } = useCurrentLang();

  const [brlAmount, setBrlAmount] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [btcRate, setBtcRate] = useState(0);

  useEffect(() => {
    const fetchBitcoinRate = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl',
        );
        const data = await response.json();
        setBtcRate(data.bitcoin.brl);
      } catch (error) {
        console.error('Error fetching Bitcoin rate:', error);
      }
    };

    fetchBitcoinRate();
  }, []);

  const formatBrl = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue ? parseInt(numericValue, 10).toString() : '';
  };

  const handleBrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/^\d+$/.test(value) || value === '') {
      const numericValue = parseInt(value, 10);
      setBrlAmount(formatBrl(value));

      if (btcRate > 0 && numericValue >= 0) {
        setBtcAmount((numericValue / btcRate).toFixed(8));
      }
    } else {
      e.preventDefault();
    }
  };

  const handleNextStep = () => {
    const numericValue = parseInt(brlAmount, 10);

    if (numericValue >= 700 && numericValue <= 5000) {
      localStorage.setItem('brlAmount', brlAmount);
      localStorage.setItem('btcAmount', btcAmount);
      navigate(ROUTES.buyCheckout.call(currentLang));
    } else if (numericValue >= 5000) {
      alert('O valor é maior que R$5000.Insira um valor abaixo de R$5000.');
    } else {
      alert(
        'O valor deve ser maior que R$700 e menor que R$5000 para prosseguir.',
      );
    }
  };

  return (
    <div>
      <BackgroundAnimatedProduct />
      <HeaderAlfred />
      <div className="pt-[10%] pb-[10%] flex items-center justify-center mt-[10%] sm:mt-[0%]">
        <h1 className="text-[#F6911D] dark:text-[#F6911D] font-black text-7xl flex items-center">
          <img
            src={Alfred}
            alt="Image-alfred"
            className="mr-2 w-[20%] max-w-[100px]"
          />
          ALFRED
        </h1>
      </div>

      <div className="flex justify-center">
        <div>
          {/* Input para valor em BRL */}
          <div className="flex justify-center items-center space-x-4">
            <div className="relative">
              <input
                value={brlAmount}
                onChange={handleBrlChange}
                placeholder="Digite o valor em BRL"
                className="border pl-20 pr-20 py-3 rounded-3xl text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 text-center no-arrows"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white px-4 rounded-full">
                <img src={Brl} alt="BRL" className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* Input para valor em BTC */}
          <div className="flex justify-center items-center pt-4">
            <div className="relative">
              <input
                value={btcAmount}
                readOnly
                placeholder="Valor em BTC"
                className="border pl-20 pr-20 py-3 rounded-3xl text-lg text-black dark:text-white bg-slate-100 dark:bg-slate-700 text-center no-arrows"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white px-4 rounded-full">
                <img src={Btc} alt="Bitcoin" className="w-8 h-8" />
              </button>
            </div>
          </div>

          {/* Botão de prosseguir */}
          <div className="flex justify-center items-center pt-4">
            <button
              onClick={handleNextStep}
              type="button"
              className="w-full h-12 bg-[#F6911D] text-black dark:text-white rounded-3xl font-bold"
            >
              Prosseguir
            </button>
          </div>
        </div>
        <WhatsAppButton />
      </div>
    </div>
  );
}
