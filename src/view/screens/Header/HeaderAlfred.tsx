import { useLanguage } from '@/domain/locales/Language';
import { useContext, useEffect, useRef, useState } from 'react';
import { FaRobot } from 'react-icons/fa';
import { HiMenu, HiX } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { UserLevelBadge } from '../../components/UserLevelBadge';
import { AuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../routes/Routes';
import { NavLinks } from './NavLinks';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currentLang } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Fecha o dropdown e menu mobile ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="flex flex-col items-center justify-center w-full max-w-[100vw] transition-all duration-300 bg-transparent px-2 sm:px-4 py-4 sm:py-4 text-center">
      <nav
        aria-label="Global"
        className="w-full flex flex-row items-center justify-between md:justify-center flex-wrap gap-y-2 gap-x-8"
      >
        {/* Botão de menu para dispositivos móveis */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <HiMenu size={28} />
        </button>

        {/* Links de navegação para desktop */}
        <NavLinks isVisible={true} isLargeScreen={true} />

        <div className="flex items-center gap-4">
          <LanguageSwitcher
            className="flex justify-center"
            LabelClassName="text-xl sm:text-2xl lg:text-3xl font-pixelade items-center justify-center gap-x-2 font-extralight leading-6"
          />

          <div className="relative" ref={dropdownRef}>
            {user ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-x-2 text-white hover:text-gray-300 transition-all"
                >
                  <FaRobot size={24} />
                  <div className="flex flex-col items-start">
                    <span className=" font-pixelade inline text-2xl font-semibold">
                      {user.username}
                    </span>
                    {user.levelName && (
                      <div className="flex items-center mt-0.5">
                        <div
                          className={`w-2 h-2 rounded-full mr-1.5 ${getLevelColor(
                            user.level,
                          )}`}
                        ></div>
                        <span
                          className={`text-xs font-medium ${getLevelTextColor(
                            user.level,
                          )}`}
                        >
                          {user.levelName}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute top-14 right-0 bg-gray-800 border border-gray-700 shadow-xl rounded-xl
                  flex flex-col z-50 w-[280px] sm:w-[320px] max-w-[95vw]
                  transition-all duration-300 ease-in-out transform origin-top-right
                  animate-slideInDown backdrop-blur-md bg-opacity-90"
                  >
                    <div className="p-4 sm:p-5 w-full">
                      {/* Header do perfil com animação suave */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`mb-3 w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900
                      flex items-center justify-center border-2 ${getLevelTextColor(user.level)}/40
                      shadow-lg transform hover:scale-105 transition-transform duration-300`}
                        >
                          <FaRobot
                            size={36}
                            className={`${getLevelTextColor(user.level)} opacity-90`}
                          />
                        </div>
                        <span className="text-white font-bold text-xl mb-1">
                          {user.username}
                        </span>
                        <div
                          className={`px-4 py-1.5 rounded-full ${getLevelBgColor(
                            user.level,
                          )} ${getLevelTextColor(user.level)} font-medium text-sm
                        flex items-center gap-2 shadow-md`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${getLevelDotColor(
                              user.level,
                            )} animate-pulse`}
                          ></div>
                          Nível {user.levelName}
                        </div>
                      </div>

                      {/* Seção de progresso com design melhorado */}
                      <div
                        className="mt-4 bg-gradient-to-b from-gray-900 to-gray-800 p-4
                    rounded-lg shadow-inner border border-gray-700/50"
                      >
                        <h3
                          className="text-gray-300 font-medium text-center mb-3 text-sm uppercase
                      tracking-wider flex items-center justify-center gap-2"
                        >
                          <span className="h-0.5 w-5 bg-gray-500 rounded-full"></span>
                          Progresso de Nível
                          <span className="h-0.5 w-5 bg-gray-500 rounded-full"></span>
                        </h3>
                        <div className="transform transition-all hover:scale-[1.02] duration-300">
                          <UserLevelBadge />
                        </div>
                      </div>

                      {/* Botão de sair redesenhado */}
                      <button
                        onClick={handleLogout}
                        className="mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white
                py-2.5 rounded-md hover:from-red-700 hover:to-red-800
                transition-all w-full font-medium flex items-center
                justify-center gap-2 shadow-md text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate(ROUTES.auth.login.call(currentLang))}
                className="flex items-center gap-x-2 bg-transparent text-white hover:text-amber-400 transition-all px-4 py-2 rounded-md border border-transparent hover:border-amber-400"
              >
                <FaRobot size={24} />
                Faça login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Menu móvel */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-start justify-center pt-16"
        >
          <NavLinks
            isVisible={true}
            isLargeScreen={false}
            isMobileMenu={true}
            LinkCallBack={closeMobileMenu}
            closeButton={
              <button
                onClick={closeMobileMenu}
                className="text-white hover:text-red-500 transition-all"
              >
                <HiX size={28} />
              </button>
            }
          />
        </div>
      )}
    </header>
  );
}

// Definição de enumeração para os níveis
enum UserLevel {
  MADEIRA = 0,
  BRONZE = 1,
  PRATA = 2,
  OURO = 3,
  DIAMANTE = 4,
  PLATINA = 5,
}

// Interface para definir cores de nível
interface LevelColors {
  bg: string;
  text: string;
  badge: string;
  dot: string;
}

// Mapeamento de níveis para cores usando objeto constante
const LEVEL_COLORS: Record<UserLevel, LevelColors> = {
  [UserLevel.MADEIRA]: {
    bg: 'bg-gray-500',
    text: 'text-gray-300',
    badge: 'bg-gray-700',
    dot: 'bg-gray-400',
  },
  [UserLevel.BRONZE]: {
    bg: 'bg-amber-600',
    text: 'text-amber-300',
    badge: 'bg-amber-800',
    dot: 'bg-amber-400',
  },
  [UserLevel.PRATA]: {
    bg: 'bg-gray-300',
    text: 'text-gray-200',
    badge: 'bg-gray-600',
    dot: 'bg-gray-200',
  },
  [UserLevel.OURO]: {
    bg: 'bg-yellow-400',
    text: 'text-yellow-300',
    badge: 'bg-yellow-700',
    dot: 'bg-yellow-300',
  },
  [UserLevel.DIAMANTE]: {
    bg: 'bg-blue-400',
    text: 'text-blue-300',
    badge: 'bg-blue-700',
    dot: 'bg-blue-300',
  },
  [UserLevel.PLATINA]: {
    bg: 'bg-violet-400',
    text: 'text-violet-300',
    badge: 'bg-violet-700',
    dot: 'bg-violet-300',
  },
};

// Função auxiliar única para obter cores de nível
function getLevelStyle(level: number, styleType: keyof LevelColors): string {
  // Garantir que o nível está no intervalo válido
  const validLevel =
    level >= 0 && level <= 5 ? (level as UserLevel) : UserLevel.MADEIRA;
  return LEVEL_COLORS[validLevel][styleType];
}

// Funções simplificadas usando a função auxiliar
function getLevelColor(level: number): string {
  return getLevelStyle(level, 'bg');
}

function getLevelTextColor(level: number): string {
  return getLevelStyle(level, 'text');
}

function getLevelBgColor(level: number): string {
  return getLevelStyle(level, 'badge');
}

function getLevelDotColor(level: number): string {
  return getLevelStyle(level, 'dot');
}
