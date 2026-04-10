
// src/pages/user/Settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import {
  User, Mail, Lock, Save, Trash2, AlertTriangle, Camera,
  CheckCircle, XCircle, Eye, EyeOff, Loader, Shield, ImageOff,
  Building2, Link as LinkIcon, MessageCircle,
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '', email: user?.email || '',
    oldPassword: '', newPassword: '',
  });

  const [bankData,         setBankData]         = useState({ bankUsername: '', bankPassword: '' });
  const [linkedBank,       setLinkedBank]       = useState<{ bankUsername: string; linkedAt: string } | null>(null);
  const [bankLoading,      setBankLoading]      = useState(false);
  const [showBankPassword, setShowBankPassword] = useState(false);

  const [loading,                setLoading]                = useState(false);
  const [message,                setMessage]                = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showSaveModal,          setShowSaveModal]          = useState(false);
  const [showDeleteModal,        setShowDeleteModal]        = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showVerificationModal,  setShowVerificationModal]  = useState(false);
  const [showDeleteImageModal,   setShowDeleteImageModal]   = useState(false);
  const [showOldPassword,        setShowOldPassword]        = useState(false);
  const [showNewPassword,        setShowNewPassword]        = useState(false);
  const [profileImage,           setProfileImage]           = useState<string | null>(null);
  const [verificationCode,       setVerificationCode]       = useState('');
  const [verificationLoading,    setVerificationLoading]    = useState(false);
  const [changeType,             setChangeType]             = useState<'password' | 'email' | 'profile'>('profile');
  const [deleteAccountCode,      setDeleteAccountCode]      = useState('');
  const [oldData,                setOldData]                = useState({ fullName: '', email: '' });

  useEffect(() => { loadProfile(); loadLinkedBank(); }, []);

  const loadProfile = async () => {
    try {
      const profileRes = await apiService.getProfile();
      const userData = profileRes?.data?.user || profileRes?.user || profileRes?.data;
      if (!userData) throw new Error('User data not found');
      const fd = { fullName: userData.full_name ?? '', email: userData.email ?? '', oldPassword: '', newPassword: '' };
      setFormData(fd);
      setOldData({ fullName: userData.full_name ?? '', email: userData.email ?? '' });
      const img = userData.profile_image;
      if (img && !img.startsWith('http')) {
        const API_URL = process.env.REACT_APP_API_URL || window.location.origin;
        setProfileImage(`${API_URL}${img}`);
      } else { setProfileImage(img || null); }
    } catch (err) { console.error('Failed to load profile', err); }
  };

  const loadLinkedBank = async () => {
    try {
      const res = await apiService.get('/bank/linked');
      if (res?.success && res?.data) {
        setLinkedBank({ bankUsername: res.data.bankUsername, linkedAt: res.data.linkedAt });
      } else { setLinkedBank(null); }
    } catch { setLinkedBank(null); }
  };

  const hasChanges = () =>
    formData.fullName !== oldData.fullName ||
    formData.email    !== oldData.email    ||
    !!formData.newPassword;

  const handleLinkBank = async () => {
    if (!bankData.bankUsername || !bankData.bankPassword) {
      setMessage({ type: 'error', text: 'Please enter bank username and password.' }); return;
    }
    try {
      setBankLoading(true); setMessage(null);
      const res = await apiService.linkBankAccount(bankData.bankUsername, bankData.bankPassword);
      if (res.success) {
        setMessage({ type: 'success', text: '✅ Bank account linked successfully!' });
        setBankData({ bankUsername: '', bankPassword: '' });
        await loadLinkedBank();
        setTimeout(() => setMessage(null), 3000);
      } else { setMessage({ type: 'error', text: res.message || 'Failed to link bank account.' }); }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to link bank account.' });
    } finally { setBankLoading(false); }
  };

  const passwordRequirements = {
    length:    formData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(formData.newPassword),
    lowercase: /[a-z]/.test(formData.newPassword),
    number:    /[0-9]/.test(formData.newPassword),
    special:   /[!@#$%^&*]/.test(formData.newPassword),
  };
  const isPasswordValid = !formData.newPassword || Object.values(passwordRequirements).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      setTimeout(() => setMessage(null), 3000); return;
    }
    try {
      setLoading(true);
      const fd = new FormData(); fd.append('profileImage', file);
      await apiService.uploadProfileImage(fd);
      const reader = new FileReader();
      reader.onloadend = () => { setProfileImage(reader.result as string); };
      reader.readAsDataURL(file);
      setMessage({ type: 'success', text: '✅ Image updated!' });
      await refreshUser(); setTimeout(() => setMessage(null), 3000);
    } catch { setMessage({ type: 'error', text: 'Failed to upload image' }); }
    finally { setLoading(false); }
  };

  const handleDeleteImage = async () => {
    try {
      setLoading(true);
      await apiService.deleteProfileImage();
      setProfileImage(null); setShowDeleteImageModal(false);
      setMessage({ type: 'success', text: '✅ Profile image removed.' });
      await refreshUser(); setTimeout(() => setMessage(null), 3000);
    } catch { setMessage({ type: 'error', text: 'Failed to delete image' }); }
    finally { setLoading(false); }
  };

  const handleSaveClick = () => { setShowSaveModal(true); };

  const handleRequestUpdate = async () => {
    try {
      setLoading(true); setMessage(null);
      if (formData.newPassword && !isPasswordValid) {
        setMessage({ type: 'error', text: t.settings.passwordDoesNotMeet });
        setLoading(false); return;
      }
      const nameChanged     = formData.fullName !== oldData.fullName;
      const emailChanged    = formData.email    !== oldData.email;
      const passwordChanged = !!formData.newPassword;

      if (nameChanged && !emailChanged && !passwordChanged) {
        const res = await apiService.requestProfileUpdate({ updateType: 'profile', newValue: null, fullName: formData.fullName });
        if (res.success && !res.requiresVerification) {
          setMessage({ type: 'success', text: '✅ Name updated!' });
          setOldData({ ...oldData, fullName: formData.fullName });
          await refreshUser(); setTimeout(() => setMessage(null), 3000);
          setShowSaveModal(false); setLoading(false); return;
        }
      }

      let updateType: 'password' | 'email' | 'profile' = 'profile';
      if (passwordChanged) updateType = 'password';
      else if (emailChanged) updateType = 'email';

      const res = await apiService.requestProfileUpdate({
        updateType, newValue: emailChanged ? formData.email : null,
        fullName: formData.fullName, email: formData.email,
        oldPassword: passwordChanged ? formData.oldPassword : undefined,
        newPassword: passwordChanged ? formData.newPassword : undefined,
      });
      if (res.success) {
        setChangeType(updateType); setShowSaveModal(false);
        setShowVerificationModal(true);
        setMessage({ type: 'success', text: '📧 Code sent to your email' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally { setLoading(false); }
  };

  const handleVerifyAndUpdate = async () => {
    try {
      setVerificationLoading(true); setMessage(null);
      if (!verificationCode || verificationCode.length !== 6) {
        setMessage({ type: 'error', text: t.auth.enterVerificationCode });
        setVerificationLoading(false); return;
      }
      const res = await apiService.verifyAndUpdateProfile({ verificationCode });
      if (res.success) {
        setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
        setFormData({ ...formData, oldPassword: '', newPassword: '' });
        setShowVerificationModal(false); setVerificationCode('');
        setOldData({ fullName: formData.fullName, email: formData.email });
        await refreshUser(); await loadProfile();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid code' }); }
    finally { setVerificationLoading(false); }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      const res = await apiService.requestProfileUpdate({
        updateType: changeType, newValue: changeType === 'email' ? formData.email : null,
        fullName: formData.fullName, email: formData.email,
      });
      if (res.success) { setMessage({ type: 'success', text: '📧 Code resent!' }); setTimeout(() => setMessage(null), 3000); }
    } catch { setMessage({ type: 'error', text: 'Failed to resend code' }); }
    finally { setLoading(false); }
  };

  const handleRequestDeleteAccount = async () => {
    try {
      setLoading(true);
      const res = await apiService.requestAccountDeletion();
      if (res.success) {
        if (res.canDelete === false) {
          setMessage({ type: 'error', text: res.message || 'Cannot delete account.' });
          setShowDeleteModal(false);
        } else {
          setShowDeleteModal(false); setShowDeleteConfirmModal(true);
          setMessage({ type: 'success', text: '📧 Verification code sent to your email' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to request deletion' });
      setShowDeleteModal(false);
    } finally { setLoading(false); }
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      setLoading(true);
      if (!deleteAccountCode || deleteAccountCode.length !== 6) {
        setMessage({ type: 'error', text: t.auth.enterVerificationCode }); setLoading(false); return;
      }
      const res = await apiService.confirmAccountDeletion(deleteAccountCode);
      if (res.success) {
        setMessage({ type: 'success', text: '✅ Account deleted successfully' });
        setTimeout(() => { logout(); }, 1500);
      }
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid code' }); }
    finally { setLoading(false); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const alertStyle = (type: 'success' | 'error' | 'info') => {
    if (type === 'success') return 'bg-green-50 border-green-500 text-green-800';
    if (type === 'error')   return 'bg-red-50   border-red-500   text-red-800';
    return                         'bg-blue-50  border-blue-500  text-blue-800';
  };
  const AlertIcon = ({ type }: { type: 'success' | 'error' | 'info' }) => {
    if (type === 'success') return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
    if (type === 'error')   return <XCircle     className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
    return <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 sm:py-8 lg:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            {t.settings.title}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">{t.settings.accountSettings}</p>
        </div>

        {message && (
          <div className={`mb-5 p-4 rounded-xl border-l-4 flex items-center gap-3 ${alertStyle(message.type)}`}>
            <AlertIcon type={message.type} />
            <p className="font-medium text-sm sm:text-base flex-1">{message.text}</p>
            {message.type === 'info' && (
              <Link to="/messages"
                className="flex-shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Open Messages
              </Link>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl ring-4 ring-white/30 overflow-hidden">
                  {profileImage
                    ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    : getInitials(formData.fullName || user?.fullName || 'U')}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-white text-blue-600 p-2.5 sm:p-3 rounded-xl shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" disabled={loading} />
                </label>
                {profileImage && (
                  <button onClick={() => setShowDeleteImageModal(true)} disabled={loading}
                    className="absolute -bottom-2 -left-2 bg-white text-red-500 hover:text-red-600 p-2.5 sm:p-3 rounded-xl shadow-lg transition-colors disabled:opacity-50">
                    <ImageOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">{formData.fullName || user?.fullName}</h2>
              <p className="text-sm text-white/80 capitalize">{user?.role}</p>
              <div className="mt-3 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span className="text-white text-xs sm:text-sm font-medium">{t.settings.email} Verified</span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />{t.settings.fullName}
                </label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm sm:text-base"
                  placeholder={t.settings.fullName} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />{t.settings.email}
                  {user?.emailVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm sm:text-base"
                  placeholder={t.settings.email} />
              </div>
            </div>

            <div className="border-t pt-5 sm:pt-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />{t.settings.changePassword}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.settings.oldPassword}</label>
                  <div className="relative">
                    <input type={showOldPassword ? 'text' : 'password'} name="oldPassword" value={formData.oldPassword} onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm sm:text-base"
                      placeholder={t.settings.enterOldPassword} />
                    <button type="button" onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t.settings.newPassword}</label>
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={formData.newPassword} onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 text-sm sm:text-base"
                      placeholder={t.settings.leaveBlank} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              {formData.newPassword && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-3">{t.auth.passwordRequirements}:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'length',    label: t.auth.atLeast8Characters },
                      { key: 'uppercase', label: t.auth.uppercaseLetter    },
                      { key: 'lowercase', label: t.auth.lowercaseLetter    },
                      { key: 'number',    label: t.auth.number             },
                      { key: 'special',   label: t.auth.specialCharacter   },
                    ].map(req => (
                      <div key={req.key} className="flex items-center gap-2">
                        {passwordRequirements[req.key as keyof typeof passwordRequirements]
                          ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          : <XCircle    className="w-4 h-4 text-gray-400  flex-shrink-0" />}
                        <span className={`text-xs sm:text-sm ${passwordRequirements[req.key as keyof typeof passwordRequirements] ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-5 sm:pt-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                {t.withdraw?.bankWithdrawal ?? 'Bank Account'}
              </h3>

              {linkedBank ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-green-100 p-2.5 sm:p-3 rounded-xl flex-shrink-0">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="font-bold text-green-900 text-xs sm:text-sm">Bank Account Linked</p>
                        </div>
                        <p className="text-xs sm:text-sm text-green-800 font-semibold">@{linkedBank.bankUsername}</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          Linked on {new Date(linkedBank.linkedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMessage({
                          type: 'info',
                          text: 'To change your linked bank account, please contact our support team via Messages.',
                        });
                      }}
                      className="flex items-center gap-2 bg-white border-2 border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all text-xs sm:text-sm flex-shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Change Account
                    </button>
                  </div>

                  <div className="mt-3 bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-green-700">
                      ✅ You can now use <strong>Withdraw</strong> and <strong>Deposit</strong> without entering credentials each time.
                    </p>
                  </div>
                </div>

              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-amber-800">
                      ⚠️ Link your bank account once to enable quick withdrawals and deposits without entering credentials every time.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        {t.withdraw?.bankUsername ?? 'Bank Username'}
                      </label>
                      <input type="text" value={bankData.bankUsername}
                        onChange={e => setBankData({ ...bankData, bankUsername: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-800 text-sm sm:text-base"
                        placeholder={t.withdraw?.usernamePlaceholder ?? 'bank_username'} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-600" />
                        {t.withdraw?.bankPassword ?? 'Bank Password'}
                      </label>
                      <div className="relative">
                        <input type={showBankPassword ? 'text' : 'password'} value={bankData.bankPassword}
                          onChange={e => setBankData({ ...bankData, bankPassword: e.target.value })}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-800 text-sm sm:text-base"
                          placeholder="•••••••" />
                        <button type="button" onClick={() => setShowBankPassword(!showBankPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showBankPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleLinkBank}
                    disabled={bankLoading || !bankData.bankUsername || !bankData.bankPassword}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                    {bankLoading
                      ? <><Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />Linking...</>
                      : <><LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />Link Bank Account</>}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-5 sm:pt-6 border-t">
              <button onClick={handleSaveClick}
                disabled={loading || !isPasswordValid || !hasChanges()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                {loading ? t.common.processing : t.settings.saveChanges}
              </button>
              <button onClick={() => setShowDeleteModal(true)} disabled={loading}
                className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 sm:px-6 py-3 rounded-xl font-semibold border-2 border-red-200 hover:border-red-300 transition-all disabled:opacity-50 text-sm sm:text-base">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />{t.settings.deleteAccount}
              </button>
            </div>
          </div>
        </div>


        {showDeleteImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
              <div className="p-6 text-center">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageOff className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Remove Profile Photo?</h2>
                <p className="text-gray-500 text-sm mb-5">Your profile will show your initials instead.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteImageModal(false)} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50">
                    {t.common.cancel}
                  </button>
                  <button onClick={handleDeleteImage} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md disabled:opacity-50">
                    {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
              <div className="p-6">
                <div className="bg-blue-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">Verify Your Identity</h2>
                <p className="text-gray-600 text-center text-sm sm:text-base mb-5 sm:mb-6">
                  We'll send a verification code to confirm your changes
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowSaveModal(false)} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50">
                    {t.common.cancel}
                  </button>
                  <button onClick={handleRequestUpdate} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                    {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
              <div className="p-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">{t.auth.verificationCode}</h2>
                <p className="text-gray-600 text-center text-sm mb-4">{t.auth.checkYourEmail}</p>
                <div className="space-y-4">
                  <input type="text" maxLength={6} value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000" autoFocus />
                  <button onClick={handleVerifyAndUpdate}
                    disabled={verificationLoading || verificationCode.length !== 6}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50">
                    {verificationLoading
                      ? <div className="flex items-center justify-center gap-2"><Loader className="w-5 h-5 animate-spin" />{t.common.processing}</div>
                      : t.auth.verifyEmail}
                  </button>
                  <div className="text-center">
                    <button onClick={handleResendCode} disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50">
                      {t.auth.didntReceiveCode} {t.auth.resendCode}
                    </button>
                  </div>
                  <button onClick={() => { setShowVerificationModal(false); setVerificationCode(''); }}
                    className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm">
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
              <div className="p-6">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">{t.settings.deleteAccount}?</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-800 text-sm font-medium mb-1">⚠️ This action cannot be undone!</p>
                  <p className="text-red-700 text-sm">All your data will be permanently deleted.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors disabled:opacity-50">
                    {t.common.cancel}
                  </button>
                  <button onClick={handleRequestDeleteAccount} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                    {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
              <div className="p-6">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">Confirm Deletion</h2>
                <p className="text-gray-600 text-center text-sm mb-4">{t.auth.checkYourEmail}</p>
                <div className="space-y-4">
                  <input type="text" maxLength={6} value={deleteAccountCode}
                    onChange={e => setDeleteAccountCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000" />
                  <button onClick={handleConfirmDeleteAccount}
                    disabled={loading || deleteAccountCode.length !== 6}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50">
                    {loading
                      ? <div className="flex items-center justify-center gap-2"><Loader className="w-5 h-5 animate-spin" />{t.common.processing}</div>
                      : t.settings.deleteAccount}
                  </button>
                  <button onClick={() => { setShowDeleteConfirmModal(false); setDeleteAccountCode(''); }}
                    className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm">
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Settings;