
// src/pages/Merchant/MerchantOrders.tsx (FIXED)

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import { 
  ShoppingBag, 
  Package, 
  Loader, 
  AlertCircle,
  User,
  DollarSign,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';

interface Order {
  id: string | number;  
  total_amount: number;
  payment_status: string;
  status: string;  
  created_at: string;
  items_count?: number;
  currency?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md animate-slide-in`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 p-1 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const MerchantOrders: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [updating, setUpdating] = useState<string | number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(order =>
        order.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.id).includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, filterStatus, orders]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type });
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiService.getMerchantOrders();
      if (res.success) {
        console.log('📦 Loaded orders:', res.data.orders);
        setOrders(res.data.orders);
        setFilteredOrders(res.data.orders);
      }
    } catch (err: any) {
      console.error('Load orders error:', err);
      setError(t.merchantOrders.failedToLoadOrders);
      showToast(err.response?.data?.message || t.merchantOrders.failedToLoadOrders, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleStatusChange = async (orderId: string | number, newStatus: string) => {
    console.log('🔄 Changing status:', { orderId, newStatus });
    
    try {
      setUpdating(orderId);
  const orderIdStr = String(orderId);
      const res = await apiService.updateOrderStatus(orderIdStr, newStatus);     
      console.log('✅ Update response:', res);
      
      if (res.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
showToast('Order status updated successfully!', 'success');      } else {
        throw new Error(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      console.error('❌ Failed to update status:', err);
      console.error('Error details:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          t.merchantOrders.failedToUpdateStatus;
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
      
      await loadOrders();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.merchantOrders.loadingOrders}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-8 px-4">
      {}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.merchantOrders.customerOrders}
              </h1>
              <p className="text-gray-600">{t.merchantOrders.manageTrackOrders}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-sm text-red-600 hover:text-red-800 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.merchantOrders.searchByCustomer}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="all">{t.merchantOrders.allOrders}</option>
                <option value="pending">{t.merchantOrders.pending}</option>
                <option value="processing">{t.merchantOrders.processing}</option>
                <option value="completed">{t.merchantOrders.completed}</option>
                <option value="cancelled">{t.merchantOrders.cancelled}</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t.merchantOrders.showing} {filteredOrders.length} {t.merchantOrders.of} {orders.length} {orders.length !== 1 ? t.merchantOrders.orders : t.merchantOrders.order}
          </p>
        </div>

        {}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.merchantOrders.noOrdersFound}</h2>
            <p className="text-gray-500">
              {orders.length === 0 
                ? t.merchantOrders.noOrdersYet
                : t.merchantOrders.noMatchingOrders}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      {t.merchantOrders.order}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      {t.merchantOrders.customer}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      {t.merchantOrders.amount}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      {t.merchantOrders.payment}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      {t.merchantOrders.status}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      {t.merchantOrders.date}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <ShoppingBag className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">#{String(order.id).slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">{order.items_count || 1} {(order.items_count || 1) > 1 ? t.merchantOrders.items : t.merchantOrders.item}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.users?.full_name || t.merchantOrders.unknown}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.users?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">
                            {order.total_amount}
                          </span>
                          <span className="text-sm text-gray-500">{order.currency || 'PS'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500 ${getStatusColor(order.status)} ${updating === order.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="pending">{t.merchantOrders.pending}</option>
                          <option value="processing">{t.merchantOrders.processing}</option>
                          <option value="completed">{t.merchantOrders.completed}</option>
                          <option value="cancelled">{t.merchantOrders.cancelled}</option>
                        </select>
                        {updating === order.id && (
                          <Loader className="w-4 h-4 text-purple-600 animate-spin inline-block ml-2" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {}
        {orders.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t.merchantOrders.totalOrders}</p>
              <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t.merchantOrders.pending}</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t.merchantOrders.processing}</p>
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t.merchantOrders.completed}</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default MerchantOrders;