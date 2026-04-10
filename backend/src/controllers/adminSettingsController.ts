
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';


export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({
        success: true,
        data: {
          siteName: 'S-Taler',
          currency: 'PS',
          bankUrl: '',
          theme: 'emerald',
        },
      });
    }

    if (error) {
      logger.error('Get settings error:', error.message);
      throw error;
    }

    return res.json({
      success: true,
      data: {
        siteName: data.site_name,
        currency: data.currency,
        bankUrl: data.bank_url,
        theme: data.theme,
      },
    });
  } catch (error: any) {
    logger.error('❌ Error fetching settings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
    });
  }
};


export const updateAdminSettings = async (req: Request, res: Response) => {
  try {
    const { siteName, currency, bankUrl, theme } = req.body;

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          id: 1, 
          site_name: siteName,
          currency,
          bank_url: bankUrl,
          theme,
        },
        { onConflict: 'id' }
      );

    if (error) {
      logger.error('Update settings error:', error.message);
      throw error;
    }

    res.json({
      success: true,
      message: 'Settings updated',
    });
  } catch (error: any) {
    logger.error('❌ Error saving settings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error saving settings',
    });
  }
};
