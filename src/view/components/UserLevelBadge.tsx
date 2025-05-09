import { Popover, Transition } from '@headlessui/react';
import {
  ChevronDoubleUpIcon,
  FireIcon,
  LockClosedIcon,
  LockOpenIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserLevel } from '../hooks/useUserLevel';

interface UserLevelBadgeProps {
  compact?: boolean;
  className?: string; // Adicionada a prop className
}

export function UserLevelBadge({
  compact = false,
  className = '',
}: UserLevelBadgeProps) {
  const { userLevel, userLevelName, getUserLevelInfo } = useUserLevel();
  const levelInfo = getUserLevelInfo();
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const getBadgeColor = () => {
    switch (userLevel) {
      case 0:
        return {
          bg: 'from-gray-600 to-gray-800',
          text: 'text-gray-200',
          icon: <FireIcon className="w-4 h-4 text-gray-300" />,
        };
      case 1:
        return {
          bg: 'from-amber-700 to-amber-900',
          text: 'text-amber-100',
          icon: <FireIcon className="w-4 h-4 text-amber-300" />,
        };
      case 2:
        return {
          bg: 'from-gray-400 to-gray-600',
          text: 'text-white',
          icon: <StarIcon className="w-4 h-4 text-gray-100" />,
        };
      case 3:
        return {
          bg: 'from-yellow-500 to-amber-600',
          text: 'text-white',
          icon: <StarIcon className="w-4 h-4 text-yellow-300" />,
        };
      case 4:
        return {
          bg: 'from-blue-500 to-blue-700',
          text: 'text-white',
          icon: <StarIcon className="w-4 h-4 text-blue-200" />,
        };
      case 5:
        return {
          bg: 'from-violet-500 to-purple-700',
          text: 'text-white',
          icon: <StarIcon className="w-4 h-4 text-violet-200" />,
        };
      default:
        return {
          bg: 'from-gray-600 to-gray-800',
          text: 'text-gray-200',
          icon: <FireIcon className="w-4 h-4 text-gray-300" />,
        };
    }
  };

  if (!levelInfo) return null;

  // Estrutura para definir os próximos níveis e seus requisitos
  const levelProgression = [
    {
      level: 0,
      name: 'Madeira',
      description: t('userLevels.madeira.description'),
      requirements: t('userLevels.madeira.validation'),
      icon: '🪵',
    },
    {
      level: 1,
      name: 'Bronze',
      description: t('userLevels.bronze.description'),
      requirements: t('userLevels.bronze.requirements'),
      icon: '🥉',
    },
    {
      level: 2,
      name: 'Prata',
      description: t('userLevels.prata.description'),
      requirements: t('userLevels.prata.requirements'),
      icon: '🥈',
    },
    {
      level: 3,
      name: 'Ouro',
      description: t('userLevels.ouro.description'),
      requirements: t('userLevels.ouro.requirements'),
      icon: '🥇',
    },
    {
      level: 4,
      name: 'Diamante',
      description: t('userLevels.diamante.description'),
      requirements: t('userLevels.diamante.requirements'),
      icon: '💎',
    },
    {
      level: 5,
      name: 'Platina',
      description: t('userLevels.platina.description'),
      requirements: t('userLevels.platina.requirements'),
      icon: '🏆',
    },
  ];

  // Encontra o próximo nível (se não for o último)
  const nextLevel = userLevel < 5 ? levelProgression[userLevel + 1] : null;
  const colorTheme = getBadgeColor();

  if (compact) {
    return (
      <div className={`user-level-badge ${className}`}>
        <div
          className={`px-2 py-0.5 rounded-full text-white text-xs bg-gradient-to-r ${colorTheme.bg} flex items-center gap-1 shadow-lg`}
        >
          {colorTheme.icon}
          <span>{userLevelName}</span>
        </div>
      </div>
    );
  }

  return (
    <Popover className="relative w-full max-w-xs mx-auto">
      {({ open }) => (
        <>
          <Popover.Button
            className={`bg-gradient-to-r ${colorTheme.bg} px-4 py-2 rounded-full ${colorTheme.text} text-sm font-medium w-full text-center flex items-center justify-center gap-2 hover:shadow-lg hover:opacity-90 transition-all duration-300 border border-gray-700`}
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="flex items-center gap-2">
              {colorTheme.icon}
              <span>Nível {userLevelName}</span>
            </span>
            <ChevronDoubleUpIcon
              className={`h-4 w-4 transition-transform duration-300 ${open ? 'transform rotate-180' : ''}`}
              aria-hidden="true"
            />
          </Popover.Button>

          <div className="text-xs text-gray-300 mt-2 mb-2 text-center flex justify-between items-center px-1">
            <span>{levelProgression[userLevel].icon}</span>
            <span>Limite diário: {levelInfo.formattedDailyLimit}</span>
            <span>{nextLevel ? nextLevel.icon : '🔝'}</span>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <Popover.Panel className="absolute z-50 w-full sm:w-[350px] mt-2 transform -translate-x-1/2 left-1/2 sm:left-auto sm:translate-x-0">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 backdrop-blur-sm">
                <div className="relative bg-gray-900 bg-opacity-95 p-4">
                  <div className="space-y-4 text-sm">
                    {/* Seu nível atual */}
                    <div>
                      <h3 className="font-bold text-white border-b border-gray-700 pb-1 flex items-center justify-between">
                        <span>
                          {t('userLevels.title')} - {userLevelName}
                        </span>
                        <span className="text-xl">
                          {levelProgression[userLevel].icon}
                        </span>
                      </h3>
                      <div className="mt-3">
                        <div className="relative h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colorTheme.bg}`}
                            style={{
                              width: `${(userLevel / 5) * 100}%`,
                              transition: 'width 1.5s ease-in-out',
                            }}
                          />
                          {/* Marcadores de níveis na barra */}
                          {[0, 1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`absolute top-0 bottom-0 flex items-center justify-center w-2 h-2 rounded-full transform -translate-x-1/2
                                         ${level <= userLevel ? 'bg-white' : 'bg-gray-500'}`}
                              style={{ left: `${(level / 5) * 100}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                          {levelProgression.map((level) => (
                            <span key={level.level} className="relative">
                              {level.level <= userLevel ? (
                                <LockOpenIcon className="w-3 h-3 text-green-400" />
                              ) : (
                                <LockClosedIcon className="w-3 h-3 text-red-400" />
                              )}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-300 mt-2 text-sm">
                          {levelProgression[userLevel].description}
                        </p>
                      </div>
                    </div>

                    {/* Seus benefícios atuais */}
                    <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">
                        Seus benefícios:
                      </h4>
                      <ul className="mt-1 space-y-2">
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          Limite diário: {levelInfo.formattedDailyLimit}
                        </li>
                        {userLevel >= 2 && (
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Acesso a TED
                          </li>
                        )}
                        {userLevel >= 3 && (
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Acesso a depósito em espécie
                          </li>
                        )}
                        {userLevel >= 4 && (
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Acesso a todos os métodos de pagamento
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Próximo nível */}
                    {nextLevel && (
                      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3">
                        <h4 className="font-semibold text-white mb-2 flex items-center justify-between">
                          <span>Próximo nível: {nextLevel.name}</span>
                          <span className="text-xl">{nextLevel.icon}</span>
                        </h4>
                        <div className="space-y-2 mt-1">
                          <p className="text-gray-300">
                            {nextLevel.description}
                          </p>
                          <p className="text-sm mt-2">
                            <span className="font-medium text-yellow-500">
                              Requisitos:
                            </span>
                            <span className="text-gray-400 ml-1">
                              {nextLevel.requirements}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
