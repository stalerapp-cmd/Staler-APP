
// src/pages/user/Profile.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { User, Mail, Wallet, Copy, Check, Settings, Loader, ShoppingCart } from 'lucide-react';
import apiService from '../../services/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const profileRes = await apiService.getProfile();
      const userData = profileRes.data.data?.user || profileRes.data.user;
      setProfileData(userData);

      const walletRes = await apiService.getWallet();
      setWalletData(walletRes.data.wallet);
    } catch (error) {
      console.error('Error loading profile data', error);
    } finally {
      setLoading(false);
    }
  };

  const copyWalletId = () => {
    const walletId = walletData?.walletId || user?.walletId;
    if (walletId) {
      navigator.clipboard.writeText(walletId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileImage = () => {
    const img = profileData?.profile_image;
    if (img && !img.startsWith('http')) {
      const API_URL = process.env.REACT_APP_API_URL || window.location.origin;
      return `${API_URL}${img}`;
    }
    return img;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.profile.loading}</p>
        </div>
      </div>
    );
  }

  const displayName = profileData?.full_name || user?.fullName;
  const displayEmail = profileData?.email || user?.email;
  const displayWalletId = walletData?.walletId || user?.walletId;
  const profileImage = getProfileImage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {t.profile.profile}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            {t.profile.updateInfo}{' '}
            <Link to="/settings" className="text-indigo-600 hover:underline font-medium">
              {t.profile.goToSettings}
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="relative h-40 sm:h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white opacity-10 rounded-full -mr-20 sm:-mr-32 -mt-20 sm:-mt-32"></div>
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white opacity-10 rounded-full -ml-16 sm:-ml-24 -mb-16 sm:-mb-24"></div>
          </div>

          <div className="relative px-6 sm:px-8 pb-8">
            <div className="flex flex-col items-center -mt-20 sm:-mt-24 mb-8">
              <div className="relative mb-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-2xl ring-6 sm:ring-8 ring-white"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl ring-6 sm:ring-8 ring-white">
                    {displayName ? getInitials(displayName) : <User className="w-16 sm:w-20 h-16 sm:h-20" />}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 sm:border-6 border-white shadow-lg"></div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  {displayName}
                </h2>
                <p className="text-base sm:text-lg text-gray-500 capitalize">
                  {user?.role} {t.common.account}
                </p>
              </div>

              <Link
                to="/settings"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Settings className="w-5 h-5" />
                <span>{t.nav.settings}</span>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm flex-shrink-0">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                      {t.profile.fullName}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {displayName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm flex-shrink-0">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wide mb-1">
                      {t.profile.email}
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {displayEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="bg-white p-3 rounded-lg shadow-sm flex-shrink-0">
                      <Wallet className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">
                        {t.profile.walletId}
                      </p>
                      <code className="text-base sm:text-lg font-mono font-bold text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 block truncate">
                        {displayWalletId}
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={copyWalletId}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{t.profile.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>{t.profile.copy}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${user?.role === 'user' ? 'sm:grid-cols-2' : ''} gap-4`}>
  <Link
    to="/dashboard"
    className="bg-white hover:bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100 group"
  >
    <div className="flex items-center gap-4">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
        <Wallet className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-800 text-lg mb-1">{t.nav.dashboard}</h3>
        <p className="text-sm text-gray-500">{t.dashboard.yourBalance}</p>
      </div>
    </div>
  </Link>

           {user?.role === 'user' && (
    <Link
      to="/orders"
      className="bg-white hover:bg-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100 group"
    >
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-lg mb-1">{t.nav.orders}</h3>
          <p className="text-sm text-gray-500">{t.orders.viewHistory}</p>
        </div>
      </div>
    </Link>
  )}
        </div>
      </div>
    </div>
  );
};

export default Profile;