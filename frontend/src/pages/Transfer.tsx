
// src/pages/Transfer.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation'; 
import apiService from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Wallet, User, MessageSquare, AlertCircle, CheckCircle, Loader, ArrowRight } from 'lucide-react';

const Transfer: React.FC = () => {
  const { t } = useTranslation();
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const toParam = searchParams.get('to');
    if (toParam) setToWalletId(toParam);
    loadWallet();
  }, [searchParams]);

  const loadWallet = async () => {
    try {
      const res = await apiService.getWallet();
      if (res.success) {
        setWallet(res.data.wallet);
      }
    } catch (error) {
      console.error('Failed to load wallet');
    }
  };

  const handleTransfer = async () => {
    setMessage('');
    setMessageType('');

    if (!toWalletId || amount <= 0) {
      setMessage(`⚠️ ${t.transfer.invalidDetails}`);
      setMessageType('error');
      return;
    }

    if (wallet && amount > wallet.balance) {
      setMessage(`⚠️ ${t.transfer.insufficientBalance}`);
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.transfer(toWalletId, amount, description || 'Wallet transfer');
      
      if (res.success) {
        setMessage(`✅ ${t.transfer.successfullyTransferred} ${amount} PS ${t.transfer.to} ${toWalletId}`);
        setMessageType('success');
        setToWalletId('');
        setAmount(0);
        setDescription('');
        
        await loadWallet();
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage(`❌ ${t.transfer.transferFailed}`);
        setMessageType('error');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || `❌ ${t.messages.error}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Send className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {t.transfer.transferFunds}
          </h1>
          <p className="text-gray-600">{t.transfer.sendMoneyInstantly}</p>
        </div>

        {wallet && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">{t.transfer.yourBalance}</p>
                <p className="text-4xl font-bold">{wallet.balance.toFixed(2)} PS</p>
              </div>
              <Wallet className="w-12 h-12 opacity-80" />
            </div>
          </div>
        )}

        {message && (
          <div className={`rounded-lg p-4 mb-6 border-l-4 shadow-md animate-fade-in ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${messageType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Send className="w-6 h-6" />
              {t.transfer.sendMoney}
            </h2>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.transfer.receiverWalletId} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="wallet_abc123def"
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.transfer.amount} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Wallet className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="0.01"
                  step="0.01"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg font-semibold"
                />
              </div>
              
              <div className="flex gap-2 mt-3">
                {[10, 50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className="flex-1 py-2 px-3 text-sm bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-lg transition-colors font-medium"
                  >
                    {amt} PS
                  </button>
                ))}
              </div>

              {wallet && amount > 0 && (
                <div className={`mt-3 p-3 rounded-lg border ${
                  amount > wallet.balance 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <p className={`text-xs font-medium ${
                    amount > wallet.balance ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {amount > wallet.balance 
                      ? `⚠️ ${t.transfer.amountExceedsBalance}`
                      : `✓ ${t.transfer.newBalance}: ${(wallet.balance - amount).toFixed(2)} PS`
                    }
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.transfer.description} ({t.transfer.optional})
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
                <textarea
                  placeholder={t.transfer.addNote}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleTransfer}
              disabled={loading || !toWalletId || amount <= 0 || (wallet && amount > wallet.balance)}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                loading || !toWalletId || amount <= 0 || (wallet && amount > wallet.balance)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t.transfer.processingTransfer}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t.transfer.send} {amount > 0 ? `${amount.toFixed(2)} PS` : ''}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">{t.transfer.transferInfo}:</p>
              <ul className="space-y-1 text-xs">
                <li>• {t.transfer.transfersInstant}</li>
                <li>• {t.transfer.makeSureCorrect}</li>
                <li>• {t.transfer.onlyRegisteredWallets}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;