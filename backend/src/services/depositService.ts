
import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { decrypt } from '../utils/encryption';

const BANK_URL       = process.env.TALER_BANK_URL!;
const EXCHANGE_USER  = process.env.TALER_EXCHANGE_USER!;
const EXCHANGE_PASS  = process.env.TALER_EXCHANGE_PASSWORD!; 

class DepositService {

  async depositToBank(userId: string, amount: number) {

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) throw new Error('Wallet not found');

    if (Number(wallet.balance) < amount) {
      throw new Error(`Insufficient wallet balance (${wallet.balance} PS)`);
    }

    const { data: bankAcc, error: bankErr } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('wallet_id', wallet.id)
      .eq('status', 'active')
      .single();

    if (bankErr || !bankAcc) {
      throw new Error('No linked bank account found. Please link your bank account in Profile settings.');
    }

    const bankUsername = bankAcc.bank_username;

    const decryptedPass = decrypt(bankAcc.bank_password_enc);
    const accountRes = await axios.get(
      `${BANK_URL}/accounts/${bankUsername}`,
      { auth: { username: bankUsername, password: decryptedPass } }
    );

    const userPayto: string = accountRes.data.payto_uri;
    if (!userPayto) throw new Error('Could not get user bank account payto_uri');

    const cleanPayto = userPayto.split('?')[0].split('&message=')[0];
    const subject    = `S-Taler deposit ${Date.now()}`;
    const finalPayto = `${cleanPayto}?message=${encodeURIComponent(subject)}`;

    logger.info(`💰 Deposit: exchange → ${bankUsername}, amount=${amount} PS`);
    logger.info(`📤 payto: ${finalPayto}`);

    const txRes = await axios.post(
      `${BANK_URL}/accounts/${EXCHANGE_USER}/transactions`,
      { payto_uri: finalPayto, amount: `PS:${amount}` },
      {
        auth: { username: EXCHANGE_USER, password: EXCHANGE_PASS },
        validateStatus: (s) => s < 500,
      }
    );

    if (![200, 201].includes(txRes.status)) {
      logger.error('❌ Bank transaction failed:', txRes.data);
      throw new Error(txRes.data?.hint || 'Bank transfer from exchange failed');
    }

    const rowId = txRes.data.row_id;
    logger.info(`✅ Bank transaction created: row_id=${rowId}`);

    const newBalance = Number(wallet.balance) - amount;

    const { error: updateErr } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    if (updateErr) throw new Error('Failed to update wallet balance');

    logger.info(`💵 Wallet balance: ${wallet.balance} → ${newBalance}`);

    await supabaseAdmin.from('transactions').insert({
      user_id:          userId,
      wallet_id:        wallet.wallet_id,
      transaction_type: 'deposit',
      amount:           -amount,          
      currency:         'PS',
      status:           'completed',
      description:      `Deposit to bank account (${bankUsername})`,
      from_account:     wallet.wallet_id,
      to_account:       bankUsername,
    });

    return {
      success: true,
      data: {
        amount,
        newBalance,
        bankUsername,
        bank_tx_id: rowId,
      },
    };
  }
}

export default new DepositService();