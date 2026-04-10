

// src/pages/Merchant/MerchantDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Store, Package, ShoppingBag, DollarSign, TrendingUp, BarChart3,
  Plus, Loader, AlertCircle, ArrowRight, QrCode, Send, ArrowDownLeft,
  Wallet, RefreshCw, ArrowUpRight, User, Share2, Copy, CheckCircle, ExternalLink,
} from 'lucide-react';

interface Stats {
  totalProducts: number; activeProducts: number;
  totalOrders: number; pendingOrders: number;
  totalRevenue: number; todayRevenue: number;
}
interface Transaction {
  id: number; type: string; amount: number; description: string;
  createdAt?: string; created_at?: string; status: string; currency?: string;
}

const CopyToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
    </div>
  );
};

const MerchantDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, activeProducts: 0, totalOrders: 0,
    pendingOrders: 0, totalRevenue: 0, todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [copyToast, setCopyToast] = useState('');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true); setError('');
      const profileRes = await apiService.getMerchantProfile();
      if (!profileRes.success || !profileRes.data?.merchant) {
        setShowCreateModal(true); setLoading(false); return;
      }
      setStoreName(profileRes.data.merchant.store_name);

      try {
        const walletRes = await apiService.getWallet();
        if (walletRes.success) { setBalance(Number(walletRes.data.wallet.balance)); setWalletId(walletRes.data.wallet.walletId); }
      } catch {}

      try {
        const txRes = await apiService.getTransactions();
        if (txRes.success) setTransactions(txRes.data.transactions);
      } catch {}

      try {
        const productsRes = await apiService.getMerchantProducts();
        if (productsRes.success) {
          const products = productsRes.data.products;
          setStats(prev => ({ ...prev, totalProducts: products.length, activeProducts: products.filter((p: any) => p.status === 'active').length }));
        }
      } catch {}

      try {
        const ordersRes = await apiService.getMerchantOrders();
        if (ordersRes.success) {
          const orders = ordersRes.data.orders;
          const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);
          const today = new Date().toDateString();
          const todayRevenue = orders.filter((o: any) => new Date(o.created_at).toDateString() === today).reduce((s: number, o: any) => s + Number(o.total_amount), 0);
          setStats(prev => ({ ...prev, totalOrders: orders.length, pendingOrders: orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length, totalRevenue, todayRevenue }));
        }
      } catch {}
    } catch (err: any) {
      if (err.response?.status === 404) setShowCreateModal(true);
      else setError(t.merchantDashboard.failedToLoadData);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setCreating(true);
    try {
      const res = await apiService.createMerchant(storeName, description);
      if (res.success) { setShowCreateModal(false); await loadDashboardData(); }
    } catch (err: any) {
      const msg = err.response?.data?.message || t.merchantDashboard.failedToCreate;
      setError(msg);
      if (msg.includes('already')) setTimeout(() => { setShowCreateModal(false); loadDashboardData(); }, 1500);
    } finally { setCreating(false); }
  };

  const handleShareStore = async () => {
    const url = `${window.location.origin}/store?store=${encodeURIComponent(storeName)}`;
    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({ title: storeName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopyToast(t.merchantDashboard.storeLinkCopied);
      }
    } catch {
      try { await navigator.clipboard.writeText(url); setCopyToast(t.merchantDashboard.storeLinkCopied); } catch {}
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    filter === 'all' ? true : filter === 'credit' ? tx.amount > 0 : tx.amount < 0
  );

  const todayEarnings = transactions.filter(tx => {
    const raw = tx.createdAt || tx.created_at; if (!raw) return false;
    const d = new Date(raw.includes('T') ? raw : raw + 'Z');
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString() && tx.amount > 0;
  }).reduce((s, tx) => s + Number(tx.amount), 0);

  const weekEarnings = transactions.filter(tx => {
    const raw = tx.createdAt || tx.created_at; if (!raw) return false;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const d = new Date(raw.includes('T') ? raw : raw + 'Z');
    return !isNaN(d.getTime()) && d >= weekAgo && tx.amount > 0;
  }).reduce((s, tx) => s + Number(tx.amount), 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{t.merchantDashboard.loadingDashboard}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      {copyToast && <CopyToast message={copyToast} onClose={() => setCopyToast('')} />}

      <div className="max-w-7xl mx-auto">

        {}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Store className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.merchantDashboard.title}
              </h1>
              {}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-600 flex items-center gap-1.5 text-sm">
                  <Store className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{storeName || t.merchantDashboard.yourStore}</span>
                </p>
                {storeName && (
                  <>
                    {}
                    <button
                      onClick={handleShareStore}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 px-2 py-1 rounded-full transition-all"
                      title={t.merchantDashboard.copyStoreLink}
                    >
                      <Copy className="w-3 h-3" />
                      <span className="hidden sm:inline">{t.merchantDashboard.copyStoreLink}</span>
                      <Share2 className="w-3 h-3 sm:hidden" />
                    </button>
                    {}
                    <Link
                      to={`/store?store=${encodeURIComponent(storeName)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 px-2 py-1 rounded-full transition-all"
                      title={t.merchantDashboard.viewMyStore}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">{t.merchantDashboard.viewMyStore}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">{t.merchantDashboard.welcomeBack}, {user?.fullName}! 👋</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {}
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-2xl p-5 sm:p-7 lg:p-8 text-white relative overflow-hidden mb-6 sm:mb-8">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-white/10 rounded-full translate-y-18 sm:translate-y-24 -translate-x-18 sm:-translate-x-24 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 sm:p-3 rounded-xl backdrop-blur">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm opacity-90">{t.merchant.storeWallet}</p>
                  <p className="text-xs opacity-75 font-mono truncate max-w-[120px] sm:max-w-xs">{walletId || t.merchantDashboard.loading}</p>
                </div>
              </div>
              <button onClick={loadDashboardData} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur transition-colors">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm opacity-90 mb-1">{t.merchant.totalBalance}</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {balance.toFixed(2)} <span className="text-lg sm:text-2xl">PS</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
                <p className="text-xs opacity-75 mb-1">{t.merchant.todayEarnings}</p>
                <p className="text-base sm:text-xl font-bold">+{todayEarnings.toFixed(2)} PS</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
                <p className="text-xs opacity-75 mb-1">{t.merchant.thisWeek}</p>
                <p className="text-base sm:text-xl font-bold">+{weekEarnings.toFixed(2)} PS</p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5 sm:mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            {t.merchantDashboard.storeManagement}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { title: t.merchantDashboard.addProduct,   icon: Plus,      link: '/merchant/products', desc: t.merchantDashboard.createNewProduct, color: 'from-blue-500 to-cyan-600' },
              { title: t.merchantDashboard.viewProducts, icon: Package,   link: '/merchant/products', desc: t.merchantDashboard.manageInventory,   color: 'from-purple-500 to-pink-600' },
              { title: t.merchantDashboard.viewOrders,   icon: ShoppingBag, link: '/merchant/orders', desc: t.merchantDashboard.trackOrders,       color: 'from-orange-500 to-red-600' },
              { title: t.merchantDashboard.generateQR,   icon: QrCode,    link: '/qr-generator',     desc: t.merchantDashboard.paymentCodes,       color: 'from-green-500 to-emerald-600' },
            ].map(({ title, icon: Icon, link, desc, color }, i) => (
              <Link key={i} to={link}
                className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-purple-300 transition-all">
                <div className={`inline-flex p-2.5 sm:p-3 rounded-xl bg-gradient-to-r ${color} mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors leading-tight">{title}</h3>
                <p className="text-xs text-gray-600 mb-2 sm:mb-3 hidden sm:block">{desc}</p>
                <div className="flex items-center gap-1 text-purple-600 font-medium text-xs sm:text-sm group-hover:gap-2 transition-all">
                  {t.merchantDashboard.go} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            { title: t.merchantDashboard.totalProducts, value: stats.totalProducts, sub: `${stats.activeProducts} ${t.merchantDashboard.active}`,   icon: Package,     color: 'text-blue-600',   bg: 'bg-blue-100' },
            { title: t.merchantDashboard.totalOrders,   value: stats.totalOrders,   sub: `${stats.pendingOrders} ${t.merchantDashboard.pending}`,   icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-100' },
            { title: t.merchantDashboard.totalRevenue,  value: `${stats.totalRevenue.toFixed(2)} PS`, sub: `${stats.todayRevenue.toFixed(2)} PS ${t.merchantDashboard.today}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
          ].map(({ title, value, sub, icon: Icon, color, bg }, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 sm:p-3 ${bg} rounded-xl`}><Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} /></div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{value}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          ))}
        </div>

        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { to: '/transfer', icon: Send,         title: t.merchantDashboard.transfer, sub: t.merchantDashboard.sendMoney, grad: 'from-purple-500 to-purple-600', hover: 'hover:border-purple-200' },
            { to: '/withdraw', icon: ArrowDownLeft, title: t.merchantDashboard.withdraw, sub: t.merchantDashboard.fromBank, grad: 'from-blue-500 to-blue-600', hover: 'hover:border-blue-200' },
            { to: '/deposit', icon: ArrowUpRight, title: t.nav.deposit, sub: t.deposit.transferToBank, grad: 'from-emerald-500 to-emerald-600', hover: 'hover:border-emerald-200' },
            { to: '/profile',  icon: User,          title: t.merchantDashboard.profile,  sub: t.merchantDashboard.settings,  grad: 'from-indigo-500 to-indigo-600', hover: 'hover:border-indigo-200' },
          ].map(({ to, icon: Icon, title, sub, grad, hover }, i) => (
            <Link key={i} to={to}
              className={`group bg-white rounded-xl shadow-md p-3 sm:p-5 hover:shadow-xl transition-all border border-gray-100 ${hover}`}>
              <div className={`bg-gradient-to-br ${grad} p-2.5 sm:p-3 rounded-xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform w-fit`}>
                <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 text-xs sm:text-base mb-0.5">{title}</h3>
              <p className="text-xs text-gray-500 hidden sm:block">{sub}</p>
            </Link>
          ))}
        </div>

        {}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                {t.dashboard.recentTransactions}
              </h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'credit', 'debit'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {f === 'all' ? t.merchant.all : f === 'credit' ? t.wallet.income : t.wallet.expenses}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-80 sm:max-h-96 overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-sm sm:text-base">{t.merchant.noTransactionsYet}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{t.merchant.yourTransactionsWillAppear}</p>
              </div>
            ) : (
              filteredTransactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.amount > 0
                        ? <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(() => {
                          const raw = tx.createdAt || tx.created_at;
                          if (!raw) return '—';
                          const d = new Date(raw.includes('T') ? raw : raw + 'Z');
                          return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
                        })()}
                      </p>
                    </div>
                    <p className={`text-sm sm:text-lg font-bold flex-shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)} {tx.currency || 'PS'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t.merchantDashboard.createYourStore}</h2>
              <p className="text-gray-600 text-sm">{t.merchantDashboard.setupMerchant}</p>
            </div>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
            <form onSubmit={handleCreateMerchant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.merchantDashboard.storeName} *</label>
                <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required disabled={creating}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors disabled:bg-gray-100"
                  placeholder={t.merchantDashboard.myAwesomeStore} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.merchantDashboard.description}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={creating} rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors disabled:bg-gray-100"
                  placeholder={t.merchantDashboard.describeYourStore} />
              </div>
              <button type="submit" disabled={creating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <><Loader className="w-5 h-5 animate-spin" />{t.merchantDashboard.creating}</> : t.merchantDashboard.createStore}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;