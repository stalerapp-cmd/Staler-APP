
import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

const router = express.Router();


router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId and amount are required',
      });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const { data: bankAcc, error: bankErr } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (bankErr || !bankAcc) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found or inactive',
      });
    }

    const encrypted =
      bankAcc.bank_password_enc || bankAcc.bank_password_hash;

    if (!encrypted) {
      return res.status(400).json({
        success: false,
        message: 'Bank password not found',
      });
    }

    decrypt(encrypted); 

    const bankBalance = 10000;
    if (amt > bankBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in bank account',
      });
    }

    const { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    const { data: updatedWallet, error: rpcErr } =
      await supabase.rpc('wallet_increment_balance', {
        p_wallet_id: wallet.wallet_id,
        p_amount: amt,
      });

    if (rpcErr) {
      logger.error('❌ Wallet update error:', rpcErr.message);
      throw rpcErr;
    }

    const { error: txErr } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
       wallet_id: wallet.wallet_id,      
    transaction_type: 'withdraw',  

        amount: amt,
        currency: 'PS',
        status: 'completed',
        description: `Withdrawal from bank (${bankAcc.bank_username})`,
      });

    if (txErr) {
      logger.error('❌ Transaction insert error:', txErr.message);
      throw txErr;
    }

    logger.info(
      `✅ Withdraw ${amt} PS from bank → wallet ${wallet.wallet_id}`
    );

    return res.json({
      success: true,
      message: `Withdrawn ${amt} PS from bank`,
      newBalance: updatedWallet.balance,
    });
  } catch (error: any) {
    logger.error('❌ Withdraw error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

export default router;
