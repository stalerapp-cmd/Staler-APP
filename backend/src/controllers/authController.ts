

// src/controllers/authController.ts

import { Request, Response } from 'express';
import authService from '../services/authService';
import emailService from '../services/emailService';
import { supabase, supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

class AuthController {



  async register(req: Request, res: Response) {
    const { email, password, fullName, role } = req.body;
 
    try {
      const code = generateCode();
 
      await authService.register({
        email,
        password,
        fullName,
        role,
        verificationMethod: 'email',
        verificationCode: code,
      });
 
      await emailService.sendWelcomeEmail(email, fullName, code);
 
      res.status(201).json({
        success: true,
        message: 'Registered successfully, check your email',
        verificationMethod: 'email',
      });
 
    } catch (err: any) {
 
      if (err.message === 'Email already pending verification') {
        try {
          const { data: pendingUser } = await supabaseAdmin
            .from('pending_users')
            .select('id, full_name, code_expires_at')
            .eq('email', email)
            .maybeSingle();
 
          if (pendingUser) {
            const newCode = generateCode();
            await supabaseAdmin
              .from('pending_users')
              .update({
                verification_code: newCode,
                code_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              })
              .eq('id', pendingUser.id);
 
            await emailService.sendVerificationReminder(email, pendingUser.full_name, newCode);
          }
        } catch { /* silent */ }
 
        return res.status(403).json({
          success: false,
          code: 'PENDING_VERIFICATION',
          email,
          message: 'Your account is not verified yet. A new code has been sent to your email.',
        });
      }
 
      return res.status(400).json({
        success: false,
        message: err.message || 'Registration failed',
      });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    const { email, code } = req.body;

    try {
      const { data: pendingUser, error } = await supabaseAdmin
        .from('pending_users')
        .select('*')
        .eq('email', email)
        .eq('verification_code', code)
        .single();

      if (error || !pendingUser) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
        });
      }

      if (new Date() > new Date(pendingUser.code_expires_at)) {
        return res.status(400).json({
          success: false,
          message: 'Code expired',
        });
      }

      await authService.createUserFromPending(pendingUser.id);

      res.json({
        success: true,
        message: 'Email verified successfully. You can now login!',
      });

    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Verification failed',
      });
    }
  }



  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
 
      try {
        const data = await authService.login(email, password);
        return res.json({ success: true, data });
      } catch (loginErr: any) {
 
        const { data: pendingUser } = await supabaseAdmin
          .from('pending_users')
          .select('id, email, full_name, password_hash, code_expires_at, expires_at')
          .eq('email', email)
          .maybeSingle();
 
        if (pendingUser) {
          if (new Date() > new Date(pendingUser.expires_at)) {
            await supabaseAdmin.from('pending_users').delete().eq('id', pendingUser.id);
            return res.status(401).json({
              success: false,
              message: 'Registration expired. Please register again.',
            });
          }
 
          const validPassword = await bcrypt.compare(password, pendingUser.password_hash);
          if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
          }
 
          if (new Date() > new Date(pendingUser.code_expires_at)) {
            const newCode = Math.floor(100000 + Math.random() * 900000).toString();
            await supabaseAdmin
              .from('pending_users')
              .update({
                verification_code: newCode,
                code_expires_at: new Date(Date.now() + 15 * 60 * 1000),
              })
              .eq('id', pendingUser.id);
 
            await emailService.sendVerificationReminder(
              pendingUser.email,
              pendingUser.full_name,
              newCode
            );
          }
 
          return res.status(403).json({
            success: false,
            code: 'PENDING_VERIFICATION',
            email: pendingUser.email,
            message: 'Your account is not verified yet. A new code has been sent to your email.',
          });
        }
 
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Login failed' });
    }
  }
 
  async requestProfileUpdate(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const { updateType, newValue, fullName, email, oldPassword, newPassword } = req.body;

      console.log('🔄 Profile update request:', { userId, fullName, email, hasPassword: !!newPassword });

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const changes: any = {};
      let hasChanges = false;

      if (fullName && fullName !== user.full_name) {
        changes.fullName = fullName;
        hasChanges = true;
      }

      if (email && email !== user.email) {
        changes.email = email;
        hasChanges = true;
      }

      if (newPassword) {
        if (!oldPassword) {
          return res.status(400).json({
            success: false,
            message: 'Old password is required to change password',
          });
        }
        const valid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!valid) {
          return res.status(400).json({
            success: false,
            message: 'Old password is incorrect',
          });
        }
        changes.newPassword = newPassword;
        hasChanges = true;
      }

      if (!hasChanges) {
        return res.json({
          success: true,
          message: 'No changes detected',
          requiresVerification: false,
        });
      }

      console.log('📝 Detected changes:', Object.keys(changes));

      if (changes.fullName && Object.keys(changes).length === 1) {
        const oldName = user.full_name;

        await supabaseAdmin
          .from('users')
          .update({ full_name: changes.fullName })
          .eq('id', userId);

        if (user.email_verified) {
          await emailService.sendNameChangedEmail(user.email, oldName, changes.fullName);
        }

        return res.json({
          success: true,
          message: 'Name updated successfully',
          requiresVerification: false,
        });
      }

      const code = generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await supabaseAdmin.from('profile_update_verifications').insert({
        user_id: userId,
        verification_code: code,
        update_type: changes.email ? 'email' : changes.newPassword ? 'password' : 'profile',
        new_value: changes.email || null,
        pending_changes: changes,
        expires_at: expiresAt,
        verified: false,
      });

      await emailService.sendVerificationReminder(user.email, user.full_name, code);

      console.log('✅ Verification code sent via email');

      return res.json({
        success: true,
        message: 'Verification code sent to your email',
        verificationMethod: 'email',
        requiresVerification: true,
      });

    } catch (err) {
      console.error('❌ requestProfileUpdate error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to process update request',
      });
    }
  }

  async verifyAndUpdateProfile(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const { verificationCode } = req.body;

      console.log('🔐 Verify and update:', { userId, code: verificationCode });

      const { data: verifications, error: verifyError } = await supabaseAdmin
        .from('profile_update_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('verified', false)
        .order('created_at', { ascending: false });

      if (verifyError || !verifications || verifications.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No verification request found. Please request a new code.',
        });
      }

      const verification = verifications.find(v => v.verification_code === verificationCode);

      if (!verification) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
        });
      }

      const expiresAtStr = verification.expires_at.includes('Z')
        ? verification.expires_at
        : verification.expires_at + 'Z';

      if (new Date() > new Date(expiresAtStr)) {
        return res.status(400).json({
          success: false,
          message: 'Verification code expired. Please request a new one.',
        });
      }

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const pendingChanges = verification.pending_changes || {};
      const updates: any = {};
      let emailChanged = false;

      if (pendingChanges.fullName) updates.full_name = pendingChanges.fullName;
      if (pendingChanges.email) {
        updates.email = pendingChanges.email;
        updates.email_verified = false;
        updates.email_verified_at = null;
        emailChanged = true;
      }
      if (pendingChanges.newPassword) {
        const hash = await bcrypt.hash(pendingChanges.newPassword, 10);
        updates.password_hash = hash;
      }

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin
          .from('users')
          .update(updates)
          .eq('id', userId);
      }

      await supabaseAdmin
        .from('profile_update_verifications')
        .update({ verified: true })
        .eq('id', verification.id);

      const oldEmail = user.email;
      const oldName  = user.full_name;

      const changesForNotification: { type: string; oldValue?: string; newValue?: string }[] = [];
      if (pendingChanges.fullName)    changesForNotification.push({ type: 'name',     oldValue: oldName,  newValue: pendingChanges.fullName });
      if (pendingChanges.email)       changesForNotification.push({ type: 'email',    oldValue: oldEmail, newValue: pendingChanges.email });
      if (pendingChanges.newPassword) changesForNotification.push({ type: 'password' });

      if (user.email_verified && changesForNotification.length > 0) {
        await emailService.sendProfileUpdateNotification(oldEmail, oldName, changesForNotification);
      }

      if (emailChanged && pendingChanges.email) {
        await emailService.sendNewEmailWelcome(pendingChanges.email, user.full_name);
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        requiresNewVerification: emailChanged,
      });

    } catch (err) {
      console.error('❌ verifyAndUpdateProfile error:', err);
      return res.status(500).json({
        success: false,
        message: 'Update failed. Please try again.',
      });
    }
  }

  // =====================
  // RESEND VERIFICATION
  // =====================
  async resendVerification(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const { data: pendingUser } = await supabaseAdmin
        .from('pending_users')
        .select('*')
        .eq('email', email)
        .single();

      if (!pendingUser) {
        return res.json({ success: true });
      }

      const code = generateCode();

      await supabaseAdmin
        .from('pending_users')
        .update({
          verification_code: code,
          code_expires_at: new Date(Date.now() + 15 * 60 * 1000),
        })
        .eq('id', pendingUser.id);

      await emailService.sendVerificationReminder(email, pendingUser.full_name, code);

      res.json({ success: true, message: 'Verification code resent' });

    } catch (err) {
      res.json({ success: true });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('email', email)
      .single();

    if (!user) {
      return res.json({ success: true, message: 'If email exists, reset code sent' });
    }

    const code = generateCode();

    await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('email', email);

    await supabaseAdmin.from('password_resets').insert({
      user_id: user.id,
      email,
      reset_code: code,
      used: false,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });

    await emailService.sendPasswordResetEmail(email, user.full_name, code);

    return res.json({ success: true, message: 'Reset code sent to email', method: 'email' });
  }

  async resetPassword(req: Request, res: Response) {
    const { email, code, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('user_id', user.id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data || data.reset_code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    if (new Date() > new Date(data.expires_at)) {
      return res.status(400).json({ success: false, message: 'Reset code expired' });
    }

    await authService.updatePassword(user.id, newPassword);

    await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('id', data.id);

    await emailService.sendPasswordChangedEmail(user.email, user.full_name);

    res.json({ success: true, message: 'Password reset successfully' });
  }

  async uploadImage(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
      }

      const file = req.file;
      const ext = file.originalname.split('.').pop();
      const fileName = `avatars/${userId}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

      if (uploadError) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }

      const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      await supabaseAdmin
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('id', userId);

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name, email_verified')
        .eq('id', userId)
        .single();

      if (user?.email_verified) {
        await emailService.sendImageChangedEmail(user.email, user.full_name);
      }

      return res.json({ success: true, image: publicUrl });

    } catch (err) {
      console.error('UPLOAD ERROR:', err);
      return res.status(500).json({ success: false, message: 'Image upload failed' });
    }
  }

  async deleteProfileImage(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('profile_image')
        .eq('id', userId)
        .single();

      if (!user?.profile_image) {
        return res.status(400).json({ success: false, message: 'No profile image to delete' });
      }

      if (user.profile_image.includes('/avatars/')) {
        const parts = user.profile_image.split('/avatars/');
        const filePath = parts[1];
        if (filePath) {
          await supabaseAdmin.storage
            .from('avatars')
            .remove([`avatars/${filePath}`]);
        }
      }

      await supabaseAdmin
        .from('users')
        .update({ profile_image: null })
        .eq('id', userId);

      return res.json({ success: true, message: 'Profile image removed' });

    } catch (err) {
      console.error('deleteProfileImage error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
  }

  
  async getProfile(req: Request, res: Response) {
    const userId = req.user.userId;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id,email,full_name,role,profile_image,phone_number,verification_method')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, data: { user: data } });
  }

 
  async requestAccountDeletion(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*, wallets(balance)')
        .eq('id', userId)
        .single();

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const balance = (user as any).wallets?.balance || 0;

      if (balance > 0) {
        await emailService.sendAccountCannotBeDeletedEmail(
          user.email, user.full_name,
          'Your account has a remaining balance. Please withdraw all funds before deleting your account.'
        );
        return res.json({
          success: false, canDelete: false,
          message: 'Cannot delete account with remaining balance. Email sent with details.',
        });
      }

      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing', 'shipped']);

      if (orders && orders.length > 0) {
        await emailService.sendAccountCannotBeDeletedEmail(
          user.email, user.full_name,
          'Your account has pending orders. Please complete or cancel all orders before deleting your account.'
        );
        return res.json({
          success: false, canDelete: false,
          message: 'Cannot delete account with pending orders. Email sent with details.',
        });
      }

      const code = generateCode();
      console.log('🔑 Generated deletion code:', code);

      await supabaseAdmin.from('account_deletion_requests').insert({
        user_id: userId,
        deletion_code: code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        confirmed: false,
      });

      await emailService.sendAccountDeletionCode(user.email, user.full_name, code);

      return res.json({ success: true, canDelete: true, message: 'Deletion code sent to your email' });

    } catch (err) {
      console.error('requestAccountDeletion error:', err);
      return res.status(500).json({ success: false, message: 'Failed to process deletion request' });
    }
  }

  async confirmAccountDeletion(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const { code } = req.body;

      const { data: requests } = await supabaseAdmin
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('confirmed', false)
        .order('created_at', { ascending: false });

      if (!requests || requests.length === 0) {
        return res.status(400).json({ success: false, message: 'No deletion request found. Please request again.' });
      }

      const request = requests.find(r => r.deletion_code === code);

      if (!request) {
        return res.status(400).json({ success: false, message: 'Invalid deletion code.' });
      }

      if (new Date() > new Date(request.expires_at)) {
        return res.status(400).json({ success: false, message: 'Deletion code expired. Please request a new one.' });
      }

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*, wallets(balance)')
        .eq('id', userId)
        .single();

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const balance = (user as any).wallets?.balance || 0;
      if (balance > 0) {
        return res.json({ success: false, message: 'Cannot delete account with remaining balance.' });
      }

      await supabaseAdmin
        .from('account_deletion_requests')
        .update({ confirmed: true })
        .eq('id', request.id);

      await supabaseAdmin.from('users').delete().eq('id', userId);

      return res.json({ success: true, message: 'Account deleted successfully' });

    } catch (err) {
      console.error('❌ confirmAccountDeletion error:', err);
      return res.status(500).json({ success: false, message: 'Deletion failed. Please try again.' });
    }
  }

  async createAdminUser(req: Request, res: Response) {
    try {
      const { email, password, fullName, adminLevel } = req.body;

      if (adminLevel !== 'admin' && adminLevel !== 'super_admin') {
        return res.status(400).json({ success: false, message: 'Invalid admin level' });
      }

      const { data: exists } = await supabaseAdmin
        .from('users').select('id').eq('email', email).maybeSingle();

      if (exists) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const { data: newAdmin, error } = await supabaseAdmin
        .from('users')
        .insert({
          email, password_hash, full_name: fullName,
          role: 'admin', admin_level: adminLevel,
          email_verified: true, email_verified_at: new Date(),
        })
        .select().single();

      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to create admin' });
      }

      const walletId = `wallet_admin_${Math.random().toString(36).substring(2, 10)}`;
      await supabaseAdmin.from('wallets').insert({
        user_id: newAdmin.id, wallet_id: walletId, balance: 0, currency: 'PS',
      });

      return res.json({
        success: true, message: 'Admin created successfully',
        admin: { id: newAdmin.id, email: newAdmin.email, full_name: newAdmin.full_name, admin_level: newAdmin.admin_level },
      });

    } catch (err) {
      console.error('createAdminUser error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create admin user' });
    }
  }

 
  async createVerifiedUser(req: Request, res: Response) {
    try {
      const { email, password, fullName, role, phoneNumber } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
      }

      if (role === 'admin') {
        return res.status(403).json({ success: false, message: 'Use /admin/create-admin endpoint' });
      }

      const { data: existingUser } = await supabaseAdmin
        .from('users').select('id').eq('email', email).maybeSingle();

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email, password_hash, full_name: fullName,
          role: role || 'user',
          phone_number: phoneNumber || null,
          verification_method: 'email',
          email_verified: true,
          email_verified_at: new Date(),
          created_at: new Date(),
        })
        .select().single();

      if (userError) {
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }

      const walletId = `wallet_${Math.random().toString(36).substring(2, 10)}`;
      const { error: walletError } = await supabaseAdmin.from('wallets').insert({
        user_id: newUser.id, wallet_id: walletId, balance: 0, currency: 'PS',
      });

      if (walletError) {
        await supabaseAdmin.from('users').delete().eq('id', newUser.id);
        return res.status(500).json({ success: false, message: 'Failed to create wallet' });
      }

      return res.json({
        success: true, message: 'User created successfully',
        user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name, role: newUser.role, wallet_id: walletId },
      });

    } catch (err: any) {
      console.error('createVerifiedUser error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to create user' });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.user.userId;

      const { data: user } = await supabaseAdmin
        .from('users').select('profile_image').eq('id', userId).single();

      if (user?.profile_image) {
        const path = user.profile_image.split('/avatars/')[1];
        if (path) await supabaseAdmin.storage.from('avatars').remove([path]);
      }

      await supabaseAdmin.from('users').delete().eq('id', userId);

      return res.json({ success: true, message: 'Account deleted successfully' });

    } catch (err) {
      console.error('DELETE ACCOUNT ERROR:', err);
      return res.status(500).json({ success: false, message: 'Delete account failed' });
    }
  }

  async logout(req: Request, res: Response) {
    res.json({ success: true });
  }
}

export default new AuthController();