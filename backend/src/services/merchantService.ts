
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import walletService from './walletService';  

class MerchantService {
 
  async createMerchant(
    userId: string,
    storeName: string,
    description: string
  ) {
    const { data: existing } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('Merchant profile already exists for this user');
    }

    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('id, wallet_id, user_id')
      .eq('user_id', userId)
      .single();

    if (walletErr || !wallet) {
      const newWalletId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: newWallet, error: createErr } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: userId,
          wallet_id: newWalletId, 
          balance: 0,
          currency: 'PS',
        })
        .select()
        .single();

      if (createErr || !newWallet) {
        logger.error('❌ Failed to create wallet:', createErr?.message);
        throw new Error('Failed to create wallet for merchant');
      }

      logger.info(`🆕 Wallet created: id=${newWallet.id}, wallet_id=${newWalletId}`);

      const walletUuid = newWallet.id;

      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .insert({
          user_id: userId,
          store_name: storeName,
          description,
          wallet_id: walletUuid,  
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Create merchant error:', error.message);
        throw error;
      }

      logger.info(`🏪 Merchant created for user ${userId}`);
      return merchant;
    }

    logger.info(`📦 Found wallet: id=${wallet.id}, wallet_id=${wallet.wallet_id}`);

    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .insert({
        user_id: userId,
        store_name: storeName,
        description,
        wallet_id: wallet.id,  
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ Create merchant error:', error.message);
      logger.error('❌ Error details:', JSON.stringify(error));
      throw error;
    }

    logger.info(`🏪 Merchant created for user ${userId}, wallet_id=${wallet.id}`);
    return merchant;
  }

  async getMerchantByUserId(userId: string) {
    const { data } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data || null;
  }

 
  async addProduct(merchantId: string, product: any) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        merchant_id: merchantId,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.imageUrl || null,
        stock: product.stock || 0,
        is_digital: product.isDigital || false,
        digital_file_url: product.digitalFileUrl || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      logger.error('❌ Add product error:', error.message);
      throw error;
    }

    return data;
  }

  async getMerchantProducts(merchantId: string) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    return data || [];
  }

async getAllProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      merchants (
        id,
        store_name,
        user_id
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('❌ Get all products error:', error.message);
    return [];
  }

  const mappedProducts = (data || []).map(product => ({
    ...product,
    store_name: product.merchants?.store_name || 'Unknown Store'
  }));

  logger.info(`📦 Loaded ${mappedProducts.length} products from ${new Set(mappedProducts.map(p => p.store_name)).size} stores`);
  
  return mappedProducts;
}

  async updateProduct(productId: string, product: any) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.imageUrl || null,
        stock: product.stock || 0,
        is_digital: product.isDigital || false,
        digital_file_url: product.digitalFileUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Product not found');
    }

    return data;
  }

  async deleteProduct(productId: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Product not found');
    }

    return data;
  }

  
  async getMerchantOrders(merchantId: string) {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*, users(full_name, email)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    return data || [];
  }

async updateOrderStatus(
  merchantId: string,
  orderId: string | number,
  status: string
) {
  const orderIdStr = String(orderId);
  
  logger.info(`🔄 Merchant ${merchantId} updating order ${orderIdStr} to: ${status}`);

  const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const { data: existingOrder, error: checkError } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      merchant_id,
      user_id,
      status,
      payment_status,
      total_amount,
      order_items(is_digital)
    `)
    .eq('id', orderIdStr)
    .single();

  if (checkError || !existingOrder) {
    logger.error(`❌ Order not found:`, checkError);
    throw new Error('Order not found');
  }

  if (existingOrder.merchant_id !== merchantId) {
    logger.error(`❌ Merchant mismatch`);
    throw new Error('Not authorized');
  }

  const hasDigitalProducts = existingOrder.order_items?.some((item: any) => item.is_digital);
if (existingOrder.status === 'completed' && status !== 'completed') {
  logger.warn(`⚠️ Security: Attempted to change completed order - BLOCKED`);
  throw new Error('Cannot change status from completed. Order is finalized.');
}
  if (status === 'completed' && existingOrder.status !== 'completed' && !hasDigitalProducts) {
    logger.info(`💰 Order completed - Transferring payment to merchant`);

    const { data: merchantWallet, error: merchantError } = await supabaseAdmin
      .from('wallets')
      .select(`
        *,
        merchants!inner(id)
      `)
      .eq('merchants.id', merchantId)
      .single();

    if (!merchantError && merchantWallet) {
      await walletService.updateBalance(merchantWallet.wallet_id, existingOrder.total_amount);

      await walletService.recordTransaction({
        userId: merchantWallet.user_id,
        walletId: merchantWallet.wallet_id,
        type: 'sale',
        amount: existingOrder.total_amount,
        status: 'completed',
        description: `Physical product sale - Order #${existingOrder.id} (Completed)`,
        fromAccount: null,
        toAccount: merchantWallet.wallet_id,
      });

      logger.info(`✅ Payment transferred to merchant on completion`);
    }
  }

  if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
    logger.info(`🔙 Order cancelled - Refunding user`);

    const userWallet = await walletService.getWalletByUserId(existingOrder.user_id);

    if (userWallet) {
      await walletService.updateBalance(userWallet.wallet_id, existingOrder.total_amount);

      await walletService.recordTransaction({
        userId: existingOrder.user_id,
        walletId: userWallet.wallet_id,
        type: 'refund',
        amount: existingOrder.total_amount,
        status: 'completed',
        description: `Refund for cancelled order #${existingOrder.id}`,
        fromAccount: null,
        toAccount: userWallet.wallet_id,
      });

      logger.info(`✅ Refund issued to user`);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', orderIdStr)
    .eq('merchant_id', merchantId)
    .select()
    .single();

  if (error) {
    logger.error('❌ Update error:', error);
    throw new Error(`Failed to update: ${error.message}`);
  }

  logger.info(`✅ Order ${orderIdStr} updated to: ${status}`);
  return data;
}
}

export default new MerchantService();