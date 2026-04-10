

// src/pages/Merchant/MerchantWallet.tsx

import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation'; 
import apiService from '../../services/api';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  DollarSign,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
  from_wallet_id?: string;
  to_wallet_id?: string;
}

const MerchantWallet: React.FC = () => {
  const { t } = useTranslation(); 
  const [balance, setBalance] = useState(0);
  const [walletId, setWalletId] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      const walletRes = await apiService.getWallet();
      if (walletRes.success) {
        setBalance(Number(walletRes.data.wallet.balance));
        setWalletId(walletRes.data.wallet.walletId);
      }

      const txRes = await apiService.getTransactions();
      if (txRes.success) {
        setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const todayEarnings = transactions
    .filter(tx => {
      const today = new Date().toDateString();
      return new Date(tx.created_at).toDateString() === today && tx.type === 'credit';
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const weekEarnings = transactions
    .filter(tx => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(tx.created_at) >= weekAgo && tx.type === 'credit';
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">{t.merchant.storeWallet}</p>
                <p className="text-xs opacity-75 font-mono">{walletId}</p>
              </div>
            </div>
            <button
              onClick={loadWalletData}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm opacity-90 mb-1">{t.merchant.totalBalance}</p>
            <p className="text-5xl font-bold tracking-tight">
              {balance.toFixed(2)} <span className="text-2xl">PS</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-xs opacity-75 mb-1">{t.merchant.todayEarnings}</p>
              <p className="text-xl font-bold">+{todayEarnings.toFixed(2)} PS</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-xs opacity-75 mb-1">{t.merchant.thisWeek}</p>
              <p className="text-xl font-bold">+{weekEarnings.toFixed(2)} PS</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">{t.wallet.income}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {transactions.filter(tx => tx.type === 'credit').length}
          </p>
          <p className="text-xs text-gray-600 mt-1">{t.merchant.totalPaymentsReceived}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">{t.merchant.average}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {transactions.filter(tx => tx.type === 'credit').length > 0
              ? (transactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + Number(tx.amount), 0) / 
                 transactions.filter(tx => tx.type === 'credit').length).toFixed(2)
              : '0.00'} PS
          </p>
          <p className="text-xs text-gray-600 mt-1">{t.merchant.perTransaction}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">{t.merchant.total}</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{transactions.length}</p>
          <p className="text-xs text-gray-600 mt-1">{t.wallet.allTransactions}</p>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-purple-600" />
              {t.dashboard.recentTransactions}
            </h2>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
              <Download className="w-4 h-4" />
              {t.merchant.export}
            </button>
          </div>

          <div className="flex gap-2">
            {(['all', 'credit', 'debit'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? t.merchant.all : f === 'credit' ? t.wallet.income : t.wallet.expenses}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t.merchant.noTransactionsYet}</p>
              <p className="text-sm text-gray-400 mt-1">{t.merchant.yourTransactionsWillAppear}</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      tx.type === 'credit'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        tx.type === 'credit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {Number(tx.amount).toFixed(2)} PS
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantWallet;