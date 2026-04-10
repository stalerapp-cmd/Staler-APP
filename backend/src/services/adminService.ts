

// src/services/adminService.ts

import { supabase, supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';

class AdminService {

  async getSystemStats() {
    const [
      { count: totalUsers },
      { count: totalMerchants },
      { data: wallets },
      { count: totalTransactions },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
      supabase.from('wallets').select('balance'),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
    ]);

    const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;

    return {
      totalUsers: totalUsers ?? 0,
      totalMerchants: totalMerchants ?? 0,
      totalBalance,
      totalTransactions: totalTransactions ?? 0,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 50) {
  console.log('🔍 Getting all users - page:', page);
  
  const offset = (page - 1) * limit;

  try {
    const { data: users, error, count } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        admin_level,
        created_at,
        wallets (
          wallet_id,
          balance
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Get users error:', error);
      throw error;
    }

    console.log('✅ Users loaded:', users?.length);
    console.log('🔍 First user raw data:', users?.[0]);

    const mappedUsers = users?.map((u) => {
      const wallet = u.wallets as any;
      const balance = wallet?.balance;
      const walletId = wallet?.wallet_id;
      
      console.log(`📊 User ${u.full_name} - raw balance:`, balance, typeof balance);
      
      return {
        id: u.id,
        wallet_id: walletId || '',
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        admin_level: u.admin_level,
        balance: balance !== undefined && balance !== null ? Number(balance) : 0,
      };
    }) || [];

    console.log('✅ Mapped users:', mappedUsers);

    return {
      users: mappedUsers,
      total: count || 0,
      page,
      limit,
    };
  } catch (err) {
    console.error('❌ getAllUsers error:', err);
    throw err;
  }
}
async getUserById(userId: string) {
  console.log('🔍 AdminService - Getting user:', userId);
  
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      admin_level,
      email_verified,
      phone_number,
      phone_verified,
      verification_method,
      created_at,
      wallets (
        wallet_id,
        balance
      )
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
  
  if (!user) {
    console.log('❌ No user found');
    return null;
  }

  console.log('✅ User found:', user.email);

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    admin_level: user.admin_level,
    email_verified: user.email_verified,
    phone_number: user.phone_number,
    phone_verified: user.phone_verified,
    verification_method: user.verification_method,
    wallet_id: user.wallets?.[0]?.wallet_id || '',
    balance: user.wallets?.[0]?.balance || 0,
  };
}

async getSettings() {
  console.log('🔍 AdminService - Getting settings...');
  
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('❌ Settings query error:', error);
    }

    const settings = {
      siteName: data?.site_name || 'S-Taler',
      currency: data?.currency || 'PS',
      bankUrl: data?.bank_url || '',
      theme: data?.theme || 'emerald',
    };
    
    console.log('✅ Settings loaded:', settings);
    
    return settings;
  } catch (err) {
    console.error('❌ getSettings error:', err);
    return {
      siteName: 'S-Taler',
      currency: 'PS',
      bankUrl: '',
      theme: 'emerald',
    };
  }
}

async updateSettings(payload: Record<string, any>) {
  console.log('💾 AdminService - Updating settings:', payload);
  
  try {
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert(
        {
          id: 1,
          site_name: payload.siteName,
          currency: payload.currency,
          bank_url: payload.bankUrl,
          theme: payload.theme,
          updated_at: new Date(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('❌ Update settings error:', error);
      throw error;
    }

    console.log('✅ Settings updated successfully');
    
    return true;
  } catch (err) {
    console.error('❌ updateSettings error:', err);
    throw err;
  }
}
  async changeUserRole(userId: string, role: string) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
    return true;
  }

  async deleteUser(userId: string) {
    await supabaseAdmin.from('wallets').delete().eq('user_id', userId);

    const { error } = await supabaseAdmin.from('users').delete().eq('id', userId);

    if (error) throw error;
    return true;
  }

  async resetUserPassword(userId: string, newPassword: string) {
    const password_hash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', userId);

    if (error) throw error;
    return true;
  }

 
  async listStores() {
    const { data: stores, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return stores || [];
  }

 async updateStore(storeId: string, data: any) { 
  console.log('💾 AdminService - Updating store:', storeId, data);
  
  try {
    const { error } = await supabaseAdmin
      .from('merchants')
      .update({
        store_name: data.storeName,
        description: data.description,
        status: data.status,
      })
      .eq('id', storeId);  

    if (error) {
      console.error('❌ Update store error:', error);
      throw error;
    }

    console.log('✅ Store updated successfully');
    
    return true;
  } catch (err) {
    console.error('❌ updateStore error:', err);
    throw err;
  }
}
 async deleteStore(storeId: string) {  
  const { error } = await supabaseAdmin
    .from('merchants')
    .delete()
    .eq('id', storeId);

  if (error) throw error;
  return true;
}
  async createUserBankAccount(
    userId: string,
    bankUsername: string,
    bankPassword: string,
    initialBalance = 0
  ) {
    throw new Error('createUserBankAccount not implemented yet');
  }

  async fundUserWallet(userId: string, amount: number) {
    throw new Error('fundUserWallet not implemented yet');
  }

 
async updateUser(userId: string, data: {
  fullName?: string;
  email?: string;
  role?: string;
}) {
  console.log('💾 AdminService - Updating user:', userId, data);
  
  try {
    const updateData: any = {};
    
    if (data.fullName) updateData.full_name = data.fullName;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    
    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('❌ Update user error:', error);
      throw error;
    }

    console.log('✅ User updated successfully');
    
    return true;
  } catch (err) {
    console.error('❌ updateUser error:', err);
    throw err;
  }
}

  async getPendingUsers() {
    const { data, error } = await supabaseAdmin
      .from('pending_users')
      .select('id, email, full_name, role, verification_method, verification_code, code_expires_at, created_at, expires_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
 
  async deletePendingUser(pendingId: string) {
    const { error } = await supabaseAdmin
      .from('pending_users')
      .delete()
      .eq('id', pendingId);
    if (error) throw error;
    return true;
  }
 
  async clearExpiredPending() {
    const { error, count } = await supabaseAdmin
      .from('pending_users')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());
    if (error) throw error;
    return count || 0;
  }
 
  async updatePendingUser(pendingId: string, data: { email?: string; full_name?: string; role?: string }) {
    const update: any = {};
    if (data.email)     update.email     = data.email;
    if (data.full_name) update.full_name = data.full_name;
    if (data.role)      update.role      = data.role;
    const { error } = await supabaseAdmin
      .from('pending_users')
      .update(update)
      .eq('id', pendingId);
    if (error) throw error;
    return true;
  }

  
}

export default new AdminService();