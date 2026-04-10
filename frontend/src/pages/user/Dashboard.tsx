
// src/pages/user/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { Wallet, Transaction } from '../../types';
import { 
  QrCode, 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Store,
  Package,
  Send,
  User,
  Clock,
  DollarSign
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation(); 
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = React.useCallback(async () => {
  try {
    setLoading(true);
    setError('');
    const [walletRes, txRes] = await Promise.all([
      apiService.getWallet(),
      apiService.getTransactions(),
    ]);

    if (walletRes.success) setWallet(walletRes.data.wallet);
    if (txRes.success) setTransactions(txRes.data.transactions);
  } catch (err: any) {
    setError(err?.response?.data?.message || t.messages.error);
  } finally {
    setLoading(false);
  }
}, [t.messages.error]);

useEffect(() => {
  loadData();
}, [loadData]);


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const copyWalletId = () => {
    if (wallet?.walletId) {
      navigator.clipboard.writeText(wallet.walletId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = React.useMemo(() => {
    const income = transactions
      .filter(t => t.amount > 0 && t.type !== 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.amount < 0 || t.type === 'transfer')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const recentCount = transactions.filter(t => {
      const txDate = new Date(t.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return txDate >= weekAgo;
    }).length;

    return { income, expenses, recentCount };
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">{t.common.loadingWallet}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.dashboard.welcomeBack}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {user?.fullName} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t.common.refresh}</span>
              </button>
              
              <Link
                to="/qr-scanner"
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">{t.dashboard.scanQR}</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 shadow-sm">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 sm:mb-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <WalletIcon className="w-5 h-5 opacity-80" />
              <p className="text-sm font-medium opacity-90">{t.dashboard.yourBalance}</p>
            </div>
            
           <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
  {wallet ? wallet.balance.toFixed(2) : '0.00'}{' '}
  <span className="text-2xl sm:text-3xl font-medium opacity-90">
    {wallet?.currency ?? ''}
  </span>
</h2>


            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-xs font-medium opacity-75 mb-1.5">{t.wallet.walletId}</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-medium">{wallet?.walletId}</code>
                  <button
                    onClick={copyWalletId}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-white/20"
                  >
                    {copied ? t.common.copied : t.common.copy}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs opacity-75">{t.dashboard.thisWeek}</p>
                  <p className="text-lg font-bold">{stats.recentCount} {t.wallet.transactions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t.dashboard.totalIncome}</p>
                <p className="text-2xl font-bold text-green-600">
                  +{stats.income.toFixed(2)} {wallet?.currency}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t.dashboard.totalExpenses}</p>
                <p className="text-2xl font-bold text-red-600">
                  -{stats.expenses.toFixed(2)} {wallet?.currency}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t.wallet.transactions}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {transactions.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link 
            to="/withdraw" 
            className="group bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-blue-200"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{t.nav.withdraw}</h3>
            <p className="text-xs text-gray-500">{t.withdraw.transferFromBank}</p>
          </Link>
<Link 
  to="/deposit"
  className="group bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-emerald-200"
>
  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
    <ArrowUpRight className="w-6 h-6 text-white" />
  </div>
  <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{t.nav.deposit}</h3>
  <p className="text-xs text-gray-500">{t.deposit.transferToBank}</p>
</Link>
          <Link 
            to="/transfer" 
            className="group bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-purple-200"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{t.nav.transfer}</h3>
            <p className="text-xs text-gray-500">{t.transfer.sendMoneyInstantly}</p>
          </Link>

          <Link 
            to="/store" 
            className="group bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-green-200"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{t.nav.shop}</h3>
            <p className="text-xs text-gray-500">{t.store.browseProducts}</p>
          </Link>

          <Link 
            to="/orders" 
            className="group bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-orange-200"
          >
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{t.nav.orders}</h3>
            <p className="text-xs text-gray-500">{t.orders.viewHistory}</p>
          </Link>

          <Link 
            to="/profile" 
            className="group bg-white rounded-xl shadow-md p-4 sm:p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-indigo-200"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{t.nav.profile}</h3>
            <p className="text-xs text-gray-500">{t.nav.settings}</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t.dashboard.recentTransactions}</h2>
                <p className="text-sm text-gray-500 mt-1">{t.dashboard.latestActivity}</p>
              </div>
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">{t.dashboard.noTransactions}</p>
              <p className="text-sm text-gray-400">{t.dashboard.noTransactionsDesc}</p>
              <Link 
                to="/withdraw"
                className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                {t.dashboard.withdrawNow}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.wallet.type}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.wallet.amount}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.wallet.status}
                    </th>
                    <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.wallet.description}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {t.wallet.date}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {tx.amount > 0 ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            tx.type === 'deposit' || tx.type === 'sale'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}
                          {tx.amount} {tx.currency}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status === 'completed' ? t.wallet.completed : t.wallet.pending}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600">
                        {tx.description}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;