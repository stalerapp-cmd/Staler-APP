
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import walletService from '../services/walletService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticateToken);


router.post('/claim', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId; // number
    const { exchangeWalletId, amount, description, timestamp } = req.body;

    logger.info(`📥 Exchange claim request from user ${userId}`);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!exchangeWalletId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Exchange wallet ID and amount are required',
      });
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const userWallet = await walletService.getWalletByUserId(userId);
    if (!userWallet) {
      return res.status(404).json({
        success: false,
        message: 'Your wallet not found',
      });
    }

    const { data: exchangeWallet, error } = await supabase
      .from('wallets')
      .select(`
        wallet_id,
        balance,
        users!inner(id, role, full_name)
      `)
      .eq('wallet_id', exchangeWalletId)
      .single();

    if (error || !exchangeWallet) {
      return res.status(404).json({
        success: false,
        message: 'Exchange wallet not found',
      });
    }

    const exchangeUser = exchangeWallet.users?.[0];

    if (!exchangeUser) {
      return res.status(500).json({
        success: false,
        message: 'Exchange user not found',
      });
    }

    if (exchangeUser.role !== 'exchange') {
      return res.status(403).json({
        success: false,
        message: 'This wallet does not belong to an exchange',
      });
    }

    const exchangeBalance = Number(exchangeWallet.balance);
    if (exchangeBalance < amountNum) {
      return res.status(400).json({
        success: false,
        message: `Insufficient exchange balance. Available: ${exchangeBalance} PS`,
      });
    }

    if (exchangeWallet.wallet_id === userWallet.wallet_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot claim from yourself',
      });
    }

    if (timestamp) {
      const now = Date.now();
      const qrAge = now - Number(timestamp);
      const maxAge = 60 * 1000; 

      if (qrAge > maxAge) {
        return res.status(400).json({
          success: false,
          message: 'QR code expired. Please scan a fresh code.',
        });
      }
    }

    await walletService.updateBalance(exchangeWallet.wallet_id, -amountNum);
    await walletService.updateBalance(userWallet.wallet_id, amountNum);

    await walletService.recordTransaction({
      userId: exchangeUser.id,
      walletId: exchangeWallet.wallet_id,
      type: 'exchange_payout',
      amount: -amountNum,
      status: 'completed',
      description: description || 'Exchange payout',
      fromAccount: exchangeWallet.wallet_id,
      toAccount: userWallet.wallet_id,
    });

    await walletService.recordTransaction({
      userId,
      walletId: userWallet.wallet_id,
      type: 'exchange_deposit',
      amount: amountNum,
      status: 'completed',
      description: description || 'Exchange deposit',
      fromAccount: exchangeWallet.wallet_id,
      toAccount: userWallet.wallet_id,
    });

    logger.info(
      `✅ Exchange claim: ${amountNum} PS from ${exchangeWallet.wallet_id} to ${userWallet.wallet_id}`
    );

    return res.json({
      success: true,
      message: 'Funds claimed successfully',
      data: {
        amount: amountNum,
        from: exchangeUser.full_name,
        to: userWallet.wallet_id,
        newBalance: Number(userWallet.balance) + amountNum,
      },
    });
  } catch (error: any) {
    logger.error('❌ Exchange claim error:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
