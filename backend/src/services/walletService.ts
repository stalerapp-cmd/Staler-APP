
import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { decrypt } from '../utils/encryption';

interface TransactionData {
  userId: string;
  walletId: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  fromAccount?: string;
  toAccount?: string;
}

class WalletService {

  async createWallet(userId: string, walletId: string) {
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        balance: 0,
        currency: 'PS',
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ Create wallet error:', error.message);
      throw error;
    }

    logger.info(`✅ Wallet created: ${walletId} for user ${userId}`);
    return data;
  }


  async getWalletByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('❌ Get wallet error:', error.message);
      throw error;
    }

    return data || null;
  }

  
  async updateBalance(walletId: string, amount: number) {
    try {
      const { data, error } = await supabaseAdmin.rpc('wallet_increment_balance', {
        p_wallet_id: walletId,
        p_amount: amount,
      });

      if (error) throw error;

      logger.info(`💵 Wallet ${walletId} balance updated by ${amount} (RPC)`);
      return data;
    } catch (rpcError: any) {
      logger.warn('⚠️ RPC not available, using direct update');

      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('wallet_id', walletId)
        .single();

      if (!wallet) throw new Error('Wallet not found');

      const newBalance = Number(wallet.balance) + amount;

      const { error: updateErr } = await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      if (updateErr) throw updateErr;

      logger.info(`💵 Wallet ${walletId} balance updated by ${amount} (direct)`);
      return { balance: newBalance };
    }
  }

  
  async recordTransaction(data: TransactionData) {
    const { error } = await supabaseAdmin.from('transactions').insert({
      user_id: data.userId,
      wallet_id: data.walletId,
      transaction_type: data.type,
      amount: data.amount,
      currency: 'PS',
      status: data.status,
      description: data.description || '',
      from_account: data.fromAccount || '',
      to_account: data.toAccount || '',
    });

    if (error) {
      logger.error('❌ Record transaction error:', error.message);
      throw error;
    }

    logger.info(
      `🧾 Transaction recorded: wallet=${data.walletId}, ${data.type} ${data.amount} PS`
    );
  }


  async getTransactionHistory(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('❌ Get transactions error:', error.message);
      throw error;
    }

    return data || [];
  }

  async getBankAccountByUserId(userId: string) {
    
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('id, wallet_id')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) {
      logger.warn(`⚠️ No wallet found for user ${userId}`);
      return null;
    }

    const { data: bankAccount, error: bankErr } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('wallet_id', wallet.id) 
      .eq('status', 'active')
      .single();

    if (bankErr && bankErr.code !== 'PGRST116') {
      logger.error('❌ Get bank account error:', bankErr.message);
      throw bankErr;
    }

    return bankAccount || null;
  }

  
  async getDecryptedBankCredentials(userId: string) {
    const acc = await this.getBankAccountByUserId(userId);

    if (!acc || !acc.bank_username) {
      logger.warn(`⚠️ No bank account found for user ${userId}`);
      return null;
    }

    const encryptedPassword = acc.bank_password_enc || acc.bank_password_hash;

    if (!encryptedPassword) {
      logger.warn(`⚠️ No encrypted password for user ${userId}`);
      return null;
    }

    try {
      const plainPassword = decrypt(encryptedPassword);

      logger.info(`✅ Bank credentials loaded for user ${userId}`);

      return {
        bankUsername: acc.bank_username,
        bankPassword: plainPassword,
      };
    } catch (e: any) {
      logger.error('❌ Decrypt bank password error:', e.message);
      return null;
    }
  }
}

export default new WalletService();