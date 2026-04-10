
import { Request, Response } from 'express';
import adminService from '../services/adminService';
import { logger } from '../utils/logger';

class AdminController {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getSystemStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      logger.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const users = await adminService.getAllUsers(Number(page), Number(limit));
      res.json({ success: true, data: users });
    } catch (err: any) {
      logger.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

 async getUserById(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Getting user:', userId);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID required' 
      });
    }
    
    const user = await adminService.getUserById(userId);
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log('✅ User found:', user);
    
    res.json({ 
      success: true, 
      data: user 
    });
  } catch (err: any) {
    console.error('❌ getUserById error:', err);
    logger.error(err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to get user'
    });
  }
}

  async deleteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      await adminService.deleteUser(userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async resetUserPassword(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    console.log('🔐 Resetting password for user:', userId);
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }
    
    await adminService.resetUserPassword(userId, newPassword);
    
    console.log('✅ Password reset successfully');
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('❌ resetUserPassword error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to reset password'
    });
  }
}
  async createUserBankAccount(req: Request, res: Response) {
    try {
      const { userId, bankUsername, bankPassword, initialBalance } = req.body;
      const result = await adminService.createUserBankAccount(
        userId,
        bankUsername,
        bankPassword,
        initialBalance
      );
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async fundUserWallet(req: Request, res: Response) {
    try {
      const { userId, amount } = req.body;
      const result = await adminService.fundUserWallet(userId, amount);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async listStores(req: Request, res: Response) {
    try {
      const stores = await adminService.listStores();
      res.json({ success: true, data: { stores } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

async updateStore(req: Request, res: Response) {
    try {
      const { storeId } = req.params;
      const data = req.body;
      
      console.log('💾 Controller - Updating store:', storeId, typeof storeId, data);
      
      await adminService.updateStore(storeId, data);
      
      console.log('✅ Store updated successfully');
      
      res.json({ success: true, message: 'Store updated' });
    } catch (err: any) {
      console.error('❌ updateStore error:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message || 'Failed to update store'
      });
    }
  }

  async deleteStore(req: Request, res: Response) {
  try {
    const { storeId } = req.params; 
    await adminService.deleteStore(storeId);
    res.json({ success: true, message: 'Store deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

  async getSettings(req: Request, res: Response) {
  try {
    console.log('🔍 Getting settings...');
    
    const settings = await adminService.getSettings();
    
    console.log('✅ Settings fetched:', settings);
    
    res.json({ 
      success: true, 
      data: settings 
    });
  } catch (err: any) {
    console.error('❌ getSettings error:', err);
    logger.error(err);
    
    res.json({ 
      success: true, 
      data: {
        siteName: 'S-Taler',
        currency: 'PS',
        bankUrl: '',
        theme: 'emerald',
      }
    });
  }
}

async updateSettings(req: Request, res: Response) {
  try {
    console.log('💾 Updating settings:', req.body);
    
    await adminService.updateSettings(req.body);
    
    console.log('✅ Settings updated');
    
    res.json({ 
      success: true, 
      message: 'Settings updated' 
    });
  } catch (err: any) {
    console.error('❌ updateSettings error:', err);
    logger.error(err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to update settings'
    });
  }
}
async changeUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    console.log('🔄 Changing role for user:', id, 'to', role);
    
    await adminService.changeUserRole(id, role);
    
    console.log('✅ Role changed successfully');
    
    res.json({ success: true, message: 'Role updated' });
  } catch (err: any) {
    console.error('❌ changeUserRole error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to change role'
    });
  }
}
async updateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { fullName, email, role } = req.body;
    
    console.log('🔄 Updating user:', userId, { fullName, email, role });
    
    await adminService.updateUser(userId, { fullName, email, role });
    
    console.log('✅ User updated successfully');
    
    res.json({ success: true, message: 'User updated' });
  } catch (err: any) {
    console.error('❌ updateUser error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to update user'
    });
  }
}
async getPendingUsers(req: Request, res: Response) {
    try {
      const data = await adminService.getPendingUsers();
      res.json({ success: true, data: { pendingUsers: data } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
 
  async deletePendingUser(req: Request, res: Response) {
    try {
      const { pendingId } = req.params;
      await adminService.deletePendingUser(pendingId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
 
  async clearExpiredPending(req: Request, res: Response) {
    try {
      const count = await adminService.clearExpiredPending();
      res.json({ success: true, data: { deleted: count } });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
 
  async updatePendingUser(req: Request, res: Response) {
    try {
      const { pendingId } = req.params;
      const { email, full_name, role } = req.body;
      await adminService.updatePendingUser(pendingId, { email, full_name, role });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
 
}

export default new AdminController();
