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
import AlfredImg from '../../assets/AlfredComercial.png';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { currentLang } = useLanguage();

  const handleRegister = async () => {
    if (username.length < 6 || password.length < 6) {
      toast.error('Nome de usuário e senha devem ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    try {
      await register(username, password);
      toast.success('Registrado com sucesso! Faça login agora.');
      setTimeout(() => {
        navigate(ROUTES.auth.login.call(currentLang));
      }, 2000);
    } catch (error: unknown) {
      console.error('Erro ao registrar:', error);
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).response?.status === 409
      ) {
        toast.error('Erro no registro. este nome de usuário ja existe.');
      } else {
        toast.error('Erro no registro. Contate o suporte.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Background />
      {isLoading && <Loader />}
      <ToastContainer />
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-screen-xl px-6 sm:px-12 md:px-20 lg:px-32 xl:px-40 flex flex-col lg:flex-row items-center justify-center">
          {/* Seção do Formulário */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
            <div className="mb-10 text-center text-white">
              <h1 className="text-4xl font-bold mb-6">Registro Seguro</h1>
              <AlfredLogo />
            </div>
            <div className="w-full">
              <div className="space-y-6">
                <input
                  className="border-2 px-16 py-3 rounded-3xl text-base sm:text-lg text-white placeholder-white bg-black text-center w-full"
                  placeholder="Usuário"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div className="relative">
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
                  Este registro é para sua segurança. Como é um sistema anônimo,
                  não há recuperação de senha. Guarde bem suas credenciais.
                </p>
                <button
                  className="w-full p-4 bg-[#F39200] text-white font-bold rounded-3xl hover:bg-[#e68800] transition-colors duration-200"
                  onClick={handleRegister}
                >
                  Registrar
                </button>
                <div className="mt-6 text-center">
                  <p className="text-white">
                    <span>Já tem uma conta? </span>
                    <span
                      className="text-[#F39200] font-bold cursor-pointer"
                      onClick={() =>
                        navigate(ROUTES.auth.login.call(currentLang))
                      }
                    >
                      Login
                    </span>
                  </p>
                </div>
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
