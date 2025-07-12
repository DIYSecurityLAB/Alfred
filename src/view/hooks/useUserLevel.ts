import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export interface UserLevelRestrictions {
  dailyLimit: number;
  totalTransactionsLimit: number;
  canUseTed: boolean;
  canUseWhatsApp: boolean;
  canUseCash: boolean;
  canUseBoleto: boolean;
  canUseAllPaymentMethods: boolean;
}

export function useUserLevel() {
  const { user } = useAuth();
  const [restrictions, setRestrictions] = useState<UserLevelRestrictions>({
    dailyLimit: 500,
    totalTransactionsLimit: 2,
    canUseTed: false,
    canUseWhatsApp: false,
    canUseCash: false,
    canUseBoleto: false,
    canUseAllPaymentMethods: false,
  });

  useEffect(() => {
    if (!user) return;

    // Define as restrições com base no nível do usuário
    switch (user.level) {
      case 0: // Madeira
        setRestrictions({
          dailyLimit: 500,
          totalTransactionsLimit: 2,
          canUseTed: false,
          canUseWhatsApp: false,
          canUseCash: false,
          canUseBoleto: false,
          canUseAllPaymentMethods: false,
        });
        break;
      case 1: // Bronze
        setRestrictions({
          dailyLimit: 5000,
          totalTransactionsLimit: 999, // Sem limite prático
          canUseTed: false,
          canUseWhatsApp: false,
          canUseCash: false,
          canUseBoleto: false,
          canUseAllPaymentMethods: false,
        });
        break;
      case 2: // Prata
        setRestrictions({
          dailyLimit: 10000,
          totalTransactionsLimit: 999,
          canUseTed: true,
          canUseWhatsApp: true,
          canUseCash: false,
          canUseBoleto: true,
          canUseAllPaymentMethods: false,
        });
        break;
      case 3: // Ouro
        setRestrictions({
          dailyLimit: 35000,
          totalTransactionsLimit: 999,
          canUseTed: true,
          canUseWhatsApp: true,
          canUseCash: true,
          canUseBoleto: true,
          canUseAllPaymentMethods: false,
        });
        break;
      case 4: // Diamante
        setRestrictions({
          dailyLimit: 50000,
          totalTransactionsLimit: 999,
          canUseTed: true,
          canUseWhatsApp: true,
          canUseCash: true,
          canUseBoleto: true,
          canUseAllPaymentMethods: true,
        });
        break;
      case 5: // Platina
        setRestrictions({
          dailyLimit: 150000,
          totalTransactionsLimit: 999,
          canUseTed: true,
          canUseWhatsApp: true,
          canUseCash: true,
          canUseBoleto: true,
          canUseAllPaymentMethods: true,
        });
        break;
      default:
        // Padrão para níveis desconhecidos (mesmo que Madeira)
        setRestrictions({
          dailyLimit: 500,
          totalTransactionsLimit: 2,
          canUseTed: false,
          canUseWhatsApp: false,
          canUseCash: false,
          canUseBoleto: false,
          canUseAllPaymentMethods: false,
        });
    }
  }, [user]);

  // Função para verificar se um valor está dentro do limite diário
  const isWithinDailyLimit = (amount: number): boolean => {
    if (!user) return false;
    return amount <= restrictions.dailyLimit;
  };

  // Função para verificar se o usuário pode usar TED
  const canUseTed = (): boolean => {
    return restrictions.canUseTed;
  };

  // Função para verificar se o usuário pode fazer depósito em espécie
  const canUseCash = (): boolean => {
    return restrictions.canUseCash;
  };

  // Função para verificar se o usuário pode usar boleto
  const canUseBoleto = (): boolean => {
    return restrictions.canUseBoleto;
  };

  // Função para verificar se um método de pagamento está disponível para o nível do usuário
  const isPaymentMethodAllowed = (method: string): boolean => {
    if (restrictions.canUseAllPaymentMethods) return true;

    switch (method) {
      case 'PIX':
        return true; // PIX disponível para todos os níveis
      case 'TED':
      case 'BANK_TRANSFER':
        return restrictions.canUseTed;
      case 'CASH':
        return restrictions.canUseCash;
      case 'TICKET':
        return restrictions.canUseBoleto;
      case 'NOMAD':
      case 'SWIFT':
      case 'PAYPAL':
        return true; // Métodos internacionais disponíveis para todos
      default:
        return false;
    }
  };

  // Função para obter informações formatadas sobre o nível
  const getUserLevelInfo = () => {
    if (!user) return null;

    return {
      level: user.level,
      levelName: user.levelName,
      dailyLimit: restrictions.dailyLimit,
      formattedDailyLimit: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(restrictions.dailyLimit),
      restrictions,
    };
  };

  return {
    userLevel: user?.level || 0,
    userLevelName: user?.levelName || 'Madeira',
    restrictions,
    isWithinDailyLimit,
    canUseTed,
    canUseCash,
    canUseBoleto,
    isPaymentMethodAllowed,
    getUserLevelInfo,
  };
}
