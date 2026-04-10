
import axios from 'axios';
import { logger } from '../utils/logger';

const BANK_URL = process.env.TALER_BANK_URL || 'http://localhost:8080';
const ADMIN_USER = process.env.TALER_BANK_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.TALER_BANK_ADMIN_PASSWORD || 'admin123';
const EXCHANGE_USER = process.env.TALER_EXCHANGE_USER || 'exchange';

class BankService {
 
  async getBankAccountInfo(bankUsername: string, bankPassword: string) {
    try {
      const res = await axios.get(
        `${BANK_URL}/accounts/${bankUsername}`,
        {
          auth: {
            username: bankUsername,
            password: bankPassword,
          },
        }
      );

      return res.data;
    } catch (error: any) {
      const msg =
        error?.response?.data?.hint ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch bank account info';

      logger.error('❌ getBankAccountInfo:', msg);
      throw new Error(msg);
    }
  }

  async checkBalance(
    bankUsername: string,
    bankPassword: string
  ): Promise<number> {
    try {
      const res = await axios.get(
        `${BANK_URL}/accounts/${bankUsername}`,
        {
          auth: {
            username: bankUsername,
            password: bankPassword,
          },
        }
      );

      const raw =
        res.data?.balance?.amount ??
        res.data?.balance ??
        'PS:0';

      const amount = Number(
        String(raw).split(':')[1] || '0'
      );

      logger.info(
        `💰 Bank balance for ${bankUsername}: ${amount} PS`
      );

      return amount;
    } catch (error: any) {
      const msg =
        error?.response?.data?.hint ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to check bank balance';

      logger.error('❌ checkBalance:', msg);
      throw new Error(msg);
    }
  }

  async getExchangePaytoUri(): Promise<string> {
    try {
      const res = await axios.get(
        `${BANK_URL}/accounts/${EXCHANGE_USER}`,
        {
          auth: {
            username: ADMIN_USER,
            password: ADMIN_PASS,
          },
        }
      );

      const payto =
        res.data?.payto_uri ||
        res.data?.payto;

      if (!payto) {
        throw new Error('Exchange payto_uri not found');
      }

      return payto;
    } catch (error: any) {
      const msg =
        error?.response?.data?.hint ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch exchange payto URI';

      logger.error('❌ getExchangePaytoUri:', msg);
      throw new Error(msg);
    }
  }
}

export default new BankService();
