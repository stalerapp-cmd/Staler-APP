
import { Request, Response } from 'express';
import depositService from '../services/depositService';
import { logger } from '../utils/logger';

const MAX_DEPOSIT = Number(process.env.MAX_DEPOSIT || '10000');

class DepositController {
 
  async depositToBank(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { amount } = req.body;

      if (!userId || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: amount',
        });
      }

      const amt = Number(amount);
      
      if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
      }

      if (amt > MAX_DEPOSIT) {
        return res.status(400).json({
          success: false,
          message: `Amount exceeds maximum deposit limit (${MAX_DEPOSIT} PS)`,
        });
      }

      logger.info(`💰 Deposit request: user=${userId}, amount=${amt} PS (using linked bank account)`);

      const result = await depositService.depositToBank(userId, amt);

      return res.json(result);
    } catch (error: any) {
      logger.error('❌ Deposit controller error:', error.message);
      
      if (error.message.includes('No linked bank account')) {
        return res.status(400).json({
          success: false,
          message: 'No linked bank account found. Please link your bank account in Profile settings.',
          code: 'NO_BANK_ACCOUNT'
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Deposit failed',
      });
    }
  }
}

export default new DepositController();