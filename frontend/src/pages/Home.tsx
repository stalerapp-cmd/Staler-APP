// src/pages/Home.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import {
  Wallet, Shield, Zap, Globe, ArrowRight, CheckCircle,
  Users, Store, CreditCard, ShoppingBag,
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/store"
            className="flex items-center justify-center gap-2 sm:gap-3 py-3 hover:opacity-90 transition-opacity group"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-center">
              {t.home.storeBannerText}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition-colors group-hover:bg-white/30">
              {t.home.storeBannerCta} <ArrowRight className="w-3 h-3" />
            </span>
            <ArrowRight className="w-4 h-4 sm:hidden flex-shrink-0" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16">
        <div className="text-center">

          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 shadow-2xl">
            <Wallet className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t.home.heroTitle}
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            {t.home.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                {t.home.goToDashboard}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
                >
                  {t.home.getStarted}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {t.home.loginBtn}
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-gray-600 px-4">
            {[t.home.badgeEncrypted, t.home.badgeInstant, t.home.badgeSecure].map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {[
            { Icon: Shield, title: t.home.featureSecureTitle, desc: t.home.featureSecureDesc, color: 'from-blue-500 to-cyan-600' },
            { Icon: Zap,    title: t.home.featureFastTitle,   desc: t.home.featureFastDesc,   color: 'from-yellow-500 to-orange-600' },
            { Icon: Globe,  title: t.home.featureGlobalTitle, desc: t.home.featureGlobalDesc, color: 'from-green-500 to-emerald-600' },
          ].map(({ Icon, title, desc, color }, i) => (
            <div key={i} className="bg-white p-6 sm:p-7 lg:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all group">
              <div className={`inline-flex p-3 sm:p-4 rounded-2xl bg-gradient-to-r ${color} mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-800">{title}</h3>
              <p className="text-gray-600 text-sm sm:text-base">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20 lg:mt-24 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            <div className="p-8 sm:p-10 lg:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.home.whyTitle}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {[
                  t.home.benefit1, t.home.benefit2, t.home.benefit3,
                  t.home.benefit4, t.home.benefit5, t.home.benefit6,
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-green-100 p-1 rounded-full flex-shrink-0">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm sm:text-base">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 sm:p-10 lg:p-12 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">{t.home.statsTitle}</h3>
              <div className="space-y-5 sm:space-y-6">
                {[
                  { Icon: Users,      label: t.home.statsUsers,        value: '1,000+' },
                  { Icon: Store,      label: t.home.statsMerchants,    value: '50+' },
                  { Icon: CreditCard, label: t.home.statsTransactions, value: '10K+' },
                ].map(({ Icon, label, value }, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <span className="text-xs sm:text-sm opacity-90">{label}</span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t.home.storeCtaTitle}</h2>
              <p className="text-base sm:text-lg opacity-90">{t.home.storeCtaDesc}</p>
            </div>
            <Link
              to="/store"
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-white text-emerald-600 hover:bg-gray-50 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
            >
              <ShoppingBag className="w-5 h-5" />
              {t.home.storeBannerCta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>


        {!user && (
          <div className="mt-8 sm:mt-10 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t.home.ctaTitle}</h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-xl mx-auto">{t.home.ctaDesc}</p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {t.home.ctaBtn}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        )}
      </div>

      <div className="bg-gray-900 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-lg sm:text-xl font-bold">S-Taler</span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">{t.home.footer}</p>
        </div>
      </div>

    </div>
  );
};

export default Home;