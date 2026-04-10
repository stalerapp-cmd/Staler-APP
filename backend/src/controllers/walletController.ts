
import { Request, Response } from 'express';
import walletService from '../services/walletService';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/supabase';
class WalletController {

  async getWallet(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const wallet = await walletService.getWalletByUserId(userId);

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
      }

      return res.json({
        success: true,
        data: {
          wallet: {
            walletId: wallet.wallet_id,
            balance: Number(wallet.balance),
            currency: wallet.currency,
          },
        },
      });
    } catch (error: any) {
      logger.error('❌ Get wallet error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get wallet',
      });
    }
  }

 
  async getTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const transactions = await walletService.getTransactionHistory(userId);

      return res.json({
        success: true,
        data: {
          transactions: transactions.map((tx: any) => ({
            id: tx.id,
            type: tx.transaction_type,
            amount: Number(tx.amount),
            currency: tx.currency,
            status: tx.status,
            description: tx.description,
            fromAccount: tx.from_account,
            toAccount: tx.to_account,
            createdAt: tx.created_at,
          })),
        },
      });
    } catch (error: any) {
      logger.error('❌ Get transactions error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get transactions',
      });
    }
  }

  async transfer(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { toWalletId, amount, description } = req.body;

      if (!userId || !toWalletId || amount === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }

      const senderWallet = await walletService.getWalletByUserId(userId);
      if (!senderWallet) {
        return res.status(404).json({ success: false, message: 'Sender wallet not found' });
      }

      if (Number(senderWallet.balance) < amt) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }

      const { data: receiverWallet } = await supabaseAdmin
        .from('wallets')
        .select('wallet_id, user_id')
        .eq('wallet_id', toWalletId)
        .maybeSingle();

      if (!receiverWallet) {
        return res.status(404).json({ success: false, message: 'Receiver wallet not found' });
      }

      await walletService.updateBalance(senderWallet.wallet_id, -amt);

      await walletService.updateBalance(toWalletId, amt);

      await walletService.recordTransaction({
        userId,
        walletId: senderWallet.wallet_id,
        type: 'transfer_out',
        amount: -amt,
        status: 'completed',
        description: description || 'Wallet to wallet transfer',
        fromAccount: senderWallet.wallet_id,
        toAccount: toWalletId,
      });

      await walletService.recordTransaction({
        userId: receiverWallet.user_id,
        walletId: toWalletId,
        type: 'transfer_in',
        amount: amt,
        status: 'completed',
        description: description || 'Wallet to wallet transfer',
        fromAccount: senderWallet.wallet_id,
        toAccount: toWalletId,
      });

      logger.info(`💸 Transfer ${amt} PS from ${senderWallet.wallet_id} to ${toWalletId}`);

      return res.json({
        success: true,
        message: 'Transfer successful',
        data: {
          fromWalletId: senderWallet.wallet_id,
          toWalletId,
          amount: amt,
        },
      });
    } catch (error: any) {
      logger.error('❌ Transfer error:', error.message);
      return res.status(500).json({ success: false, message: 'Transfer failed' });
    }
  }
}

export default new WalletController();
