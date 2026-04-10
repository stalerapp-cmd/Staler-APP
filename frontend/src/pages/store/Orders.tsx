

// src/pages/store/Orders.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import { Package, Download, FileText, CheckCircle, Clock, XCircle, Loader, File, ShoppingBag, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  is_digital: boolean;
  digital_file_url?: string;
}

interface Order {
  id: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  items: OrderItem[];
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 max-w-md animate-slide-in`}>
      {icons[type]}
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const Orders: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiService.getUserOrders();
      if (res.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ message, type });
  };

  const handleDownload = async (orderId: number, itemId: number, productName: string) => {
    try {
      setDownloading(itemId);
      
      const response = await apiService.downloadDigitalProduct(orderId, itemId);
      
      if (response.success && response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
        
        showToast(
          t.orders.downloadStarted.replace('{productName}', productName), 
          'success'
        );
        
        setTimeout(() => {
          showToast(t.orders.linkExpiryWarning, 'info');
        }, 1500);
      } else {
        showToast(t.orders.failedToGetDownloadLink, 'error');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      showToast(
        error.response?.data?.message || t.orders.failedToDownload,
        'error'
      );
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      processing: <Loader className="w-4 h-4 animate-spin" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };

    const labels = {
      pending: t.orders?.pending || 'Pending',
      processing: t.orders?.processing || 'Processing',
      completed: t.orders?.completed || 'Completed',
      cancelled: t.orders?.cancelled || 'Cancelled',
    };

    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    return status === 'completed' ? (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <CheckCircle className="w-4 h-4" />
        {t.orders?.completed || 'Completed'}
      </span>
    ) : (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        <Clock className="w-4 h-4" />
        {t.orders?.pending || 'Pending'}
      </span>
    );
  };

  const calculateTotal = () => {
    return orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.orders?.loadingOrders || 'Loading your orders...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-4 sm:py-8 px-2 sm:px-4">

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {t.orders?.myOrders || 'My Orders'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t.orders?.viewHistory || 'Track and view your order history'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {t.orders?.totalOrders || 'Total Orders'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">{orders.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <ShoppingBag className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {t.orders?.totalSpent || 'Total Spent'}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {calculateTotal().toFixed(2)} PS
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Package className="w-6 sm:w-8 h-6 sm:h-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 text-center">
            <div className="bg-gray-100 w-20 sm:w-24 h-20 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 sm:w-12 h-10 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
              {t.orders?.noOrdersYet || 'No orders yet'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              {t.orders?.noOrdersDesc || 'Start shopping to see your orders here!'}
            </p>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              {t.orders?.startShopping || 'Start Shopping'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm">
                        <Package className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">
                          {t.orders?.orderNumber || 'Order #'}{order.id}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {t.orders?.orderedOn || 'Ordered on'} {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(order.order_status)}
                      {getPaymentBadge(order.payment_status)}
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 sm:gap-4 bg-gray-50 rounded-xl p-3 sm:p-4"
                        >
                          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                            {item.is_digital ? (
                              <>
                                <File className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                                  <Download className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                                </div>
                              </>
                            ) : (
                              <Package className="w-6 sm:w-8 h-6 sm:h-8 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm sm:text-base text-gray-800 truncate">
                                {item.product_name}
                              </h4>
                              {item.is_digital && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <File className="w-3 h-3" />
                                  {t.orders?.digital || 'Digital'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {t.orders?.qty || 'Qty'}: {item.quantity} • {Number(item.price || 0).toFixed(2)} PS {t.store?.each || 'each'}
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-purple-600 mt-1">
                              {t.orders?.total || 'Total'}: {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)} PS
                            </p>
                          </div>

                          {item.is_digital && item.digital_file_url && (
                            <div className="flex-shrink-0">
                              {order.payment_status === 'completed' ? (
                                <button
                                  onClick={() => handleDownload(order.id, item.id, item.product_name)}
                                  disabled={downloading === item.id}
                                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all text-xs sm:text-sm disabled:opacity-50"
                                >
                                  {downloading === item.id ? (
                                    <>
                                      <Loader className="w-4 h-4 animate-spin" />
                                      <span className="hidden sm:inline">{t.orders?.downloading || 'Downloading...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-4 h-4" />
                                      <span className="hidden sm:inline">{t.orders?.download || 'Download'}</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="text-xs text-gray-500 text-center max-w-[120px]">
                                  <Clock className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                                  <p>{t.orders?.availableAfterPayment || 'Available after payment'}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm sm:text-base text-gray-500">
                        {t.orders?.noItemsFound || 'No items found in this order'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2">
                        {t.orders?.contactSupport || 'Please contact support if this is an error'}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-semibold text-gray-700">
                        {t.orders?.total || 'Total'}:
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-purple-600">
                        {Number(order.total_amount || 0).toFixed(2)} PS
                      </span>
                    </div>
                  </div>

                  {order.items && order.items.some(item => item.is_digital) && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <File className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-1">
                            {t.orders?.digitalProducts || 'Digital Products'}
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-800">
                            {order.payment_status === 'completed'
                              ? `✅ ${t.orders?.filesReady || 'Your files are ready!'} ${t.orders?.downloadLinks || 'Click download buttons above.'}`
                              : `⏳ ${t.orders?.availableAfterPayment || 'Available after payment is completed'}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Orders;