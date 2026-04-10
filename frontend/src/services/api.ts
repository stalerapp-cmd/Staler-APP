
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const isAuthRoute =
          error.config?.url?.includes('/auth/login') ||
          error.config?.url?.includes('/auth/register') ||
          error.config?.url?.includes('/auth/forgot-password') ||
          error.config?.url?.includes('/auth/reset-password') ||
          error.config?.url?.includes('/auth/verify-email') ||
          error.config?.url?.includes('/auth/resend-verification');

        if (error.response?.status === 401 && !isAuthRoute) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }

        return Promise.reject(error);
      }
    );
  }


  async register(data: {
    walletId: string;
    fullName: string;
    email: string;
    password: string;
    role?: string;
    verificationMethod?: 'email';
  }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async verifyEmail(email: string, code: string) {
    const response = await this.api.post('/auth/verify-email', { email, code });
    return response.data;
  }

  async resendVerificationCode(email: string) {
    const response = await this.api.post('/auth/resend-verification', { email });
    return response.data;
  }

  async forgotPassword(email: string = '') {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(email: string = '', code: string, newPassword: string) {
    const response = await this.api.post('/auth/reset-password', {
      email,
      code,
      newPassword,
    });
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: {
    fullName?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
  }) {
    const response = await this.api.put('/auth/update-profile', data);
    return response.data;
  }

  async deleteAccount() {
    const response = await this.api.delete('/auth/delete-account');
    return response.data;
  }

  async uploadProfileImage(formData: FormData) {
    const response = await this.api.post('/auth/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async deleteProfileImage() {
    const response = await this.api.delete('/auth/delete-profile-image');
    return response.data;
  }

async linkBankAccount(bankUsername: string, bankPassword: string) {
  const response = await this.api.post('/bank/link-bank', { bankUsername, bankPassword });
  return response.data;
}
  async getWallet() {
    const response = await this.api.get('/wallet');
    return response.data;
  }

  async getTransactions() {
    const response = await this.api.get('/wallet/transactions');
    return response.data;
  }

  async transfer(toWalletId: string, amount: number, description?: string) {
    const response = await this.api.post('/wallet/transfer', { toWalletId, amount, description });
    return response.data;
  }

  async checkBankBalance(bankUsername: string, bankPassword: string) {
    const response = await this.api.post('/bank/check-balance', { bankUsername, bankPassword });
    return response.data;
  }

  async withdrawToWallet(bankUsername: string, bankPassword: string, amount: number) {
    const response = await this.api.post('/bank/withdraw', { bankUsername, bankPassword, amount });
    return response.data;
  }

  async autoWithdraw(bankUsername: string, bankPassword: string, amount: number) {
    const response = await this.api.post('/bank/auto-withdraw', { bankUsername, bankPassword, amount });
    return response.data;
  }

  async getBankInfo(bankUsername: string, bankPassword: string) {
    const response = await this.api.get('/bank/info', { params: { bankUsername, bankPassword } });
    return response.data;
  }

  async getReserves() {
    const response = await this.api.get('/bank/reserves');
    return response.data;
  }

  async autoWithdrawSaved(amount: number) {
    const response = await this.api.post('/bank/auto-withdraw/saved', { amount });
    return response.data;
  }

  async withdrawFromBank(userId: number, amount: number) {
    const response = await this.api.post('/bank/withdraw', { userId, amount });
    return response.data;
  }

  async depositToBank(amount: number) {
    const response = await this.api.post('bank/deposit', { amount });
    return response.data;
  }


  async getAdminStats() {
    const response = await this.api.get('/admin/stats');
    return response.data;
  }

  async getAllUsers(page: number = 1, limit: number = 50) {
    const response = await this.api.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  }

  async createUserBankAccount(userId: number, bankUsername: string, bankPassword: string, initialBalance: number = 0) {
    const response = await this.api.post('/admin/create-bank-account', { userId, bankUsername, bankPassword, initialBalance });
    return response.data;
  }

  async fundUserWallet(userId: number, amount: number) {
    const response = await this.api.post('/admin/fund-wallet', { userId, amount });
    return response.data;
  }

  deleteUser(userId: string) {
    return this.api.delete(`/admin/users/${userId}`);
  }

  resetUserPassword(userId: string, newPassword: string) {
    return this.api.post(`/admin/users/${userId}/reset-password`, { newPassword });
  }

  changeUserRole(userId: string, role: string) {
    return this.api.patch(`/admin/change-role/${userId}`, { role });
  }

  async updateStore(storeId: number, data: { storeName?: string; description?: string; status?: string }) {
    const response = await this.api.patch(`/admin/stores/${storeId}`, data);
    return response.data;
  }

  async deleteStore(storeId: number) {
    const response = await this.api.delete(`/admin/stores/${storeId}`);
    return response.data;
  }

  async createAdminUser(data: { email: string; password: string; fullName: string; adminLevel: 'admin' | 'super_admin' }) {
    const response = await this.api.post('/auth/admin/create-admin', data);
    return response.data;
  }

  async createVerifiedUser(data: { fullName: string; email: string; password: string; role: string; phoneNumber?: string }) {
    const response = await this.api.post('/admin/create-user', data);
    return response.data;
  }

  getUserById(userId: string) {
    return this.api.get(`/admin/users/${userId}`);
  }

  async getAdminSettings() {
    const response = await this.api.get('/admin/settings');
    return response.data;
  }

  async updateAdminSettings(data: { siteName: string; currency: string; bankUrl: string; theme: string }) {
    const response = await this.api.put('/admin/settings', data);
    return response.data;
  }

  async getAdminStores() {
    const response = await this.api.get('/admin/stores');
    return response.data;
  }

  async updateUser(userId: string, data: { fullName?: string; email?: string; role?: string }) {
    const response = await this.api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

 
  async createMerchant(storeName: string, description: string) {
    const response = await this.api.post('/merchant/create', { storeName, description });
    return response.data;
  }

  async getMerchantProfile() {
    const response = await this.api.get('/merchant/profile');
    return response.data;
  }

  async uploadProductImage(formData: FormData) {
    const response = await this.api.post('/merchant/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadDigitalFile(formData: FormData) {
    const response = await this.api.post('/merchant/products/upload-digital', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async addProduct(productData: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    stock: number;
    isDigital?: boolean;
    digitalFileUrl?: string;
  }) {
    const response = await this.api.post('/merchant/products', productData);
    return response.data;
  }

  async getMerchantProducts() {
    const response = await this.api.get('/merchant/products');
    return response.data;
  }

  async updateProduct(productId: number, productData: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    stock: number;
    isDigital?: boolean;
    digitalFileUrl?: string;
  }) {
    const response = await this.api.put(`/merchant/products/${productId}`, productData);
    return response.data;
  }

  async deleteProduct(productId: number, force: boolean = false) {
    const url = force ? `/merchant/products/${productId}?force=true` : `/merchant/products/${productId}`;
    const response = await this.api.delete(url);
    return response.data;
  }

  async updateOrderStatus(orderId: string | number, status: string) {
    const response = await this.api.put(`/merchant/orders/${String(orderId)}/status`, { status });
    return response.data;
  }

  async getMerchantOrders() {
    const response = await this.api.get('/merchant/orders');
    return response.data;
  }

  async getStoreProducts() {
    const response = await this.api.get('/store/products');
    return response.data;
  }

  async createOrder(items: { productId: number; quantity: number }[]) {
    const response = await this.api.post('/store/orders', { items });
    return response.data;
  }

  async processPayment(orderId: string) {
    const response = await this.api.post('/store/payment', { orderId });
    return response.data;
  }

  async getUserOrders() {
    const response = await this.api.get('/store/orders');
    return response.data;
  }

  async getOrderDetails(orderId: number) {
    const response = await this.api.get(`/store/orders/${orderId}`);
    return response.data;
  }

  async downloadDigitalProduct(orderId: number, itemId: number): Promise<any> {
    const response = await this.api.get(`/store/download/${orderId}/${itemId}`);
    return response.data;
  }

  
  async get(url: string) {
    const response = await this.api.get(url);
    return response.data;
  }

  async claimExchangeFunds(exchangeWalletId: string, amount: number, description?: string, timestamp?: number) {
    const response = await this.api.post('/exchange/claim', { exchangeWalletId, amount, description, timestamp });
    return response.data;
  }

 
  async requestProfileUpdate(data: {
    updateType: 'email' | 'phone' | 'password' | 'profile';
    newValue: string | null;
    fullName?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
  }) {
    const response = await this.api.post('/auth/request-profile-update', data);
    return response.data;
  }

  async verifyAndUpdateProfile(data: {
    verificationCode: string;
    fullName?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
  }) {
    const response = await this.api.post('/auth/verify-and-update-profile', data);
    return response.data;
  }

  async requestAccountDeletion() {
    const response = await this.api.post('/auth/request-account-deletion');
    return response.data;
  }

  async confirmAccountDeletion(code: string) {
    const response = await this.api.post('/auth/confirm-account-deletion', { code });
    return response.data;
  }
  async getPendingUsers() {
  return this.api.get('/admin/pending-users').then((r: any) => r.data);
}
async deletePendingUser(id: string) {
  return this.api.delete(`/admin/pending-users/${id}`).then((r: any) => r.data);
}
async clearExpiredPending() {
  return this.api.delete('/admin/pending-users').then((r: any) => r.data);
}
async updatePendingUser(id: string, data: any) {
  return this.api.patch(`/admin/pending-users/${id}`, data).then((r: any) => r.data);
}
 async withdrawFromBankQR(operationId: string) {
  const response = await this.api.post('/bank/withdraw-qr', { operationId });
  return response.data;
}

async getBankOperation(operationId: string) {
  const response = await this.api.get(
    `/bank/operation/${operationId}`
  );
  return response.data;
}


}

export default new ApiService();