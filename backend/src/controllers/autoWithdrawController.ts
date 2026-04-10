
import { Request, Response } from 'express';
import autoWithdrawService from '../services/autoWithdrawService';
import { logger } from '../utils/logger';

const MAX_WITHDRAWAL = Number(process.env.MAX_WITHDRAWAL || '10000');

class AutoWithdrawController {
  async autoWithdraw(req: Request, res: Response) {
    try {
const userId = req.user.userId;

      const { bankUsername, bankPassword, amount } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!bankUsername || !bankPassword || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields (bankUsername, bankPassword, amount)',
        });
      }

      const amt = Number(amount);

      if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
      }

      if (amt > MAX_WITHDRAWAL) {
        return res.status(400).json({
          success: false,
          message: `Amount exceeds maximum withdrawal limit (${MAX_WITHDRAWAL} PS)`,
        });
      }

      logger.info(
        `🚀 Auto withdraw request: user=${userId}, amount=${amt} PS`
      );

      const result = await autoWithdrawService.withdrawAndReserve(
        userId,          
        bankUsername,
        bankPassword,
        amt
      );

      return res.json(result);
    } catch (error: any) {
      logger.error(
        '❌ Auto withdraw controller error:',
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        message: error?.message || 'Auto withdraw failed',
      });
    }
  }
}

export default new AutoWithdrawController();
