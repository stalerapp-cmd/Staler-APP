


import { supabase } from '../config/supabase';
import { encrypt, decrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

class ReserveService {

  async saveReserve(
    walletDbId: number,
    reserve_pub: string,
    reserve_priv: string,
    amount: number
  ) {
    try {
      const encryptedPriv = encrypt(reserve_priv);

      const { data, error } = await supabase
        .from('reserves')
        .insert({
          wallet_id: walletDbId,
          reserve_pub,
          reserve_priv: encryptedPriv,
          amount,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      logger.error('❌ Error saving reserve:', error.message);
      throw error;
    }
  }

  async getReserveByPub(reserve_pub: string) {
    try {
      const { data, error } = await supabase
        .from('reserves')
        .select('*')
        .eq('reserve_pub', reserve_pub)
        .single();

      if (error || !data) return null;

      return {
        ...data,
        reserve_priv: decrypt(data.reserve_priv),
      };
    } catch (error: any) {
      logger.error('❌ Error getting reserve by pub:', error.message);
      throw error;
    }
  }
  async listReserves(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reserves')
        .select(`
          id,
          reserve_pub,
          amount,
          status,
          created_at,
          wallets!inner (
            wallet_id,
            user_id
          )
        `)
        .eq('wallets.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        wallet_id: row.wallets.wallet_id,
        reserve_pub: row.reserve_pub,
        amount: Number(row.amount),
        status: row.status,
        created_at: row.created_at,
      }));
    } catch (error: any) {
      logger.error('❌ Error listing reserves:', error.message);
      throw error;
    }
  }
}

export default new ReserveService();
