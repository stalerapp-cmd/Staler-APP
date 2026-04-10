

import { Request, Response } from 'express';
import merchantService from '../services/merchantService';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/supabase';  
class MerchantController {
 
  async createMerchant(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { storeName, description } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!storeName) {
        return res.status(400).json({
          success: false,
          message: 'Store name is required',
        });
      }

      const merchant = await merchantService.createMerchant(
        userId,
        storeName,
        description || ''
      );

      res.status(201).json({
        success: true,
        message: 'Merchant profile created successfully',
        data: { merchant },
      });
    } catch (error: any) {
      logger.error('Create merchant error:', error.message);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create merchant',
      });
    }
  }

  async getMerchant(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const merchant = await merchantService.getMerchantByUserId(userId);

      res.json({
        success: true,
        data: { merchant },
      });
    } catch (error: any) {
      logger.error('Get merchant error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get merchant',
      });
    }
  }

  async addProduct(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        name,
        description,
        price,
        imageUrl,
        stock,
        isDigital,
        digitalFileUrl,
      } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const merchant = await merchantService.getMerchantByUserId(userId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant profile not found',
        });
      }

      if (!name || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Product name and price are required',
        });
      }

      if (isDigital && !digitalFileUrl) {
        return res.status(400).json({
          success: false,
          message: 'Digital products must include a file',
        });
      }

      const product = await merchantService.addProduct(merchant.id, {
        name,
        description,
        price,
        imageUrl,
        stock: Number(stock) || 0,
        isDigital: Boolean(isDigital),
        digitalFileUrl: digitalFileUrl || null,
      });

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: { product },
      });
    } catch (error: any) {
      logger.error('Add product error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to add product',
      });
    }
  }

  async getProducts(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const merchant = await merchantService.getMerchantByUserId(userId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant profile not found',
        });
      }

      const products = await merchantService.getMerchantProducts(merchant.id);

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
  async getOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const merchant = await merchantService.getMerchantByUserId(userId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant profile not found',
        });
      }

      const orders = await merchantService.getMerchantOrders(merchant.id);

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

async updateProduct(req: Request, res: Response) {
  try {
const productId = req.params.id; 
const userId = req.user?.userId;
if (!userId) {
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
const merchant = await merchantService.getMerchantByUserId(userId);
if (!merchant) {
  return res.status(404).json({ success: false, message: 'Merchant profile not found' });
}
const merchantId = merchant.id;    
    if (!merchantId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const {
      name,
      description,
      price,
      imageUrl,
      stock,
      isDigital,
      digitalFileUrl,
    } = req.body;

    console.log('📝 Updating product:', { 
      productId, 
      merchantId, 
      stock,
      data: req.body 
    });

    const { data: existingProduct, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id, merchant_id, name, stock')
      .eq('id', productId)
      .single();

    if (checkError) {
      console.error('❌ Database error:', checkError);
      return res.status(500).json({
        success: false,
        message: `Database error: ${checkError.message}`,
      });
    }

    if (!existingProduct) {
      console.error('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (existingProduct.merchant_id !== merchantId) {
      console.error('❌ Merchant mismatch:', { 
        productMerchant: existingProduct.merchant_id, 
        requestMerchant: merchantId 
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    console.log('✅ Product found:', existingProduct);

    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        name,
        description,
        price: Number(price),
        image_url: imageUrl,
        stock: Number(stock),
        is_digital: Boolean(isDigital),
        digital_file_url: digitalFileUrl,
      })
      .eq('id', productId)
      .eq('merchant_id', merchantId)  
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: `Update failed: ${updateError.message}`,
      });
    }

    if (!updatedProduct) {
      return res.status(500).json({
        success: false,
        message: 'Product update returned no data',
      });
    }

    console.log('✅ Product updated successfully:', updatedProduct);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct },
    });
  } catch (error: any) {
    console.error('❌ Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
}
  async deleteProduct(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const productId = req.params.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const merchant = await merchantService.getMerchantByUserId(userId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant profile not found',
        });
      }

      const product = await merchantService.deleteProduct(productId);

      res.json({
        success: true,
        message: `Product "${product.name}" deleted successfully`,
      });
    } catch (error: any) {
      logger.error('Delete product error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete product',
      });
    }
  }

  
  async updateOrderStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const orderId = req.params.id;
      const { status } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const merchant = await merchantService.getMerchantByUserId(userId);
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: 'Merchant profile not found',
        });
      }

      const order = await merchantService.updateOrderStatus(
        merchant.id,
        orderId,
        status
      );

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { order },
      });
    } catch (error: any) {
      logger.error('Update order status error:', error.message);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update order status',
      });
    }
  }
}

export default new MerchantController();