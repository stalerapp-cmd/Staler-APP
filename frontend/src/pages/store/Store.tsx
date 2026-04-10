
// src/pages/store/Store.tsx

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import {
  ShoppingCart, Store as StoreIcon, Package, X, Plus, Minus,
  Trash2, CreditCard, File, Download, CheckCircle, Loader, LogIn,
  Share2, Copy, Link as LinkIcon,
} from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

interface GroupedProducts { [storeName: string]: Product[]; }

interface ToastProps { message: string; type: 'success' | 'error' | 'warning'; onClose: () => void; }
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500' };
  return (
    <div className={`fixed top-4 right-4 z-[9999] ${colors[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-xs sm:max-w-md animate-slide-in`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <X className="w-5 h-5 flex-shrink-0" />}
      <span className="flex-1 font-medium text-sm sm:text-base">{message}</span>
      <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 p-1 rounded flex-shrink-0"><X className="w-4 h-4" /></button>
    </div>
  );
};


const CopyToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
    </div>
  );
};

interface LoginNudgeProps { onClose: () => void; redirectTo: string; }
const LoginNudge: React.FC<LoginNudgeProps> = ({ onClose, redirectTo }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:p-6 text-center">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t.auth.loginTitle}</h2>
        <p className="text-gray-500 text-sm mb-5">{t.auth.dontHaveAccount}</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
            {t.auth.loginHere}
          </button>
          <button onClick={() => navigate(`/register?redirect=${encodeURIComponent(redirectTo)}`)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
            {t.auth.registerHere}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm py-2">{t.common.cancel}</button>
        </div>
      </div>
    </div>
  );
};

const Store: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();


  const storeParam = searchParams.get('store') || 'all';

  const [products,            setProducts]            = useState<Product[]>([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState('');
  const [cart, setCart] = useState<{ productId: number; quantity: number }[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [showCart,            setShowCart]            = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [toast,               setToast]               = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [copyToast,           setCopyToast]           = useState('');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<{ show: boolean; products: string[] }>({ show: false, products: [] });
  const [showLoginNudge,      setShowLoginNudge]      = useState(false);
  const [checkingOut,         setCheckingOut]         = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => setToast({ message, type });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiService.getStoreProducts();
      if (res.success) {
        const processed = res.data.products.map((p: any) => ({
          ...p,
          store_name: p.merchants?.store_name || p.store_name || 'Unknown Store',
        }));
        setProducts(processed);
      }
    } catch {
      setError(t.store.loadingStore);
    } finally {
      setLoading(false);
    }
  };

  const selectStore = useCallback((name: string) => {
    if (name === 'all') {
      searchParams.delete('store');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ store: name }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const copyToClipboard = async (url: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast(msg);
    } catch {}
  };

  const shareStore = (storeName?: string) => {
    const base = `${window.location.origin}/store`;
    const url = storeName ? `${base}?store=${encodeURIComponent(storeName)}` : base;
    if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
      navigator.share({ title: storeName || 'S-Taler Store', url }).catch(() => copyToClipboard(url, t.store.storeLinkCopied));
    } else {
      copyToClipboard(url, t.store.storeLinkCopied);
    }
  };

  const groupedProducts: GroupedProducts = products.reduce((acc, p) => {
    const name = p.store_name || 'Unknown Store';
    if (!acc[name]) acc[name] = [];
    acc[name].push(p);
    return acc;
  }, {} as GroupedProducts);

  const storeNames = Object.keys(groupedProducts);
  const isFilteredByStore = storeParam !== 'all';
  const displayedProducts = isFilteredByStore ? (groupedProducts[storeParam] || []) : products;

  const addToCart = (productId: number) => {
    if (!user) { setShowLoginNudge(true); return; }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock === 0) { showToast(t.store.productOutOfStock, 'warning'); return; }
    const existing = cart.find(i => i.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) { showToast(t.store.cannotAddMore, 'warning'); return; }
      setCart(cart.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { productId, quantity: 1 }]);
    }
    showToast(`${product.name} ${t.store.addedToCart}`, 'success');
  };

  const removeFromCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    setCart(cart.filter(i => i.productId !== productId));
    if (product) showToast(`${product.name} ${t.store.removedFromCart}`, 'success');
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (quantity <= 0) { removeFromCart(productId); return; }
    if (product && quantity > product.stock) { showToast(t.store.quantityExceedsStock, 'warning'); return; }
    setCart(cart.map(i => i.productId === productId ? { ...i, quantity } : i));
  };

  const calculateTotal = () =>
    cart.reduce((total, item) => total + (products.find(p => p.id === item.productId)?.price || 0) * item.quantity, 0);

  const checkPreviousPurchases = async (cartItems: { productId: number; quantity: number }[]) => {
    try {
      const res = await apiService.getUserOrders();
      if (!res.success) return [];
      const orders = res.data.orders || [];
      return cartItems.filter(ci => {
        const product = products.find(p => p.id === ci.productId);
        if (!product?.is_digital) return false;
        return orders.some((o: any) =>
          o.payment_status === 'completed' &&
          o.items?.some((i: any) => i.product_id === ci.productId && i.is_digital)
        );
      }).map(ci => ci.productId);
    } catch { return []; }
  };

  const handleProceedToCheckout = async () => {
    if (!user) { setShowLoginNudge(true); return; }
    if (cart.length === 0) { showToast(t.store.cartEmpty, 'warning'); return; }

    setCheckingOut(true);
    try {
      const previouslyBought = await checkPreviousPurchases(cart);
      if (previouslyBought.length > 0) {
        const names = previouslyBought.map(id => products.find(p => p.id === id)?.name).filter(Boolean);
        setShowDuplicateWarning({ show: true, products: names as string[] });
        return;
      }
      setShowCart(false);
      setShowCheckoutConfirm(true);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const orderRes = await apiService.createOrder(cart);
      if (orderRes.success) {
        const paymentRes = await apiService.processPayment(orderRes.data.order.id);
        if (paymentRes.success) {
          showToast(t.store.orderPlaced, 'success');
          setCart([]);
          localStorage.removeItem('cart');
          setShowCart(false);
          setShowCheckoutConfirm(false);
          setTimeout(() => navigate('/orders'), 1500);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || t.store.checkoutFailed, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.store.loadingStore}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {copyToast && <CopyToast message={copyToast} onClose={() => setCopyToast('')} />}
        {showLoginNudge && <LoginNudge onClose={() => setShowLoginNudge(false)} redirectTo="/store" />}

        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-2">
            <p className="text-blue-800 text-sm">
              👋{' '}
              <Link to="/login" className="font-semibold underline">{t.auth.loginHere}</Link>
              {' '}{t.productDetail.or}{' '}
              <Link to="/register" className="font-semibold underline">{t.auth.registerHere}</Link>
              {' '}{t.productDetail.toPurchase}.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 sm:mb-8">
          <div className="flex-1 min-w-0">
            {isFilteredByStore ? (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t.store.viewingStore}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[200px] sm:max-w-none">
                    {storeParam}
                  </h1>
                  <button
                    onClick={() => shareStore(storeParam)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-full transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.store.shareStore}</span>
                    <Copy className="w-3 h-3 opacity-50" />
                  </button>
                </div>
                <button
                  onClick={() => selectStore('all')}
                  className="mt-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  {t.store.browseAllStores}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {t.store.store}
                  </h1>
                  <button
                    onClick={() => shareStore()}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-full transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.store.shareAllProducts}</span>
                    <Copy className="w-3 h-3 opacity-50" />
                  </button>
                </div>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">{t.store.browseProducts}</p>
              </div>
            )}
          </div>

          {user && (
            <button
              onClick={() => setShowCart(true)}
              className="relative w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{t.store.cart}</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        {!isFilteredByStore && storeNames.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3">
              <StoreIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-800 text-sm sm:text-base">{t.store.filterByStore}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectStore('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                  storeParam === 'all'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.store.allStores} ({products.length})
              </button>
              {storeNames.map(name => (
                <div key={name} className="flex items-center">
                  <button
                    onClick={() => selectStore(name)}
                    className={`px-3 sm:px-4 py-2 rounded-l-lg font-medium transition-all text-xs sm:text-sm ${
                      storeParam === name
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {name} ({groupedProducts[name].length})
                  </button>
                  <button
                    onClick={() => shareStore(name)}
                    title={t.store.shareStore}
                    className={`py-2 px-2 rounded-r-lg transition-all border-l ${
                      storeParam === name
                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 hover:text-emerald-600'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {displayedProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-md">
            <Package className="w-16 sm:w-20 h-16 sm:h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">{t.store.noProductsAvailable}</p>
            {isFilteredByStore && (
              <button onClick={() => selectStore('all')} className="mt-3 text-emerald-600 text-sm font-medium hover:underline">
                {t.store.browseAllStores}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {displayedProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group relative flex flex-col">
                {product.is_digital && (
                  <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <File className="w-3 h-3" />
                    <span className="hidden sm:inline">{t.store.digital}</span>
                  </div>
                )}
                <Link to={`/product/${product.id}`} className="block">
                  <div className="h-36 sm:h-44 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Package className="w-10 h-10 sm:w-14 sm:h-14 text-gray-400" />
                    )}
                  </div>
                </Link>
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <button
                    onClick={() => selectStore(product.store_name ?? 'all')}
                    className="flex items-center gap-1 mb-2 group/store w-fit"
                    title={t.store.filterByStore}
                  >
                    <StoreIcon className="w-3 h-3 text-gray-400 group-hover/store:text-emerald-500 transition-colors" />
                    <span className="text-xs text-gray-500 group-hover/store:text-emerald-600 font-medium transition-colors truncate max-w-[100px] sm:max-w-[140px]">
                      {product.store_name}
                    </span>
                  </button>
                  <Link to={`/product/${product.id}`} className="block flex-1">
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-1.5 text-gray-800 line-clamp-2 hover:text-green-600 transition-colors leading-snug">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{product.price} PS</span>
                    {!product.is_digital && (
                      <span className="text-xs text-gray-400">{t.store.stock}: {product.stock}</span>
                    )}
                  </div>
                  {product.is_digital && (
                    <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <p className="text-xs text-blue-700 font-medium">{t.store.instantDownload}</p>
                    </div>
                  )}
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={!product.is_digital && product.stock === 0}
                    className={`w-full py-2 sm:py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm mt-auto ${
                      (!product.is_digital && product.stock === 0)
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : !user
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {(!product.is_digital && product.stock === 0) ? (
                      t.store.outOfStock
                    ) : !user ? (
                      <><LogIn className="w-3.5 h-3.5" /><span>{t.auth.loginHere}</span></>
                    ) : (
                      <><ShoppingCart className="w-3.5 h-3.5" /><span>{product.is_digital ? t.store.buyAndDownload : t.store.addToCart}</span></>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCart && user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6" />
                    <h2 className="text-xl font-bold">{t.store.shoppingCart}</h2>
                  </div>
                  <button onClick={() => setShowCart(false)} className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t.store.yourCartEmpty}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => {
                      const product = products.find(p => p.id === item.productId);
                      if (!product) return null;
                      return (
                        <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            {product.is_digital && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5"><File className="w-2.5 h-2.5" /></div>
                            )}
                            {product.image_url
                              ? <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                              : <Package className="w-7 h-7 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-800 truncate">{product.name}</h3>
                            <p className="text-xs text-gray-500">{product.store_name}</p>
                            <p className="text-xs font-semibold text-green-600 mt-0.5">{product.price} PS {t.store.each}</p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white rounded-lg p-1.5 flex-shrink-0">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center justify-center transition-colors">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-medium text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={item.quantity >= product.stock}
                              className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center justify-center transition-colors disabled:opacity-50">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm text-gray-800">{(product.price * item.quantity).toFixed(2)} PS</p>
                            <button onClick={() => removeFromCart(item.productId)}
                              className="text-red-400 hover:text-red-600 text-xs mt-1 flex items-center gap-0.5">
                              <Trash2 className="w-3 h-3" />{t.store.remove}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="border-t bg-gray-50 p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-700">{t.store.total}:</span>
                    <span className="text-2xl sm:text-3xl font-bold text-green-600">{calculateTotal().toFixed(2)} PS</span>
                  </div>
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={loading || checkingOut}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {checkingOut ? (
                      <><Loader className="w-5 h-5 animate-spin" />{t.store.processing}</>
                    ) : (
                      <><CreditCard className="w-5 h-5" />{t.store.proceedToCheckout}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showDuplicateWarning.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl max-w-sm sm:max-w-lg w-full shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl"><Download className="w-6 h-6" /></div>
                  <div><h2 className="text-xl font-bold">Hey There! 👋</h2><p className="text-white text-opacity-90 text-sm">You already own some items</p></div>
                </div>
              </div>
              <div className="p-5">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                  <div className="space-y-2">
                    {showDuplicateWarning.products.map((name, i) => (
                      <div key={i} className="bg-white rounded-lg p-2.5 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                        <span className="text-gray-700 font-medium text-sm truncate">{name}</span>
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-center text-sm mb-5">Continue purchasing anyway?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDuplicateWarning({ show: false, products: [] })}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all flex items-center justify-center gap-2 text-sm">
                    <X className="w-4 h-4" />{t.common.cancel}
                  </button>
                  <button onClick={() => { setShowDuplicateWarning({ show: false, products: [] }); setShowCart(false); setShowCheckoutConfirm(true); }}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-all shadow-md flex items-center justify-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4" />Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCheckoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
              <div className="p-6">
                <div className="bg-yellow-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-7 h-7 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 text-center mb-2">{t.store.confirmCheckout}</h2>
                <p className="text-gray-600 text-center text-sm mb-5">{t.store.confirmCheckoutDesc}</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{t.store.totalItems}:</span>
                    <span className="font-semibold">{cart.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="font-semibold text-gray-700">{t.store.totalAmount}:</span>
                    <span className="text-2xl font-bold text-green-600">{calculateTotal().toFixed(2)} PS</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCheckoutConfirm(false)}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors text-sm">
                    {t.common.cancel}
                  </button>
                  <button onClick={handleCheckout} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                    {loading ? (
                      <><Loader className="w-4 h-4 animate-spin" />{t.store.processing}</>
                    ) : (
                      t.store.confirmAndPay
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Store;
