
// src/pages/Registeration/Login.tsx

import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import {
  Eye, EyeOff, Loader, Mail, Lock, LogIn,
  AlertCircle, CheckCircle2, ShieldAlert,
} from 'lucide-react';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const PendingModal: React.FC<{
  email: string;
  onVerified: () => void;
  onClose: () => void;
}> = ({ email, onVerified, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error,   setError]   = useState('');
  const [resent,  setResent]  = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) { setError(t.auth.enterVerificationCode); return; }
    setLoading(true); setError('');
    try {
      const data = await apiService.verifyEmail(email, code);
      if (data.success) {
        onVerified();
        navigate('/login');
      } else {
        setError(data.message || t.messages.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t.messages.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setError('');
    try {
      await apiService.resendVerificationCode(email);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError(t.messages.error);
    } finally { setResending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-7 sm:p-8">

        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t.auth.verifyYourEmail}</h2>
          <p className="text-sm text-gray-500">{t.auth.checkYourEmail}</p>
          <p className="text-sm font-semibold text-gray-800 mt-1 truncate">{email}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Your account registration is incomplete. Enter the verification code sent to your email to activate your account.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            {t.auth.verificationCode}
          </label>
          <input
            type="text" maxLength={6} value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
            className="w-full px-4 py-3.5 border-2 border-gray-200 focus:border-emerald-400 rounded-2xl text-center text-2xl tracking-widest font-mono focus:outline-none transition-colors"
            placeholder="000000"
            autoFocus
          />
          <p className="text-xs text-gray-400 text-center mt-2">
            {t.auth.codeExpiresIn} 15 {t.auth.minutes}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {resent && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700">New code sent to your email!</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-2xl font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader className="w-5 h-5 animate-spin" />{t.common.verifying}</> : t.auth.verifyEmail}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full py-3 rounded-2xl font-medium text-sm text-gray-600 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
          >
            {resending ? <Loader className="w-4 h-4 animate-spin" /> : null}
            {t.auth.didntReceiveCode} {t.auth.resendCode}
          </button>

          <button onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors">
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const { t }        = useTranslation();
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors,       setErrors]       = useState<FormErrors>({});
  const [loading,      setLoading]      = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};
    if (!email)                    newErrors.email    = t.login.emailRequired;
    else if (!validateEmail(email)) newErrors.email   = t.login.invalidEmail;
    if (!password)                 newErrors.password = t.login.passwordRequired;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await login(email, password);
      const params     = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (err: any) {
      const errorData = err.response?.data;

      if (errorData?.code === 'PENDING_VERIFICATION') {
        setPendingEmail(errorData.email || email);
        return;
      }

      const newErrors: FormErrors = {};
      newErrors.general = errorData?.message || t.login.loginFailed;
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">

      {pendingEmail && (
        <PendingModal
          email={pendingEmail}
          onVerified={() => { setPendingEmail(null); }}
          onClose={() => setPendingEmail(null)}
        />
      )}

      <div className="max-w-md w-full">

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {t.login.welcomeBack}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">{t.login.loginToAccount}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">

          {errors.general && (
            <div className="bg-red-50 border-s-4 border-red-500 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{errors.general}</p>
                  <p className="text-xs text-red-600 mt-1">{t.login.checkCredentials}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.login.emailAddress}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors ${
                    errors.email ? 'text-red-400' : emailFocused ? 'text-green-500' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className={`w-full ps-10 pe-10 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 focus:border-transparent'
                  }`}
                  placeholder={t.login.emailPlaceholder}
                />
                {email && !errors.email && validateEmail(email) && (
                  <div className="absolute end-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <div className="flex items-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errors.email}</p>
                </div>
              )}
              {!errors.email && email && !validateEmail(email) && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{t.login.emailFormatHint}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.login.password}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                  className={`w-full ps-10 pe-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 focus:border-transparent'
                  }`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errors.password}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading
                ? <><Loader className="w-5 h-5 animate-spin" />{t.login.loggingIn}</>
                : <><LogIn className="w-5 h-5" />{t.login.loginButton}</>
              }
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <Link to="/register"
                className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors">
                {t.login.createAccount}
              </Link>
              <Link to="/forgot-password"
                className="text-gray-600 hover:text-gray-800 hover:underline transition-colors">
                {t.login.forgotPassword}
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">{t.login.termsNotice}</p>
      </div>
    </div>
  );
};

export default Login;