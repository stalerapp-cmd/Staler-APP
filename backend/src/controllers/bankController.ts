
import { Request, Response } from 'express';
import bankService from '../services/bankService';
import walletService from '../services/walletService';
import autoWithdrawService from '../services/autoWithdrawService';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/supabase';  
import { encrypt } from '../utils/encryption';
import axios from 'axios';
const MAX_WITHDRAWAL = Number(process.env.MAX_WITHDRAWAL || '10000');

class BankController {
  
  async checkBankBalance(req: Request, res: Response) {
    try {
      const { bankUsername, bankPassword } = req.body;

      if (!bankUsername || !bankPassword) {
        return res.status(400).json({
          success: false,
          message: 'Bank username and password are required',
        });
      }

      const balance = await bankService.checkBalance(bankUsername, bankPassword);

      return res.json({
        success: true,
        data: { balance },
      });
    } catch (error: any) {
      logger.error('❌ Check bank balance error:', error?.message || error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to check bank balance',
      });
    }
  }

  async withdrawToWallet(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
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

      logger.info(`💸 Manual withdraw: user=${userId}, amount=${amt} PS`);

      const result = await autoWithdrawService.withdrawAndReserve(
        userId,
        bankUsername,
        bankPassword,
        amt
      );

      return res.json(result);
    } catch (error: any) {
      logger.error('❌ Withdraw error:', error?.message || error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Withdrawal failed',
      });
    }
  }

  async getBankInfo(req: Request, res: Response) {
    try {
      const { bankUsername, bankPassword } = req.query;

      if (!bankUsername || !bankPassword) {
        return res.status(400).json({
          success: false,
          message: 'Bank username and password are required',
        });
      }

      const info = await bankService.getBankAccountInfo(
        bankUsername as string,
        bankPassword as string
      );

      return res.json({
        success: true,
        data: info,
      });
    } catch (error: any) {
      logger.error('❌ Get bank info error:', error?.message || error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get bank info',
      });
    }
  }

  async autoWithdrawWithSavedCreds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { amount } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required',
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

      const creds = await walletService.getDecryptedBankCredentials(userId);

      if (!creds) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_BANK_CREDS',
          message: 'Bank account not linked. Please link your bank account first.',
        });
      }

      logger.info(`🚀 Auto withdraw (saved creds): user=${userId}, amount=${amt} PS`);

      const result = await autoWithdrawService.withdrawAndReserve(
        userId,
        creds.bankUsername,
        creds.bankPassword,
        amt
      );

      return res.json(result);
    } catch (error: any) {
      logger.error('❌ autoWithdrawWithSavedCreds error:', error?.message || error);

      return res.status(500).json({
        success: false,
        message: error?.message || 'Auto withdraw failed',
      });
    }
  }

  async linkBankAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { bankUsername, bankPassword } = req.body;

      logger.info(`🔗 linkBankAccount called: userId=${userId}, bankUsername=${bankUsername}`);

      if (!userId || !bankUsername || !bankPassword) {
        return res.status(400).json({
          success: false,
          message: 'Missing data',
        });
      }

      const { data: wallet, error: walletErr } = await supabaseAdmin
        .from('wallets')
        .select('id, wallet_id, user_id')
        .eq('user_id', userId)
        .single();

      if (walletErr || !wallet) {
        logger.error('❌ Wallet not found:', walletErr?.message);
        return res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
      }

      logger.info(`📦 Found wallet: id=${wallet.id}, wallet_id=${wallet.wallet_id}`);

      try {
        const balance = await bankService.checkBalance(bankUsername, bankPassword);
        logger.info(`✅ Bank verified: ${bankUsername}, balance: ${balance} PS`);
      } catch (bankErr: any) {
        logger.error('❌ Bank verification failed:', bankErr.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid bank credentials: ' + bankErr.message,
        });
      }

      const { data: existing } = await supabaseAdmin
        .from('bank_accounts')
        .select('id')
        .eq('wallet_id', wallet.id)  
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        logger.warn('⚠️ Bank account already linked');
        return res.status(400).json({
          success: false,
          message: 'Bank account already linked to this wallet',
        });
      }

      const encrypted = encrypt(bankPassword);
      logger.info('🔐 Password encrypted');

      logger.info('📝 Inserting bank account...');
      logger.info(`   user_id: ${userId}`);
      logger.info(`   wallet_id: ${wallet.id} (uuid)`);
      logger.info(`   bank_username: ${bankUsername}`);

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('bank_accounts')
        .insert({
          user_id: userId,              
          wallet_id: wallet.id,         
          bank_username: bankUsername,
          bank_password_enc: encrypted,
          status: 'active',
        })
        .select()
        .single();

      if (insertErr) {
        logger.error('❌ Insert error:', insertErr.message);
        logger.error('❌ Error code:', insertErr.code);
        logger.error('❌ Error details:', JSON.stringify(insertErr));
        return res.status(500).json({
          success: false,
          message: insertErr.message,
          code: insertErr.code,
        });
      }

      logger.info(`✅ Bank account linked successfully! ID: ${inserted.id}`);

      return res.json({
        success: true,
        message: 'Bank account linked successfully',
        data: {
          bankAccountId: inserted.id,
          bankUsername: bankUsername,
        },
      });

    } catch (err: any) {
      logger.error('❌ linkBankAccount error:', err.message);
      logger.error('❌ Stack:', err.stack);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to link bank account',
      });
    }
  }

  async getLinkedBank(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
      }


      const { data: bankAccount } = await supabaseAdmin
        .from('bank_accounts')
        .select('id, bank_username, status, created_at')
        .eq('wallet_id', wallet.id)
        .eq('status', 'active')
        .single();

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          code: 'NO_BANK_LINKED',
          message: 'No bank account linked',
        });
      }

      return res.json({
        success: true,
        data: {
          bankUsername: bankAccount.bank_username,
          linkedAt: bankAccount.created_at,
          status: bankAccount.status,
        },
      });
    } catch (error: any) {
      logger.error('❌ getLinkedBank error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to get linked bank',
      });
    }
  }

  async withdrawFromBankQR(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { operationId } = req.body;
 
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      if (!operationId) return res.status(400).json({ success: false, message: 'operationId is required' });
 
      logger.info(`🏦 Bank QR withdraw: user=${userId}, op=${operationId}`);
 
      const result = await autoWithdrawService.withdrawFromBankQR(userId, operationId);
      return res.json(result);
 
    } catch (error: any) {
      logger.error('❌ withdrawFromBankQR error:', error?.message);
      return res.status(500).json({ success: false, message: error?.message || 'Bank QR withdrawal failed' });
    }
  }
  async getBankOperation(req: Request, res: Response) {
  const { operationId } = req.params;
  const BANK_URL = process.env.TALER_BANK_URL!;
  const res2 = await axios.get(
    `${BANK_URL}/taler-integration/withdrawal-operation/${operationId}`
  );
  return res.json({ success: true, data: res2.data });
}
}

export default new BankController();