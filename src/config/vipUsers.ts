import { axiosInstance } from '@/infrastructure/api/axiosInstance';
import axios from 'axios';

/**
 * Configuração de usuários VIP que possuem tratamento especial
 * Este arquivo pode ser facilmente removido no futuro
 */

/**
 * Busca o ID do usuário atual no localStorage
 * @returns ID do usuário ou undefined se não encontrado
 */
export const getCurrentUserId = (): string | undefined => {
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userData = JSON.parse(userString);
      return userData.id;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Verifica se um usuário é VIP com base na rota do backend
 * @returns true se o usuário for VIP, false caso contrário
 */
export const isVipUser = async (): Promise<boolean> => {
  try {
    const userString = localStorage.getItem('user');
    if (!userString) {
      return false;
    }

    const userData = JSON.parse(userString);
    const accessToken = userData?.acessToken;

    if (!accessToken) {
      return false;
    }

    const response = await axiosInstance.post(
      `/auth/is-vip`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.status === 201;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return false;
    }
    return false;
  }
};

/**
 * Calcula o valor CRC para o código PIX
 * @param payload String para calcular o CRC
 * @returns String CRC calculada
 */
const calculateCRC = (payload: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Gera um código PIX estático para usuários VIP
 * @param value Valor da transação
 * @returns Código PIX completo
 */
export const generateVipPixCode = (value: number): string => {
  const formattedValue = parseFloat(value.toString()).toFixed(2);
  const amountField =
    '54' + formattedValue.length.toString().padStart(2, '0') + formattedValue;

  const gui = 'BR.GOV.BCB.PIX';
  const guiField = '00' + gui.length.toString().padStart(2, '0') + gui;

  // Chave PIX como e-mail
  const pixKey = 'vip@depix.info';
  const pixKeyField = '01' + pixKey.length.toString().padStart(2, '0') + pixKey;

  const merchantAccountInfoValue = guiField + pixKeyField;
  const merchantAccountInfoField =
    '26' +
    merchantAccountInfoValue.length.toString().padStart(2, '0') +
    merchantAccountInfoValue;

  const merchantCategoryCode = '52040000';
  const transactionCurrency = '5303986';

  const countryCode = '5802BR';

  const merchantName = 'N';
  const merchantNameField =
    '59' + merchantName.length.toString().padStart(2, '0') + merchantName;

  const merchantCity = 'C';
  const merchantCityField =
    '60' + merchantCity.length.toString().padStart(2, '0') + merchantCity;

  const txid = '***';
  const txidField = '05' + txid.length.toString().padStart(2, '0') + txid;
  const additionalDataValue = txidField;
  const additionalDataField =
    '62' +
    additionalDataValue.length.toString().padStart(2, '0') +
    additionalDataValue;

  const payload =
    '000201' +
    merchantAccountInfoField +
    merchantCategoryCode +
    transactionCurrency +
    amountField +
    countryCode +
    merchantNameField +
    merchantCityField +
    additionalDataField +
    '63' +
    '04';

  const crc = calculateCRC(payload);
  return payload + crc;
};
