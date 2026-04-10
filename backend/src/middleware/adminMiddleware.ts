// src/middleware/adminMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';


export const checkAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role, admin_level')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
    });
  }
};

export const checkSuperAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role, admin_level')
      .eq('id', userId)
      .single();

    if (!user || user.role !== 'admin' || user.admin_level !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin only.',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authorization failed',
    });
  }
};