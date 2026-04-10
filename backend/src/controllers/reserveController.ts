
import { Request, Response } from 'express';
import reserveService from '../services/reserveService';
import { logger } from '../utils/logger';

class ReserveController {
  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      logger.info(`📜 Fetching reserves for user ${userId}`);

      const reserves = await reserveService.listReserves(userId);

      return res.json({ 
        success: true, 
        data: {
          reserves,
          count: reserves.length,
        }
      });
    } catch (error: any) {
      logger.error('❌ Error listing reserves:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch reserves' 
      });
    }
  }
}

export default new ReserveController();