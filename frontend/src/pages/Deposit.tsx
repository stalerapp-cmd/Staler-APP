
// src/pages/Deposit.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';
import {
  Wallet, AlertCircle, CheckCircle, Info,
  Loader, ArrowRight, Building2, ArrowUpRight, Settings,
} from 'lucide-react';

const MAX_DEPOSIT = Number(process.env.REACT_APP_MAX_DEPOSIT || '10000');

const Deposit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [amount,             setAmount]             = useState('');
  const [walletBalance,      setWalletBalance]      = useState<number | null>(null);
  const [bankAccountLinked,  setBankAccountLinked]  = useState(false);
  const [bankUsername,       setBankUsername]       = useState('');
  const [loading,            setLoading]            = useState(false);
  const [checkingWallet,     setCheckingWallet]     = useState(false);
  const [initialLoading,     setInitialLoading]     = useState(true);
  const [error,              setError]              = useState('');
  const [success,            setSuccess]            = useState('');

  useEffect(() => {
    Promise.all([loadWalletBalance(), checkBankAccount()])
      .finally(() => setInitialLoading(false));
  }, []);

  const parseAmount = () => {
    const n = parseFloat(amount);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  };

  const validForm = () => {
    const n = parseAmount();
    if (!bankAccountLinked) return false;
    if (n <= 0 || n > MAX_DEPOSIT) return false;
    if (walletBalance !== null && n > walletBalance) return false;
    return true;
  };

  const loadWalletBalance = async () => {
    setCheckingWallet(true);
    try {
      const res = await apiService.getWallet();
      if (res.success) setWalletBalance(res.data.wallet.balance);
    } catch (err: any) {
      console.error('Failed to load wallet balance:', err);
    } finally {
      setCheckingWallet(false);
    }
  };

  const checkBankAccount = async () => {
    try {
      const res = await apiService.get('/bank/linked');
      if (res?.success && res?.data) {
        setBankAccountLinked(true);
        setBankUsername(res.data.bankUsername || '');
      } else {
        setBankAccountLinked(false);
        setBankUsername('');
      }
    } catch {
      setBankAccountLinked(false);
      setBankUsername('');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!bankAccountLinked) { setError(t.deposit.pleaseLink); return; }

    const numAmount = parseAmount();
    if (numAmount <= 0) { setError(t.deposit.invalidAmount); return; }
    if (numAmount > MAX_DEPOSIT) { setError(`${t.deposit.maxDeposit} ${MAX_DEPOSIT} PS`); return; }
    if (walletBalance !== null && numAmount > walletBalance) {
      setError(`❌ ${t.deposit.insufficientWalletBalance}`); return;
    }

    setLoading(true);
    try {
      const res = await apiService.depositToBank(numAmount);
      if (res?.success) {
        setSuccess(`✅ ${t.deposit.successfullyDeposited} ${numAmount} PS ${t.deposit.toYourBank} (@${bankUsername})!`);
        setAmount('');
        await loadWalletBalance();
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        setError(res?.message || t.deposit.depositFailed);
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'NO_BANK_ACCOUNT') {
        setBankAccountLinked(false);
        setError(`${t.deposit.noBankLinked} ${t.deposit.needToLink}`);
      } else {
        setError(err.response?.data?.message || t.deposit.depositFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <Loader className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-600 text-sm">{t.common.loading}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ArrowUpRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {t.deposit.depositToBank}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">{t.deposit.transferToBank}</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-800 text-sm">{t.deposit.error}</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
                {!bankAccountLinked && (
                  <Link to="/settings" className="text-sm text-red-700 underline hover:text-red-800 mt-1 inline-block">
                    Go to Settings →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 text-sm">{t.deposit.success}</p>
                <p className="text-sm text-green-600 mt-0.5">{success}</p>
              </div>
            </div>
          </div>
        )}

        {bankAccountLinked ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 sm:p-6 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-green-900 mb-1 text-sm sm:text-base">{t.deposit.bankAccountLinked}</h3>
                <p className="text-sm text-green-800">
                  <strong>{t.deposit.account}:</strong> @{bankUsername}
                </p>
                <p className="text-xs text-green-700 mt-1">{t.deposit.depositsAutomatic}</p>
              </div>
              <Link to="/settings"
                className="text-green-700 hover:text-green-800 p-2 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-6 mb-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-1 text-sm sm:text-base">{t.deposit.noBankLinked}</h3>
                <p className="text-sm text-yellow-800 mb-3">{t.deposit.needToLink}</p>
                <Link to="/settings"
                  className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  <Settings className="w-4 h-4" />
                  {t.deposit.linkBankAccount}
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6 mb-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">{t.deposit.howItWorks}:</h3>
              <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>1. {t.deposit.step1}</li>
                <li>2. {t.deposit.step2}</li>
                <li>3. {t.deposit.step3}</li>
              </ol>
            </div>
          </div>
        </div>

        {walletBalance !== null && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-5 sm:p-6 mb-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm opacity-90 mb-1">{t.deposit.availableWalletBalance}</p>
                <p className="text-2xl sm:text-3xl font-bold">{walletBalance.toFixed(2)} PS</p>
              </div>
              <button onClick={loadWalletBalance} disabled={checkingWallet}
                className="bg-white/20 hover:bg-white/30 p-2.5 sm:p-3 rounded-xl backdrop-blur transition-colors disabled:opacity-50">
                {checkingWallet
                  ? <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  : <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" /> {t.deposit.title}
            </h2>
          </div>

          <form onSubmit={handleDeposit} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.deposit.amount} (PS) *
              </label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="100.00" step="0.01" min="0.01" required disabled={!bankAccountLinked} />
              <p className="text-xs text-gray-500 mt-1">
                {t.deposit.maxDeposit}: {MAX_DEPOSIT} PS
                {walletBalance !== null && (
                  <span className="ml-2">• {t.deposit.available}: {walletBalance.toFixed(2)} PS</span>
                )}
              </p>
            </div>

            {walletBalance !== null && bankAccountLinked && (
              <div className="flex gap-2 flex-wrap">
                {[10, 25, 50, 100, 200, 500].map(amt => (
                  <button key={amt} type="button"
                    onClick={() => setAmount(Math.min(amt, walletBalance).toString())}
                    disabled={amt > walletBalance}
                    className="flex-1 min-w-[50px] py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-blue-200">
                    {amt}
                  </button>
                ))}
              </div>
            )}

            <button type="submit" disabled={!validForm() || loading}
              className={`w-full py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                loading || !validForm()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              }`}>
              {loading ? (
                <><Loader className="w-5 h-5 animate-spin" />{t.deposit.processingDeposit}</>
              ) : (
                <><ArrowUpRight className="w-5 h-5" />{t.deposit.deposit}<ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-yellow-900 mb-1">{t.deposit.important}</h4>
              <p className="text-xs text-yellow-800">{t.deposit.importantDesc}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Deposit;