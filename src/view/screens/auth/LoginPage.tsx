import { useLanguage } from '@/domain/locales/Language';
import { Background } from '@/view/components/BackgroundAnimatedProduct';
import { Loader } from '@/view/components/Loader';
import { AlfredLogo } from '@/view/components/Logo/AlfredLogo';
import { useAuth } from '@/view/hooks/useAuth';
import { ROUTES } from '@/view/routes/Routes';
import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AlfredImg from '../../assets/AlfredComercial.png'; // imagem promocional do Alfred

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Controle de visibilidade da senha
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { currentLang } = useLanguage();

  const handleLogin = async () => {
    if (username.length < 6 || password.length < 6) {
      toast.error('Nome de usuário e senha devem ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      await login(username, password);
      // Exibir o nível do usuário após o login bem-sucedido
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        toast.success(
          `Login efetuado com sucesso. Nível: ${userData.levelName}`,
        );
      } else {
        toast.success('Login efetuado com sucesso.');
      }
      const brlAmount = localStorage.getItem('brlAmount');
      const cryptoAmount = localStorage.getItem('cryptoAmount');
      if (brlAmount && cryptoAmount) {
        navigate(ROUTES.buyCheckout.call(currentLang));
      } else {
        navigate(ROUTES.buyBitcoin.call(currentLang));
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro no login. Confira as credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Background />
      {isLoading && <Loader />}
      <ToastContainer />
      {/* Conteúdo principal centralizado */}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-screen-xl px-6 sm:px-12 md:px-20 lg:px-32 xl:px-40 flex flex-col lg:flex-row items-center justify-center">
          {/* Seção do Formulário */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
            <div className="mb-10 text-center text-white">
              <h1 className="text-4xl font-bold mb-6">Login Seguro</h1>
              <AlfredLogo />
            </div>
            <div className="w-full">
              <input
                className="border-2 px-16 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                placeholder="Usuário"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="relative mt-6">
                <input
                  className="border-2 px-16 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash size={20} />
                  ) : (
                    <FaEye size={20} />
                  )}
                </button>
              </div>
              <p className="text-white text-xs mt-4 text-center">
                Este login é para sua segurança. Como é um sistema seguro, não
                há recuperação de senha. Guarde bem suas credenciais.
              </p>
              <button
                className="w-full mt-6 p-4 bg-[#F39200] text-white font-bold rounded-3xl hover:bg-[#e68800] transition-colors duration-200"
                onClick={handleLogin}
              >
                Entrar
              </button>
              <div className="mt-6 text-center">
                <p className="text-white">
                  <span>Não tem uma conta? </span>
                  <span
                    className="text-[#F39200] font-bold cursor-pointer"
                    onClick={() =>
                      navigate(ROUTES.auth.register.call(currentLang))
                    }
                  >
                    Registre-se
                  </span>
                </p>
              </div>
            </div>
          </div>
          {/* Seção da Imagem Promocional */}
          <div className="lg:w-1/2 w-full mt-10 lg:mt-0 flex justify-center">
            <img
              src={AlfredImg}
              alt="Imagem Promocional do Alfred"
              className="w-full max-w-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
