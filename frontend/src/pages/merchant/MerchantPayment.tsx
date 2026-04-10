

// src/pages/Merchant/MerchantPayment.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation'; 
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import { 
  CreditCard, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Store,
  DollarSign,
  FileText,
  Wallet,
  Loader
} from 'lucide-react';

const MerchantPayment: React.FC = () => {
  const { t } = useTranslation(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [merchantWalletId, setMerchantWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [myBalance, setMyBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      const to = searchParams.get('to') || '';
      const amountParam = searchParams.get('amount') || '';
      const desc = searchParams.get('desc') || t.merchantPayment.payment;

      setMerchantWalletId(to);
      
      const cleanAmount = amountParam.replace('PS:', '').trim();
      setAmount(cleanAmount);
      setDescription(desc);

      const walletRes = await apiService.getWallet();
      if (walletRes.success) {
        setMyBalance(Number(walletRes.data.wallet.balance));
      }
    } catch (err: any) {
      console.error('Load payment info error:', err);
      setError(t.merchantPayment.failedToLoadPayment);
    }
  };

  const handlePay = async () => {
    if (!merchantWalletId || !amount) {
      setError(t.merchantPayment.invalidPaymentInfo);
      return;
    }

    const amountNum = Number(amount);
    if (amountNum <= 0) {
      setError(t.merchantPayment.invalidAmount);
      return;
    }

    if (amountNum > myBalance) {
      setError(`${t.merchantPayment.insufficientBalance}. ${t.merchantPayment.youHave} ${myBalance.toFixed(2)} PS`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await apiService.transfer(merchantWalletId, amountNum, description);

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(res.message || t.merchantPayment.paymentFailed);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || t.merchantPayment.paymentFailed);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t.merchantPayment.paymentSuccessful}</h2>
          <p className="text-gray-600 mb-6">{t.merchantPayment.paymentProcessed}</p>
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">{t.merchantPayment.amountPaid}</p>
            <p className="text-3xl font-bold text-green-600">{amount} PS</p>
          </div>
          <p className="text-sm text-gray-500">{t.merchantPayment.redirectingToDashboard}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        {}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">{t.merchantPayment.completePayment}</h1>
            <p className="text-sm opacity-90 mt-1">{t.merchantPayment.reviewAndConfirm}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {}
            <div className="space-y-4 mb-6">
              {}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">{t.wallet.amount}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-700">{amount} PS</p>
              </div>

              {}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">{t.wallet.description}</span>
                </div>
                <p className="text-base text-gray-800 font-medium">{description}</p>
              </div>

              {}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">{t.merchantPayment.yourBalance}</span>
                </div>
                <p className="text-xl font-bold text-blue-700">{myBalance.toFixed(2)} PS</p>
                {Number(amount) > myBalance && (
                  <p className="text-xs text-red-600 mt-1">⚠️ {t.merchantPayment.insufficientBalance}</p>
                )}
              </div>

              {}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="text-xs font-medium text-gray-600">{t.merchantPayment.merchantWalletId}</span>
                <p className="text-xs font-mono text-gray-700 mt-1 break-all">{merchantWalletId}</p>
              </div>
            </div>

            {}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6 border-2 border-purple-200">
              <h3 className="text-sm font-bold text-purple-900 mb-3">{t.merchantPayment.paymentSummary}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">{t.wallet.amount}</span>
                  <span className="text-sm font-bold text-purple-700">{amount} PS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">{t.merchantPayment.fee}</span>
                  <span className="text-sm font-bold text-green-600">0.00 PS</span>
                </div>
                <div className="border-t border-purple-200 pt-2 flex justify-between">
                  <span className="text-base font-bold text-gray-800">{t.merchantPayment.total}</span>
                  <span className="text-base font-bold text-purple-700">{amount} PS</span>
                </div>
              </div>
            </div>

            {}
            <div className="space-y-3">
              <button
                onClick={handlePay}
                disabled={loading || !amount || Number(amount) > myBalance}
                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                  loading || !amount || Number(amount) > myBalance
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t.merchantPayment.processing}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {t.merchantPayment.pay} {amount} PS
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-purple-200 rounded-lg p-4 shadow">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">{t.merchantPayment.securePayment}</h4>
              <p className="text-xs text-gray-600">
                {t.merchantPayment.securePaymentDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPayment;