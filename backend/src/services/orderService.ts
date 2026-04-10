
// src/services/orderService.ts (FIXED - Order not found issue)

import { supabaseAdmin } from '../config/supabase';
import walletService from './walletService';
import { logger } from '../utils/logger';

class OrderService {
  
  async createOrder(userId: string, items: any[]) {
    try {
      let totalAmount = 0;
      let merchantId: string | null = null;

      for (const item of items) {
        const { data: product, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', item.productId)
          .single();

        if (error || !product) {
          logger.error(`❌ Product ${item.productId} not found:`, error);
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`
          );
        }

        merchantId = product.merchant_id;
        totalAmount += product.price * item.quantity;
      }

      const userWallet = await walletService.getWalletByUserId(userId);
      if (!userWallet || Number(userWallet.balance) < totalAmount) {
        throw new Error('Insufficient balance');
      }

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: userId,
          merchant_id: merchantId,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        logger.error('❌ Order creation error:', orderError);
        throw orderError;
      }

      logger.info(`📦 Order created: ${order.id}`);

      for (const item of items) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', item.productId)
          .single();

        if (!product) {
          logger.error(`❌ Product ${item.productId} not found when adding to order items`);
          continue;
        }

        const { error: itemError } = await supabaseAdmin
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: product.price,
            is_digital: product.is_digital || false,
            digital_file_url: product.digital_file_url || null,
          });

        if (itemError) {
          logger.error('❌ Error adding order item:', itemError);
          throw itemError;
        }

        const { error: stockError } = await supabaseAdmin
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.productId);

        if (stockError) {
          logger.error('❌ Error updating stock:', stockError);
        }
      }

      logger.info(`🧾 Order created successfully: ${order.id} by user ${userId}`);
      return order;
    } catch (error: any) {
      logger.error('❌ Create order error:', error.message);
      throw error;
    }
  }

  
  async processPayment(orderId: string, userId: string) {
  try {
    logger.info(`💳 Processing payment for order ${orderId}, user ${userId}`);

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(is_digital)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      logger.error('❌ Order not found:', { orderId, userId, error });
      throw new Error('Order not found');
    }

    if (order.payment_status === 'completed') {
      throw new Error('Order already paid');
    }

    const userWallet = await walletService.getWalletByUserId(userId);
    if (!userWallet) {
      throw new Error('User wallet not found');
    }

    if (Number(userWallet.balance) < Number(order.total_amount)) {
      throw new Error('Insufficient balance');
    }

    const hasDigitalProducts = order.order_items?.some((item: any) => item.is_digital);
    
    logger.info(`📦 Order type: ${hasDigitalProducts ? 'Digital (full payment)' : 'Physical (escrow)'}`);

    await walletService.updateBalance(userWallet.wallet_id, -order.total_amount);

    await walletService.recordTransaction({
      userId,
      walletId: userWallet.wallet_id,
      type: 'purchase',
      amount: -order.total_amount,
      status: 'completed',
      description: `Purchase order #${order.id}${hasDigitalProducts ? ' (Digital - Instant)' : ' (Physical - Pending Delivery)'}`,
      fromAccount: userWallet.wallet_id,
      toAccount: null, 
    });

    if (hasDigitalProducts) {
      const { data: merchantWallet, error: merchantError } = await supabaseAdmin
        .from('wallets')
        .select(`
          *,
          merchants!inner(id, store_name)
        `)
        .eq('merchants.id', order.merchant_id)
        .single();

      if (merchantError || !merchantWallet) {
        logger.error('❌ Merchant wallet not found:', merchantError);
        throw new Error('Merchant wallet not found');
      }

      await walletService.updateBalance(merchantWallet.wallet_id, order.total_amount);

      await walletService.recordTransaction({
        userId: merchantWallet.user_id,
        walletId: merchantWallet.wallet_id,
        type: 'sale',
        amount: order.total_amount,
        status: 'completed',
        description: `Digital product sale - Order #${order.id}`,
        fromAccount: userWallet.wallet_id,
        toAccount: merchantWallet.wallet_id,
      });

      logger.info(`💰 Digital product - Instant transfer to merchant`);
    } else {
      logger.info(`⏳ Physical product - Payment held in escrow (will transfer when completed)`);
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'processing',
      })
      .eq('id', order.id);

    if (updateError) {
      logger.error('❌ Error updating order:', updateError);
      throw updateError;
    }

    logger.info(`✅ Payment processed for order ${orderId}`);
    return { success: true, orderId };
  } catch (error: any) {
    logger.error('❌ Process payment error:', error.message);
    throw error;
  }
}
  async getUserOrders(userId: string) {
    try {
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          merchants(id, store_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Error fetching user orders:', error);
        throw error;
      }

      for (const order of orders || []) {
        const { data: items, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select(`
            id,
            order_id,
            product_id,
            quantity,
            price,
            is_digital,
            digital_file_url,
            products(name, image_url)
          `)
          .eq('order_id', order.id);

        if (itemsError) {
          logger.error(`❌ Error fetching items for order ${order.id}:`, itemsError);
          order.items = [];
        } else {
order.items = (items || []).map((item: any) => {
  let productName = 'Unknown Product';
  let productImage = null;

  if (Array.isArray(item.products)) {
    if (item.products.length > 0) {
      productName = item.products[0].name || 'Unknown Product';
      productImage = item.products[0].image_url || null;
    }
  } else if (item.products && typeof item.products === 'object') {
    productName = item.products.name || 'Unknown Product';
    productImage = item.products.image_url || null;
  }

  return {
    ...item,
    product_name: productName,
    product_image: productImage
  };
});
        }
      }

      logger.info(`📋 Loaded ${orders?.length || 0} orders for user ${userId}`);
      return orders || [];
    } catch (error: any) {
      logger.error('❌ Get user orders error:', error.message);
      throw error;
    }
  }

  async getOrderDetails(orderId: string, userId: string){
    try {
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          merchants(id, store_name)
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (error || !order) {
        logger.error('❌ Order not found:', { orderId, userId, error });
        throw new Error('Order not found');
      }

      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
          *,
          products(name, image_url)
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        logger.error('❌ Error fetching order items:', itemsError);
      }

      return {
        ...order,
        items: items || [],
      };
    } catch (error: any) {
      logger.error('❌ Get order details error:', error.message);
      throw error;
    }
  }
}

export default new OrderService();