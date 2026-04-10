
import { Request, Response } from 'express';
import merchantService from '../services/merchantService';
import orderService from '../services/orderService';
import { logger } from '../utils/logger';
import { supabase, supabaseAdmin, getSignedUrl, STORAGE_BUCKETS } from '../config/supabase';

class StoreController {

  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await merchantService.getAllProducts();

      res.json({
        success: true,
        data: { products },
      });
    } catch (error: any) {
      logger.error('Get products error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
      });
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { items } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid items',
        });
      }

      const order = await orderService.createOrder(userId, items);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order },
      });
    } catch (error: any) {
      logger.error('Create order error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order',
      });
    }
  }


  async processPayment(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { orderId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID required',
        });
      }

      const result = await orderService.processPayment(orderId, userId);

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: result,
      });
    } catch (error: any) {
      logger.error('Process payment error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Payment failed',
      });
    }
  }

  async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const orders = await orderService.getUserOrders(userId);

      res.json({
        success: true,
        data: { orders },
      });
    } catch (error: any) {
      logger.error('Get orders error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
      });
    }
  }

  async getOrderDetails(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const orderId = req.params.orderId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const order = await orderService.getOrderDetails(orderId, userId);

      res.json({
        success: true,
        data: { order },
      });
    } catch (error: any) {
      logger.error('Get order details error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get order',
      });
    }
  }

 
async downloadDigitalProduct(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const orderId = req.params.orderId;  
    const itemId = req.params.itemId;   

    console.log('📥 Download request:', { userId, orderId, itemId });

    if (!userId) {
      console.error('❌ No userId');
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, payment_status')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    if (order.payment_status !== 'completed') {
      console.error('❌ Payment not completed');
      return res.status(403).json({
        success: false,
        message: 'Order payment not completed'
      });
    }

    console.log('✅ Order verified:', order);

  
    const { data: item, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, is_digital, digital_file_url, products(name)')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (itemError || !item) {
      console.error('❌ Item not found:', itemError);
      return res.status(404).json({
        success: false,
        message: 'Product not found in order'
      });
    }

    console.log('✅ Item found:', item);

    if (!item.is_digital) {
      console.error('❌ Not digital');
      return res.status(400).json({
        success: false,
        message: 'This is not a digital product'
      });
    }

    if (!item.digital_file_url) {
      console.error('❌ No file URL');
      return res.status(404).json({
        success: false,
        message: 'Digital file not found'
      });
    }

    console.log('📦 File path:', item.digital_file_url);

    const signedUrl = await getSignedUrl(
      STORAGE_BUCKETS.DIGITAL_PRODUCTS,
      item.digital_file_url,
      3600 
    );

    if (!signedUrl) {
      console.error('❌ Failed to generate URL');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate download link'
      });
    }

    console.log('✅ Signed URL generated');

    
    const productName = Array.isArray(item.products) && item.products.length > 0
      ? item.products[0].name
      : 'download';

    res.json({
      success: true,
      downloadUrl: signedUrl,
      fileName: productName,
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      message: 'Download link generated successfully'
    });

  } catch (error: any) {
    console.error('❌ Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Download failed'
    });
  }
}

  async getProductById(req: Request, res: Response) {
    try {
      const { productId } = req.params;
 
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          stock,
          image_url,
          is_digital,
          merchant_id,
          merchants!inner (
            id,
            store_name
          )
        `)
        .eq('id', productId)
        .single();
 
      if (error || !product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
 
      res.json({
        success: true,
        data: {
          product: {
            ...product,
            store_name: Array.isArray(product.merchants)
              ? product.merchants[0]?.store_name
              : (product.merchants as any)?.store_name,
          },
        },
      });
    } catch (error: any) {
      logger.error('getProductById error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to get product' });
    }
  }
}

export default new StoreController();