
// src/pages/Registeration/Register.tsx

import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import {
  Eye, EyeOff, CheckCircle, XCircle, User, Store,
  Building, AlertCircle, Mail, Loader,
} from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface RegisterFormData {
  walletId: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const Register: React.FC = () => {
  const { t } = useTranslation();

  const passwordRequirements: PasswordRequirement[] = [
    { label: t.auth.atLeast8Characters, test: (p) => p.length >= 8 },
    { label: t.auth.uppercaseLetter,    test: (p) => /[A-Z]/.test(p) },
    { label: t.auth.lowercaseLetter,    test: (p) => /[a-z]/.test(p) },
    { label: t.auth.number,             test: (p) => /[0-9]/.test(p) },
    { label: t.auth.specialCharacter,   test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const roles = [
    { value: 'user',     label: t.admin.user,     icon: User,     description: t.auth.accountType },
    { value: 'merchant', label: t.admin.merchant, icon: Store,    description: t.merchant.createStore },
    { value: 'exchange', label: t.admin.exchange, icon: Building, description: t.admin.exchange },
  ];

  const [formData, setFormData] = useState<RegisterFormData>({
    walletId: '', fullName: '', email: '',
    password: '', confirmPassword: '', role: 'user',
  });
  const [showPassword,          setShowPassword]          = useState(false);
  const [showConfirmPassword,   setShowConfirmPassword]   = useState(false);
  const [errors,                setErrors]                = useState<any>({});
  const [loading,               setLoading]               = useState(false);
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode,      setVerificationCode]      = useState('');
  const [verificationLoading,   setVerificationLoading]   = useState(false);
  const [emailFocused,          setEmailFocused]          = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };

  const generateWalletId = () => {
    const id = 'wallet_' + Math.random().toString(36).substr(2, 9);
    setFormData(prev => ({ ...prev, walletId: id }));
    if (errors.walletId) setErrors((prev: any) => ({ ...prev, walletId: undefined }));
  };

  const isPasswordStrong = () => passwordRequirements.every((req) => req.test(formData.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: any = {};
    if (!formData.walletId)                                    newErrors.walletId       = t.auth.generateWalletId;
    if (!formData.fullName || formData.fullName.trim().length < 2) newErrors.fullName  = t.auth.fullName;
    if (!formData.email)                                       newErrors.email          = t.auth.enterEmail;
    else if (!validateEmail(formData.email))                   newErrors.email          = t.auth.enterEmail;
    if (!formData.password)                                    newErrors.password       = t.auth.enterPassword;
    else if (!isPasswordStrong())                              newErrors.password       = t.settings.passwordDoesNotMeet;
    if (formData.password !== formData.confirmPassword)        newErrors.confirmPassword = t.auth.passwordsDoNotMatch;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await register({
        walletId: formData.walletId,
        fullName: formData.fullName,
        email:    formData.email,
        password: formData.password,
        role:     formData.role,
        verificationMethod: 'email',
      });
      setShowVerificationModal(true);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.code === 'PENDING_VERIFICATION') {
        setShowVerificationModal(true);
      } else {
        const newErrors: any = {};
        if (errorData?.field === 'email')         newErrors.email    = errorData.message || t.auth.invalidCredentials;
        else if (errorData?.field === 'walletId') newErrors.walletId = errorData.message || t.auth.invalidCredentials;
        else                                      newErrors.general  = errorData?.message || t.messages.error;
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) return;
    setVerificationLoading(true);
    try {
      const data = await apiService.verifyEmail(formData.email, verificationCode);
      if (data.success) {
        setShowVerificationModal(false);
        navigate('/login');
      }
    } catch (error: any) {
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    try { await apiService.resendVerificationCode(formData.email); } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-7 sm:p-8">

            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t.auth.verifyYourEmail}</h2>
              <p className="text-sm text-gray-500">{t.auth.checkYourEmail}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1 truncate">{formData.email}</p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                {t.auth.verificationCode}
              </label>
              <input
                type="text" maxLength={6} value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3.5 border-2 border-gray-200 focus:border-green-400 rounded-2xl text-center text-2xl tracking-widest font-mono focus:outline-none transition-colors"
                placeholder="000000"
                autoFocus
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                {t.auth.codeExpiresIn} 15 {t.auth.minutes}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleVerifyEmail}
                disabled={verificationLoading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3.5 rounded-2xl font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verificationLoading
                  ? <><Loader className="w-5 h-5 animate-spin" />{t.common.processing}</>
                  : t.auth.verifyEmail}
              </button>

              <button
                onClick={handleResendCode}
                className="w-full py-3 rounded-2xl font-medium text-sm text-gray-600 hover:text-green-600 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all"
              >
                {t.auth.didntReceiveCode} {t.auth.resendCode}
              </button>

              <button
                onClick={() => { setShowVerificationModal(false); navigate('/login'); }}
                className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t.auth.registerTitle}
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">{t.auth.registerSubtitle}</p>
        </div>

        {errors.general && (
          <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.walletId} *</label>
            <div className="flex gap-2">
              <input type="text" name="walletId" value={formData.walletId} onChange={handleChange} readOnly required
                className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-gray-50 font-mono text-sm ${errors.walletId ? 'border-red-300' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder={t.auth.generateWalletId} />
              <button type="button" onClick={generateWalletId}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg text-sm sm:text-base">
                {t.common.generate}
              </button>
            </div>
            {errors.walletId && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><XCircle className="w-4 h-4" />{errors.walletId}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">{t.auth.accountType} *</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {roles.map(({ value, label, icon: Icon, description }) => (
                <label key={value}
                  className={`relative flex flex-col items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.role === value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}>
                  <input type="radio" name="role" value={value} checked={formData.role === value} onChange={handleChange} className="sr-only" />
                  <Icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-1.5 sm:mb-2 ${formData.role === value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium text-xs sm:text-sm ${formData.role === value ? 'text-blue-600' : 'text-gray-700'}`}>{label}</span>
                  <span className="text-xs text-gray-500 text-center mt-0.5 hidden sm:block">{description}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.fullName} *</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.fullName ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="Ahmad Ali" />
            {errors.fullName && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><XCircle className="w-4 h-4" />{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.emailAddress} *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`w-5 h-5 ${errors.email ? 'text-red-400' : emailFocused ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} required
                className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder={t.auth.enterEmail} />
              {formData.email && !errors.email && validateEmail(formData.email) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-5 h-5 text-green-500" /></div>
              )}
            </div>
            {errors.email && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.password} *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                onChange={handleChange} onFocus={() => setShowPasswordChecklist(true)} required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 pr-12 transition-all ${errors.password ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder={t.auth.enterPassword} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {showPasswordChecklist && formData.password && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">{t.auth.passwordRequirements}</p>
                <div className="space-y-2">
                  {passwordRequirements.map((req, i) => {
                    const passed = req.test(formData.password);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        {passed
                          ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          : <XCircle    className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                        <span className={`text-xs ${passed ? 'text-green-700 font-medium' : 'text-gray-500'}`}>{req.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {errors.password && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><XCircle className="w-4 h-4" />{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.auth.confirmPassword} *</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange} required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 pr-12 transition-all ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder={t.auth.confirmPassword} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><XCircle className="w-3 h-3" />{t.auth.passwordsDoNotMatch}</p>
            )}
          </div>

          <button type="submit" disabled={loading || !isPasswordStrong()}
            className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
              loading || !isPasswordStrong()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl'
            }`}>
            {loading
              ? <><Loader className="w-5 h-5 animate-spin" />{t.common.processing}</>
              : t.auth.createAccount}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {t.auth.alreadyHaveAccount}{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
            {t.auth.loginHere}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;