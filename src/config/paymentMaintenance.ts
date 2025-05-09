/**
 * Configurações de manutenção dos métodos de pagamento
 *
 * Quando um método está em manutenção, o comportamento muda:
 * - O método aparecerá desativado na interface
 * - Um aviso será exibido informando que está em manutenção
 * - O processamento será redirecionado para WhatsApp
 * - O método será salvo no banco com sufixo "_MAINTENANCE" para rastreamento
 */

export const paymentMaintenanceConfig = {
  // Controla se o PIX está em manutenção
  PIX_MAINTENANCE: true,

  // Mensagem exibida quando o PIX está em manutenção
  PIX_MAINTENANCE_MESSAGE:
    'O pagamento por PIX está temporariamente em manutenção. Sua compra será processada via WhatsApp.',

  // Permite adicionar outros métodos de pagamento em manutenção no futuro
  // TICKET_MAINTENANCE: false,
  // WISE_MAINTENANCE: false,
};

/**
 * Verifica se um método de pagamento está em manutenção
 * @param method O método de pagamento a ser verificado
 * @returns true se o método estiver em manutenção
 */
export function isPaymentMethodInMaintenance(method: string): boolean {
  return !!paymentMaintenanceConfig[
    `${method}_MAINTENANCE` as keyof typeof paymentMaintenanceConfig
  ];
}

/**
 * Retorna a mensagem de manutenção para um método específico
 * @param method O método de pagamento
 * @returns A mensagem de manutenção configurada ou uma mensagem padrão
 */
export function getMaintenanceMessage(method: string): string {
  const messageKey =
    `${method}_MAINTENANCE_MESSAGE` as keyof typeof paymentMaintenanceConfig;
  return (
    (paymentMaintenanceConfig[messageKey] as string) ||
    `O pagamento por ${method} está temporariamente em manutenção. Sua compra será processada via WhatsApp.`
  );
}
