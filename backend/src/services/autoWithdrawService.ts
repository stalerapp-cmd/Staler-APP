
import axios from 'axios';
import { generateReserveKeypair } from '../utils/keys';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { encrypt } from '../utils/encryption';

const BANK_URL = process.env.TALER_BANK_URL!;
const EXCHANGE_USER = process.env.TALER_EXCHANGE_USER!;
const ADMIN_USER = process.env.TALER_BANK_ADMIN_USER!;
const ADMIN_PASS = process.env.TALER_BANK_ADMIN_PASSWORD!;

class AutoWithdrawService {
  async withdrawAndReserve(
    userId: string,
    bankUsername: string,
    bankPassword: string,
    amount: number
  ) {
    const { reserve_pub, reserve_priv } = generateReserveKeypair();

    const exchangeRes = await axios.get(
      `${BANK_URL}/accounts/${EXCHANGE_USER}`,
      { auth: { username: ADMIN_USER, password: ADMIN_PASS } }
    );

    const basePayto = exchangeRes.data.payto_uri;
    if (!basePayto) throw new Error('Exchange payto_uri not found');

    const cleanPayto = basePayto.split('&message=')[0].split('?message=')[0];
    const finalPayto = `${cleanPayto}${cleanPayto.includes('?') ? '&' : '?'}message=${encodeURIComponent(reserve_pub)}`;

    const balanceRes = await axios.get(
      `${BANK_URL}/accounts/${bankUsername}`,
      { auth: { username: bankUsername, password: bankPassword } }
    );

    const balanceStr =
      balanceRes.data.balance?.amount || balanceRes.data.balance || 'PS:0';
    const currentBalance = Number(balanceStr.split(':')[1] || 0);

    if (currentBalance < amount) {
      throw new Error(`Insufficient bank balance (${currentBalance} PS)`);
    }

    const txRes = await axios.post(
      `${BANK_URL}/accounts/${bankUsername}/transactions`,
      { payto_uri: finalPayto, amount: `PS:${amount}` },
      {
        auth: { username: bankUsername, password: bankPassword },
        validateStatus: (s) => s < 500,
      }
    );

    if (![200, 201].includes(txRes.status)) {
      throw new Error(txRes.data?.hint || 'Bank transfer failed');
    }

    const rowId = txRes.data.row_id;

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) {
      logger.error('❌ Wallet not found:', walletErr?.message);
      throw new Error('Wallet not found');
    }

    logger.info(`📦 Found wallet: id=${wallet.id}, wallet_id=${wallet.wallet_id}`);

    const newBalance = Number(wallet.balance) + amount;

    const { error: updateErr } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    if (updateErr) {
      logger.error('❌ Wallet update error:', updateErr.message);
      throw new Error('Failed to update wallet balance');
    }

    logger.info(`💵 Wallet balance updated: ${wallet.balance} → ${newBalance}`);

    const { data: reserveData, error: reserveErr } = await supabaseAdmin
      .from('reserves')
      .insert({
        wallet_id: wallet.id,
        reserve_pub,
        reserve_priv,
        amount,
        status: 'active',
      })
      .select()
      .single();

    if (reserveErr) {
      logger.error('❌ Reserve insert error:', reserveErr.message);
    } else {
      logger.info(`✅ Reserve saved: ${reserveData?.id}`);
    }

    const { data: txData, error: txErr } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.wallet_id,
        transaction_type: 'withdraw',
        amount: amount,
        currency: 'PS',
        status: 'completed',
        description: `Bank withdrawal (row_id: ${rowId})`,
        from_account: bankUsername,
        to_account: wallet.wallet_id,
      })
      .select()
      .single();

    if (txErr) {
      logger.error('❌ Transaction insert error:', txErr.message);
    } else {
      logger.info(`✅ Transaction recorded: ${txData?.id}`);
    }

    await this.autoLinkBankAccount(userId, wallet.id, bankUsername, bankPassword);

    logger.info(
      `✅ Auto withdraw completed: user=${userId}, amount=${amount}, newBalance=${newBalance}`
    );

    return {
      success: true,
      data: {
        reserve_pub,
        amount,
        newBalance,
        bank_tx_id: rowId,
      },
    };
  }

 
  private async autoLinkBankAccount(
    userId: string,
    walletId: string, 
    bankUsername: string,
    bankPassword: string
  ) {
    try {
      const { data: existing } = await supabaseAdmin
        .from('bank_accounts')
        .select('id')
        .eq('wallet_id', walletId)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        logger.info(`🔗 Bank account already linked: ${existing.id}`);
        return;
      }

      const encrypted = encrypt(bankPassword);

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('bank_accounts')
        .insert({
          user_id: userId,
          wallet_id: walletId, 
          bank_username: bankUsername,
          bank_password_enc: encrypted,
          status: 'active',
        })
        .select()
        .single();

      if (insertErr) {
        logger.error('❌ Auto-link bank error:', insertErr.message);
        logger.error('❌ Error details:', JSON.stringify(insertErr));
      } else {
        logger.info(`✅ Bank account auto-linked: ${inserted.id}`);
      }
    } catch (err: any) {
      logger.error('❌ Auto-link bank exception:', err.message);
    }
  }



  async withdrawFromBankQR(userId: string, operationId: string) {
    const BANK_URL = process.env.TALER_BANK_URL!;
    const EXCHANGE_USER = process.env.TALER_EXCHANGE_USER!;
    const ADMIN_USER = process.env.TALER_BANK_ADMIN_USER!;
    const ADMIN_PASS = process.env.TALER_BANK_ADMIN_PASSWORD!;

    const opRes = await axios.get(
      `${BANK_URL}/taler-integration/withdrawal-operation/${operationId}`
    );
    const op = opRes.data;

    if (op.aborted) throw new Error('This withdrawal operation has been aborted');
    if (op.transfer_done) throw new Error('This withdrawal operation already completed');

    const amountStr = op.amount || op.min_amount;
    const amount = Number(String(amountStr).split(':')[1] || '0');
    if (amount <= 0) throw new Error('Invalid amount in withdrawal operation');

    const exchangeRes = await axios.get(
      `${BANK_URL}/accounts/${EXCHANGE_USER}`,
      { auth: { username: ADMIN_USER, password: ADMIN_PASS } }
    );
    const exchangePayto = exchangeRes.data.payto_uri;
    if (!exchangePayto) throw new Error('Exchange payto_uri not found');

    const { reserve_pub, reserve_priv } = generateReserveKeypair();

    const selectRes = await axios.post(
      `${BANK_URL}/taler-integration/withdrawal-operation/${operationId}`,
      {
        reserve_pub,
        selected_exchange: exchangePayto.split('?')[0], 
      }
    );

    if (![200, 201, 204].includes(selectRes.status)) {
      throw new Error('Failed to confirm withdrawal with bank');
    }

    logger.info(`✅ Bank QR confirmed: op=${operationId}, amount=${amount}, reserve=${reserve_pub}`);

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) throw new Error('Wallet not found');

    const newBalance = Number(wallet.balance) + amount;
    await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    logger.info(`💵 Wallet updated: ${wallet.balance} → ${newBalance}`);

    await supabaseAdmin.from('reserves').insert({
      wallet_id: wallet.id,
      reserve_pub,
      reserve_priv,
      amount,
      status: 'active',
    }).select().single();

    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      wallet_id: wallet.wallet_id,
      transaction_type: 'withdraw',
      amount,
      currency: 'PS',
      status: 'completed',
      description: `Bank QR withdrawal (op: ${operationId})`,
      from_account: op.sender_wire || 'bank',
      to_account: wallet.wallet_id,
    });

    return {
      success: true,
      data: { amount, newBalance, reserve_pub, operationId },
    };
  }
}

export default new AutoWithdrawService();