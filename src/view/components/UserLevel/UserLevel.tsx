import { useEffect, useRef, useState } from 'react';
import { FaCrown, FaGem, FaMedal, FaTree, FaTrophy } from 'react-icons/fa';

const levels = [
  {
    name: 'Nível Madeira',
    icon: <FaTree className="text-green-500" />,
    description: 'Até 3 transferências. Limite de R$ 5.000 por dia.',
    requirements: 'Nenhum requisito adicional.',
  },
  {
    name: 'Nível Bronze',
    icon: <FaMedal className="text-yellow-500" />,
    description: 'Libera TED e limite até R$ 10.000.',
    requirements: 'Realizar 3 compras.',
  },
  {
    name: 'Nível Prata',
    icon: <FaCrown className="text-gray-400" />,
    description: 'Libera depósito em espécie e limite de R$ 35.000.',
    requirements: 'Realizar 4 compras e transacionar R$ 50.000.',
  },
  {
    name: 'Nível Ouro',
    icon: <FaCrown className="text-yellow-400" />,
    description:
      'Liberação de todos os meios de pagamento e limite de R$ 50.000.',
    requirements: 'Transacionar R$ 100.000.',
  },
  {
    name: 'Nível Diamante',
    icon: <FaGem className="text-blue-500" />,
    description: 'Limite de R$ 150.000.',
    requirements: 'Transacionar R$ 250.000.',
  },
  {
    name: 'Nível Platina',
    icon: <FaTrophy className="text-purple-500" />,
    description: 'Limite de R$ 500.000.',
    requirements: 'Transacionar R$ 500.000.',
  },
];

export function UserLevel() {
  const [userLevel, setUserLevel] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserLevel(user.userLevel || 0);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setActiveTooltip(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTooltip = (index: number) => {
    setActiveTooltip((prev) => (prev === index ? null : index));
  };

  const currentLevel = levels[userLevel];
  const nextLevel = levels[userLevel + 1];

  return (
    <div className="flex flex-row items-center gap-4" ref={tooltipRef}>
      {/* Ícone do nível atual com tooltip */}
      <div
        className="relative group cursor-pointer"
        onClick={() => toggleTooltip(-1)} // -1 para diferenciar do índice dos pontos
      >
        <div className="flex items-center justify-center">
          {currentLevel.icon}
        </div>
        {(activeTooltip === -1 || activeTooltip === null) && (
          <div className="absolute z-10 hidden group-hover:flex flex-col items-start p-4 bg-black text-white rounded shadow-lg left-full ml-2 transition-all duration-300 w-64">
            <p className="text-base font-semibold mb-2">
              <strong>Nível atual:</strong> {currentLevel.name}
            </p>
            <p className="text-sm mb-2">{currentLevel.description}</p>
            {nextLevel && (
              <>
                <hr className="my-2 border-gray-600 w-full" />
                <p className="text-base font-semibold mb-1">
                  <strong>Próximo nível:</strong> {nextLevel.name}
                </p>
                <p className="text-sm">
                  <strong>Requisitos:</strong> {nextLevel.requirements}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Barra de progresso com pontos */}
      <div className="flex flex-row items-center gap-2">
        {levels.map((level, index) => (
          <div
            key={index}
            className="relative group"
            onClick={(e) => {
              e.stopPropagation(); // Evita interferência com outros cliques
              toggleTooltip(index);
            }}
          >
            {/* Ponto do nível */}
            <div
              className={`h-4 w-4 rounded-full ${
                index <= userLevel ? 'bg-green-500' : 'bg-gray-400'
              }`}
            ></div>
            {/* Tooltip com animação */}
            {(activeTooltip === index || activeTooltip === null) && (
              <div className="absolute inset-0 flex flex-col items-center group-hover:flex">
                {/* Ícone animado acima */}
                <div
                  className={`${
                    activeTooltip === index
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  } transform ${
                    activeTooltip === index
                      ? '-translate-y-4'
                      : 'group-hover:-translate-y-4'
                  } transition-all duration-300`}
                >
                  {level.icon}
                </div>
                {/* Texto animado abaixo */}
                <div
                  className={`${
                    activeTooltip === index
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  } transform ${
                    activeTooltip === index
                      ? 'translate-y-4'
                      : 'group-hover:translate-y-4'
                  } transition-all duration-300 mt-2 p-2 bg-black text-white rounded shadow-lg text-center`}
                >
                  <p className="text-sm font-bold">{level.name}</p>
                  <p className="text-xs">{level.description}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
