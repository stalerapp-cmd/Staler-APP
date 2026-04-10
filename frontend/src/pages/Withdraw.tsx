
// src/pages/Withdraw.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/api';
import {
  Wallet, AlertCircle, CheckCircle, Info,
  QrCode, Loader, ArrowRight, Building2,
} from 'lucide-react';

const MAX_WITHDRAWAL = Number(process.env.REACT_APP_MAX_WITHDRAWAL || '10000');

const Withdraw: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bankUsername,    setBankUsername]    = useState('');
  const [bankPassword,    setBankPassword]    = useState('');
  const [amount,          setAmount]          = useState('');
  const [bankBalance,     setBankBalance]     = useState<number | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');

  const talerUri = searchParams.get('talerUri');

  useEffect(() => {
    if (talerUri) {
      try {
        const url = new URL(talerUri.replace('taler://', 'https://'));
        const amountParam = url.searchParams.get('amount');
        if (amountParam) {
          const amt = amountParam.split(':')[1] || amountParam;
          setAmount(amt);
        }
        setSuccess(t.withdraw?.qrDetected ?? '🏦 Bank withdrawal QR detected! Enter credentials to proceed.');
      } catch {
        console.warn('Invalid Taler URI');
      }
    }
  }, [talerUri]);

  const parseAmount = () => {
    const n = parseFloat(amount);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  };

  const validForm = () => {
    const n = parseAmount();
    if (!bankUsername || !bankPassword) return false;
    if (n <= 0 || n > MAX_WITHDRAWAL) return false;
    return true;
  };

  const handleCheckBalance = async () => {
    if (!bankUsername || !bankPassword) {
      setError(t.withdraw?.enterCredentialsFirst ?? '❌ Please enter your bank credentials.');
      return;
    }
    setCheckingBalance(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiService.checkBankBalance(bankUsername, bankPassword);
      if (res.success) {
        setBankBalance(res.data.balance);
        setSuccess(`✅ ${t.withdraw?.yourBankBalance ?? 'Your bank balance'}: ${res.data.balance} PS`);
      } else {
        setError(res.message || (t.withdraw?.failedBalance ?? 'Failed to fetch balance'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (t.withdraw?.failedBalance ?? 'Failed to check balance'));
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = parseAmount();
    if (numAmount <= 0) {
      setError(t.withdraw?.amountMustBeGreater ?? 'Amount must be greater than 0');
      return;
    }
    if (numAmount > MAX_WITHDRAWAL) {
      setError(`${t.withdraw?.maxWithdrawal ?? 'Max withdrawal is'} ${MAX_WITHDRAWAL} PS`);
      return;
    }
    if (bankBalance !== null && numAmount > bankBalance) {
      setError(t.withdraw?.insufficientBank ?? '❌ Insufficient bank balance.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.withdrawToWallet(bankUsername, bankPassword, numAmount);
      if (res?.success) {
        setSuccess(`✅ ${t.withdraw?.successWithdraw ?? 'Successfully withdrew'} ${numAmount} PS ${t.withdraw?.toWallet ?? 'to your wallet'}!`);
        setBankUsername('');
        setBankPassword('');
        setAmount('');
        setBankBalance(null);
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        setError(res?.message || (t.withdraw?.failed ?? 'Withdrawal failed'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (t.withdraw?.failedCredentials ?? 'Withdrawal failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {t.withdraw?.title ?? 'Withdraw from Bank'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t.withdraw?.subtitle ?? 'Transfer money from your bank to your wallet'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 text-sm">{t.common?.error ?? 'Error'}</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 text-sm">{t.common?.success ?? 'Success'}</p>
                <p className="text-sm text-green-600 mt-0.5">{success}</p>
              </div>
            </div>
          </div>
        )}

        {!talerUri && (
          <button
            onClick={() => navigate('/qr-scanner')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all mb-5 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <QrCode className="w-5 h-5" />
            {t.withdraw?.scanBankQR ?? 'Scan Bank QR Code'}
          </button>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">
                ℹ️ {t.withdraw?.howItWorks ?? 'How it works'}:
              </h3>
              <ol className="text-xs sm:text-sm text-blue-800 space-y-1.5">
                <li>1. {t.withdraw?.step1 ?? 'Enter your bank credentials'}</li>
                <li>2. {t.withdraw?.step2 ?? 'Check your balance'}</li>
                <li>3. {t.withdraw?.step3 ?? 'Withdraw funds instantly to your wallet'}</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              {t.withdraw?.bankWithdrawal ?? 'Bank Withdrawal'}
            </h2>
          </div>

          <form onSubmit={handleWithdraw} className="p-5 sm:p-8 space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.withdraw?.bankUsername ?? 'Bank Username'} *
              </label>
              <input
                type="text"
                value={bankUsername}
                onChange={e => setBankUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                placeholder={t.withdraw?.usernamePlaceholder ?? 'bank_username'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.withdraw?.bankPassword ?? 'Bank Password'} *
              </label>
              <input
                type="password"
                value={bankPassword}
                onChange={e => setBankPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                placeholder="•••••••"
                required
              />
            </div>

            <button
              type="button"
              onClick={handleCheckBalance}
              disabled={checkingBalance || !bankUsername || !bankPassword}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
            >
              {checkingBalance ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {t.withdraw?.checking ?? 'Checking...'}
                </>
              ) : (
                t.withdraw?.checkBalance ?? 'Check Bank Balance'
              )}
            </button>

            {bankBalance !== null && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    {t.withdraw?.availableBalance ?? 'Available Balance'}
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {bankBalance.toFixed(2)} PS
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.withdraw?.amount ?? 'Amount'} (PS) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                placeholder="100.00"
                min="0.01"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.withdraw?.maxWithdrawal ?? 'Maximum withdrawal'}: {MAX_WITHDRAWAL} PS
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[10, 25, 50, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="flex-1 min-w-[50px] py-2 rounded-lg text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-200"
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!validForm() || loading}
              className={`w-full py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                loading || !validForm()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t.withdraw?.processing ?? 'Processing...'}
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  {t.withdraw?.withdrawButton ?? 'Withdraw to Wallet'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Withdraw;