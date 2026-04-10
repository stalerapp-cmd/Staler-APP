
// src/services/authService.ts

import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  phoneNumber?: string;
  verificationMethod?: 'email' | 'sms';
    verificationCode: string; 

}

class AuthService {

  async register({ 
    email, 
    password, 
    fullName, 
    role = 'user',
    phoneNumber,
    verificationMethod = 'email',
    verificationCode  
  }: RegisterInput) {
    const { data: existsInUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existsInUsers) {
      throw new Error('Email already registered');
    }

    const { data: existsInPending } = await supabaseAdmin
      .from('pending_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existsInPending) {
      throw new Error('Email already pending verification');
    }

    if (phoneNumber) {
      const { data: phoneInUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (phoneInUsers) {
        throw new Error('Phone number already registered');
      }

      const { data: phoneInPending } = await supabaseAdmin
        .from('pending_users')
        .select('id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (phoneInPending) {
        throw new Error('Phone number already pending verification');
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: pendingUser, error } = await supabaseAdmin
      .from('pending_users')
      .insert({
        email,
        password_hash,
        full_name: fullName,
        role,
        phone_number: phoneNumber || null,
        verification_method: verificationMethod,
        verification_code: verificationCode,
        code_expires_at: new Date(Date.now() + 15 * 60 * 1000),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), 
      })
      .select()
      .single();

    if (error || !pendingUser) {
      throw error || new Error('Registration failed');
    }

    return pendingUser;
  }

  
  async createUserFromPending(pendingUserId: string) {
    const { data: pendingUser, error: fetchError } = await supabaseAdmin
      .from('pending_users')
      .select('*')
      .eq('id', pendingUserId)
      .single();

    if (fetchError || !pendingUser) {
      throw new Error('Pending user not found');
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: pendingUser.email,
        password_hash: pendingUser.password_hash,
        full_name: pendingUser.full_name,
        role: pendingUser.role,
        phone_number: pendingUser.phone_number,
        verification_method: pendingUser.verification_method,
        email_verified: pendingUser.verification_method === 'email',
        phone_verified: pendingUser.verification_method === 'sms',
        email_verified_at: pendingUser.verification_method === 'email' ? new Date() : null,
        phone_verified_at: pendingUser.verification_method === 'sms' ? new Date() : null,
      })
      .select()
      .single();

    if (userError || !user) {
      throw userError || new Error('User creation failed');
    }

    const walletId = `wallet_${Math.random().toString(36).substring(2, 10)}`;
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: user.id,
        wallet_id: walletId,
        balance: 0,
        currency: 'PS',
      });

    if (walletError) {
      throw walletError;
    }

    await supabaseAdmin
      .from('pending_users')
      .delete()
      .eq('id', pendingUserId);

    return user;
  }

 

 async login(email: string, password: string) {
  console.log('🔐 AuthService - Login for:', email);
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select(`
      id, 
      email, 
      full_name, 
      role, 
      admin_level,
      profile_image, 
      phone_number, 
      verification_method, 
      password_hash,
      email_verified,
      phone_verified,
      wallets (wallet_id)
    `)
    .eq('email', email)
    .single();

  if (error || !user) {
    console.error('❌ User not found:', error);
    throw new Error('Invalid credentials');
  }

  const userData = user as any;

  console.log('👤 User found:', {
    email: userData.email,
    role: userData.role,
    admin_level: userData.admin_level
  });

  const valid = await bcrypt.compare(password, userData.password_hash);
  if (!valid) {
    console.error('❌ Invalid password');
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: userData.id, role: userData.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  console.log('✅ Login successful - admin_level:', userData.admin_level);

  return {
    token,
    user: {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      admin_level: userData.admin_level,
      profile_image: userData.profile_image,
      email_verified: userData.email_verified,
      phone_number: userData.phone_number,
      phone_verified: userData.phone_verified,
      verification_method: userData.verification_method,
      wallet_id: userData.wallets?.wallet_id,
    },
  };
}

  async updatePassword(userId: string, newPassword: string) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash })
      .eq('id', userId);

    if (error) throw error;
  }
}

export default new AuthService();