
// src/pages/Exchange/ExchangeDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  QrCode, RefreshCw, ArrowDownLeft, ArrowUpRight,
  TrendingUp, TrendingDown, User, DollarSign, Clock,
  Copy, Check, AlertCircle, Loader, Camera, ScanLine, Wallet,
} from 'lucide-react';

interface WalletData {
  walletId?: string;
  wallet_id?: string;
  balance: number;
  currency?: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at?: string;
  createdAt?: string;
}

const ExchangeDashboard: React.FC = () => {
  const { t }    = useTranslation();
  const { user } = useAuth();

  const [wallet,       setWallet]       = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [copied,       setCopied]       = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true); setError('');
      const [walletRes, txRes] = await Promise.all([
        apiService.getWallet(),
        apiService.getTransactions(),
      ]);
      if (walletRes.success) {
        const wd = walletRes.data.wallet;
        setWallet({ ...wd, wallet_id: wd.walletId || wd.wallet_id });
      }
      if (txRes.success) setTransactions(txRes.data.transactions);
    } catch (err: any) {
      setError(t.exchangeDashboard.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const copyWalletId = () => {
    const wid = wallet?.wallet_id || wallet?.walletId;
    if (wid) {
      navigator.clipboard.writeText(wid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayWalletId = wallet?.wallet_id || wallet?.walletId || t.exchangeDashboard.loading;

  const stats = useMemo(() => {
    const income   = transactions.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    const expenses = transactions.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
    return { income, expenses };
  }, [transactions]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center">
        <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium text-sm sm:text-base">{t.exchangeDashboard.loadingDashboard}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">

        {}
        <div className="mb-5 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.exchangeDashboard.title}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              {t.exchangeDashboard.welcomeBack}, {user?.fullName}! 🚀
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 text-xs sm:text-sm font-medium">
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.exchangeDashboard.refresh}</span>
            </button>
            <Link to="/qr-generator"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg text-xs sm:text-sm font-medium">
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.exchangeDashboard.myQR ?? 'My QR'}</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-xl mb-5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 mb-5 sm:mb-6 lg:mb-8 text-white">
          <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-24 translate-x-16 sm:translate-x-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 sm:w-36 h-24 sm:h-36 bg-white/10 rounded-full translate-y-12 sm:translate-y-18 -translate-x-12 sm:-translate-x-18 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 lg:gap-6">
            {}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">{t.exchangeDashboard.exchangeWallet}</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                {wallet?.balance.toFixed(2)}{' '}
                <span className="text-base sm:text-xl lg:text-2xl">{wallet?.currency || 'PS'}</span>
              </p>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-2 sm:mb-3">
                <p className="text-xs opacity-75 mb-1">{t.exchangeDashboard.walletId}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-mono font-semibold truncate flex-1">{displayWalletId}</span>
                  <button onClick={copyWalletId}
                    className="hover:bg-white/20 p-1.5 rounded-lg transition-colors flex-shrink-0"
                    title={t.exchangeDashboard.copyWalletId}>
                    {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs opacity-70">💡 {t.exchangeDashboard.shareWalletId}</p>
            </div>

            {}
            <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">

              {}
              <Link to="/qr-scanner"
                className="flex items-center gap-2 sm:gap-2.5 bg-white text-indigo-700 hover:bg-indigo-50 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all border-2 border-white flex-1 lg:flex-none justify-center lg:justify-start">
                <div className="bg-indigo-100 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                  <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <span className="text-xs sm:text-sm lg:text-base whitespace-nowrap">
                  {t.exchangeDashboard.scanCustomerQR ?? 'Scan Customer QR'}
                </span>
              </Link>

              {}
              <Link to="/withdraw"
                className="flex items-center gap-2 sm:gap-2.5 bg-white/20 hover:bg-white/30 text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold transition-all border-2 border-white/40 flex-1 lg:flex-none justify-center lg:justify-start">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base whitespace-nowrap">{t.exchangeDashboard.withdraw}</span>
              </Link>

              <Link to="/qr-generator"
                className="flex items-center gap-2 sm:gap-2.5 bg-white/20 hover:bg-white/30 text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold transition-all border-2 border-white/40 flex-1 lg:flex-none justify-center lg:justify-start">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base whitespace-nowrap">{t.exchangeDashboard.generateQR}</span>
              </Link>

              <Link to="/profile"
                className="flex items-center gap-2 sm:gap-2.5 bg-white/20 hover:bg-white/30 text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold transition-all border-2 border-white/40 flex-1 lg:flex-none justify-center lg:justify-start">
                <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base whitespace-nowrap">{t.exchangeDashboard.profile}</span>
              </Link>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-100 p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 sm:p-4 rounded-2xl flex-shrink-0">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
              {t.exchangeDashboard.scanCustomerQR ?? 'Ready to serve a customer?'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {t.exchangeDashboard.scanCustomerDesc ?? 'Scan their personal QR code to send them funds directly.'}
            </p>
          </div>
          <Link to="/qr-scanner"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap text-xs sm:text-sm lg:text-base">
            <ScanLine className="w-4 h-4 sm:w-5 sm:h-5" />
            {t.exchangeDashboard.scan ?? 'Scan QR'}
          </Link>
        </div>
{}
<div className="bg-white rounded-2xl shadow-md border-2 border-emerald-100 p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 sm:p-4 rounded-2xl flex-shrink-0">
    <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
  </div>
  <div className="flex-1 text-center sm:text-left">
    <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
      {t.nav.deposit}
    </p>
    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
      {t.deposit.transferToBank}
    </p>
  </div>
  <Link to="/deposit"
    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap text-xs sm:text-sm lg:text-base">
    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
    {t.nav.deposit}
  </Link>
</div>
        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6 lg:mb-8">
          {[
            { label: t.exchangeDashboard.totalPayouts,  value: `-${stats.expenses.toFixed(2)} ${wallet?.currency || 'PS'}`, color: 'text-red-600',   bg: 'bg-red-100',   icon: TrendingDown },
            { label: t.exchangeDashboard.totalDeposits, value: `+${stats.income.toFixed(2)} ${wallet?.currency || 'PS'}`,   color: 'text-green-600', bg: 'bg-green-100', icon: TrendingUp },
            { label: t.exchangeDashboard.transactions,  value: String(transactions.length),                                  color: 'text-blue-600',  bg: 'bg-blue-100',  icon: DollarSign },
          ].map(({ label, value, color, bg, icon: Icon }, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1 truncate">{label}</p>
                  <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${color} truncate`}>{value}</p>
                </div>
                <div className={`${bg} p-2.5 sm:p-3 rounded-xl flex-shrink-0 ml-2`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-800">{t.exchangeDashboard.recentTransactions}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t.exchangeDashboard.yourLatestActivity}</p>
            </div>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <ScanLine className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1 text-sm sm:text-base">{t.exchangeDashboard.noTransactionsYet}</p>
              <p className="text-xs sm:text-sm text-gray-400 mb-4">{t.exchangeDashboard.startGenerating}</p>
              <Link to="/qr-scanner"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm">
                <ScanLine className="w-4 h-4" />
                {t.exchangeDashboard.scanCustomerQR ?? 'Scan Customer QR'}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[t.exchangeDashboard.type, t.exchangeDashboard.amount, t.exchangeDashboard.status, t.exchangeDashboard.date].map((h, i) => (
                      <th key={i}
                        className={`px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${i === 2 ? 'hidden sm:table-cell' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.slice(0, 10).map(tx => {
                    const rawDate = tx.createdAt || tx.created_at;
                    let fmtDate = '—';
                    if (rawDate) {
                      const d = new Date(rawDate.includes('T') ? rawDate : rawDate + 'Z');
                      fmtDate = isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
                    }
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {tx.amount > 0
                              ? <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                              : <ArrowUpRight  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />}
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {tx.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`font-bold text-xs sm:text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {fmtDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExchangeDashboard;