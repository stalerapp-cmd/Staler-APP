
// src/pages/ForgotPassword/ForgotPassword.tsx

import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import {
  Mail, Lock, ArrowLeft, CheckCircle2,
  AlertCircle, Loader, Eye, EyeOff,
} from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [step, setStep]         = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const validateEmail   = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isPasswordStrong = (p: string) =>
    p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[!@#$%^&*(),.?":{}|<>]/.test(p);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !validateEmail(email)) { setError(t.auth.enterEmail); return; }
    setLoading(true);
    try {
const data = await apiService.forgotPassword(email);
      if (data.success) setStep('code');
      else setError(data.message || t.messages.error);
    } catch (err: any) {
      setError(err.response?.data?.message || t.messages.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code || code.length !== 6)       { setError(t.auth.enterVerificationCode); return; }
    if (!newPassword)                      { setError(t.auth.enterPassword); return; }
    if (!isPasswordStrong(newPassword))    { setError(t.settings.passwordDoesNotMeet); return; }
    if (newPassword !== confirmPassword)   { setError(t.auth.passwordsDoNotMatch); return; }
    setLoading(true);
    try {
const data = await apiService.resetPassword(email, code, newPassword);
      if (data.success) setStep('success');
      else setError(data.message || t.messages.error);
    } catch (err: any) {
      setError(err.response?.data?.message || t.messages.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
const data = await apiService.forgotPassword(email);
      alert(data.message || t.auth.resendCode);
    } catch (err: any) {
      alert(err.response?.data?.message || t.messages.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />{t.auth.backToLogin}
        </Link>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {step === 'email'   && t.auth.resetPassword}
            {step === 'code'    && t.auth.enterCode}
            {step === 'success' && t.auth.success}
          </h1>
          <p className="text-gray-600">
            {step === 'email'   && t.auth.enterEmailForReset}
            {step === 'code'    && t.auth.checkYourEmail}
            {step === 'success' && t.auth.passwordResetSuccess}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.emailAddress}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={t.auth.enterEmail} required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />{t.auth.sendingCode}
                  </div>
                ) : t.auth.sendResetCode}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.verificationCode}</label>
                <input type="text" maxLength={6} value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000" required />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {t.auth.codeExpiresIn} 15 {t.auth.minutes}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.newPassword}</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                    placeholder={t.auth.enterPassword} required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.confirmPassword}</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                    placeholder={t.auth.confirmPassword} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader className="w-5 h-5 animate-spin" />{t.auth.resettingPassword}</> : t.auth.resetPassword}
              </button>

              <div className="text-center">
                <button type="button" onClick={handleResendCode} disabled={loading}
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50">
                  {t.auth.didntReceiveCode} {t.auth.resendCode}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.auth.passwordResetSuccess}</h3>
                <p className="text-gray-600">{t.auth.passwordChangedSuccess}</p>
              </div>
              <Link to="/login"
                className="block w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold shadow-lg transition-all">
                {t.auth.goToLogin}
              </Link>
            </div>
          )}
        </div>

        {step !== 'success' && (
          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.rememberPassword}{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
              {t.auth.loginHere}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;