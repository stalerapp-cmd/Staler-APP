
// src/pages/QR/QRPayment.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, ArrowLeft, Wallet, AlertCircle, QrCode } from 'lucide-react';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const QRPayment: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status,     setStatus]     = useState<'pending' | 'success' | 'error'>('pending');
  const [message,    setMessage]    = useState('');
  const [wallet,     setWallet]     = useState<any>(null);

  const type        = searchParams.get('type') || 'payment';
  const toWallet    = searchParams.get('to');
  const amountParam = searchParams.get('amount');
  const descParam   = searchParams.get('desc') || 'QR Transaction';
  const operationId = searchParams.get('operationId'); 

  const [amount, setAmount] = useState<number>(Number(amountParam) || 0);
  const [desc,   setDesc]   = useState(descParam);

  const [bankOpAmount, setBankOpAmount] = useState<number>(0);
  const [bankOpLoading, setBankOpLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (type === 'bank-qr' && operationId) {
      loadBankOperation();
    }
  }, [type, operationId]);

  const loadData = async () => {
    try {
      const walletRes = await apiService.getWallet();
      if (walletRes.success) setWallet(walletRes.data.wallet);
    } catch (err) {
      console.error(err);
      setMessage(t.qrPayment.failedToLoadAccount);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const loadBankOperation = async () => {
    if (!operationId) return;
    try {
      setBankOpLoading(true);
      const res = await apiService.getBankOperation(operationId);
      if (res.success && res.data?.amount) {
        const amt = Number(String(res.data.amount).split(':')[1] || '0');
        setBankOpAmount(amt);
      }
    } catch (err) {
      console.error('Failed to load bank operation:', err);
    } finally {
      setBankOpLoading(false);
    }
  };

  const handleProcess = async () => {
    if (type === 'bank-qr') {
      await handleBankQR();
    } else if (type === 'withdraw') {
      await handleAutoWithdraw();
    } else {
      await handlePayment();
    }
  };

  const handleBankQR = async () => {
    if (!operationId) {
      setStatus('error');
      setMessage('Missing operation ID');
      return;
    }
    try {
      setProcessing(true);
      setMessage('Processing bank withdrawal...');
      const res = await apiService.withdrawFromBankQR(operationId);
      if (res.success) {
        setStatus('success');
        setMessage(`✅ Successfully withdrew ${res.data.amount} PS to your wallet!`);
        await loadData();
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        throw new Error(res.message || 'Bank QR withdrawal failed');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.message || 'Bank QR withdrawal failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleAutoWithdraw = async () => {
    if (amount <= 0) {
      setStatus('error');
      setMessage(t.qrPayment.amountMustBeGreater);
      return;
    }
    try {
      setProcessing(true);
      setMessage(t.qrPayment.withdrawingFromBank);
      const res = await apiService.autoWithdrawSaved(amount);
      if (res.success) {
        setStatus('success');
        setMessage(`✅ ${t.qrPayment.successfullyWithdrew} ${amount} PS ${t.qrPayment.toWallet}`);
        await loadData();
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        throw new Error(res.message || t.qrPayment.failedWithdrawal);
      }
    } catch (err: any) {
      setStatus('error');
      const errorMsg = err.response?.data?.message || err.message || t.qrPayment.failedWithdrawal;
      if (errorMsg.includes('MISSING_BANK_CREDS') || errorMsg.includes('not linked')) {
        setMessage(`❌ ${t.qrPayment.noBankLinked}. ${t.qrPayment.linkBankFirst}`);
      } else {
        setMessage(`❌ ${errorMsg}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!toWallet || amount <= 0) {
      setStatus('error');
      setMessage(t.qrPayment.invalidPaymentDetails);
      return;
    }
    if (!wallet || wallet.balance < amount) {
      setStatus('error');
      setMessage(
        t.qrPayment.insufficientBalanceDetail
          .replace('{balance}', String(wallet?.balance || 0))
          .replace('{amount}', String(amount))
      );
      return;
    }
    try {
      setProcessing(true);
      const res = await apiService.transfer(toWallet, amount, desc);
      if (res.success) {
        setStatus('success');
        setMessage(`✅ ${t.qrPayment.paymentSuccessful}`);
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        throw new Error(t.qrPayment.errorMessage);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.message || t.qrPayment.errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Loader className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  const headerLabel =
    type === 'bank-qr' ? '🏦 Bank QR Withdrawal' :
    type === 'withdraw' ? t.qrPayment.bankWithdrawal :
    t.qrPayment.qrPayment;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.common.back}
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {}
          <div className={`${
            type === 'bank-qr'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          } p-6 text-white`}>
            <div className="flex items-center justify-center mb-2">
              {type === 'bank-qr'
                ? <QrCode className="w-10 h-10" />
                : <Wallet className="w-10 h-10" />
              }
            </div>
            <h1 className="text-2xl font-bold text-center">{headerLabel}</h1>
            <p className="text-sm text-center opacity-90 mt-1">{user?.fullName}</p>
          </div>

          <div className="p-6">
            {status === 'pending' && (
              <>
                {}
                {wallet && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">{t.qrPayment.yourBalance}</span>
                      <span className="text-xl font-bold text-blue-600">
                        {wallet.balance?.toFixed(2) || '0.00'} PS
                      </span>
                    </div>
                  </div>
                )}

                
                {type === 'bank-qr' && (
                  <>
                    <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <QrCode className="w-6 h-6 text-green-600" />
                        <p className="font-bold text-green-900">Bank QR Detected</p>
                      </div>

                      {bankOpLoading ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700">Loading operation details...</span>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Amount to withdraw:</span>
                            <span className="text-2xl font-bold text-green-600">
                              {bankOpAmount > 0 ? `${bankOpAmount} PS` : '...'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Operation ID:</span>
                            <span className="text-xs font-mono text-gray-500 truncate max-w-[150px]">
                              {operationId}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-800 font-medium">✅ Direct Bank Withdrawal</p>
                          <p className="text-xs text-blue-700 mt-1">
                            This will complete the bank's withdrawal operation and add funds directly to your wallet. The bank balance will be deducted automatically.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleProcess}
                      disabled={processing || bankOpLoading || bankOpAmount <= 0}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        processing || bankOpLoading || bankOpAmount <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-5 h-5 animate-spin" />
                          {message || 'Processing...'}
                        </span>
                      ) : (
                        `Confirm Withdrawal — ${bankOpAmount} PS`
                      )}
                    </button>
                  </>
                )}

                
                {type !== 'bank-qr' && (
                  <>
                    {}
                    {type === 'payment' && toWallet && (
                      <div className="mb-4 bg-gray-50 rounded-lg p-4">
                        <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                          {t.qrPayment.payTo}
                        </label>
                        <p className="font-mono text-sm text-gray-800 break-all">{toWallet}</p>
                      </div>
                    )}

                    {}
                    <div className="mb-6">
                      <label className="text-xs font-medium text-gray-500 uppercase block mb-2">
                        {t.qrPayment.amount}
                      </label>
                      <div className="flex items-baseline gap-2 bg-gray-50 rounded-lg p-4">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value) || 0)}
                          min="0.01"
                          step="0.01"
                          className="text-3xl font-bold text-blue-600 bg-transparent border-none outline-none w-full"
                        />
                        <span className="text-xl text-gray-600">PS</span>
                      </div>
                    </div>

                    {}
                    {type === 'payment' && (
                      <div className="mb-6 bg-gray-50 rounded-lg p-4">
                        <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                          {t.qrPayment.description}
                        </label>
                        <p className="text-sm text-gray-800">{desc}</p>
                      </div>
                    )}

                    {}
                    {type === 'withdraw' && (
                      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-green-800 font-medium">
                              ✅ {t.qrPayment.autoWithdrawal}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              {t.qrPayment.autoWithdrawalDesc}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleProcess}
                      disabled={processing || amount <= 0}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        processing || amount <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-5 h-5 animate-spin" />
                          {message || t.qrPayment.processing}
                        </span>
                      ) : type === 'withdraw' ? (
                        `${t.qrPayment.withdraw} ${amount} PS`
                      ) : (
                        `${t.qrPayment.pay} ${amount} PS`
                      )}
                    </button>
                  </>
                )}
              </>
            )}

            {}
            {status === 'success' && (
              <div className="text-center py-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.qrPayment.success}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t.qrPayment.goToDashboard} →
                </button>
              </div>
            )}

            {}
            {status === 'error' && (
              <div className="text-center py-8">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.qrPayment.error}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => { setStatus('pending'); setMessage(''); }}
                    className="w-full py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t.qrPayment.tryAgain}
                  </button>
                  {message.includes('link your bank') && (
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full py-3 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white"
                    >
                      {t.qrPayment.linkBankAccount}
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    {t.qrPayment.backToDashboard}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;