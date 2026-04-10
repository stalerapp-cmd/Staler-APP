

export interface User {
  id: string;  
  walletId: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user' | 'merchant' | 'exchange';
    adminLevel?: string | null; 

  profileImage?: string;
   emailVerified: boolean;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  verificationMethod: 'email' | 'sms';
}

export interface Wallet {
  walletId: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  fromAccount: string;
  toAccount: string;
  createdAt: string;
}

export interface Product {
  id: number;
  merchant_id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  stock: number;
  status: string;
  store_name?: string;
  created_at: string;
  is_digital: boolean;
  digital_file_url?: string;
}

export interface Order {
  id: number;
  user_id: number;
  merchant_id: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  store_name?: string;
  created_at: string;
  items?: OrderItem[];
  items_count?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  name?: string;
  image_url?: string;
  is_digital: boolean;
  digital_file_url?: string;
}

export interface Merchant {
  id: number;
  user_id: number;
  store_name: string;
  description: string;
  wallet_id: string;
  status: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMerchants: number;
  totalBalance: number;
  totalTransactions: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    statusCode: number;
    message: string;
  };
}