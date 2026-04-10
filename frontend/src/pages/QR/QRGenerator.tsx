

// src/pages/QR/QRGenerator.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import QRCode from 'qrcode';
import {
  QrCode as QrIcon, RefreshCw, Download, Copy, Check,
  DollarSign, FileText, User, Store,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const QRGenerator: React.FC = () => {
  const { t }  = useTranslation();
  const { user } = useAuth();

  const canUseMerchantQR = user?.role === 'merchant';

  const [qrType, setQrType]       = useState<'personal' | 'merchant'>('personal');
  const [amount, setAmount]       = useState('10');
  const [description, setDescription] = useState('Product Purchase');
  const [copied, setCopied]       = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (canUseMerchantQR) setQrType('merchant');
    else setQrType('personal');
  }, [canUseMerchantQR]);

  const generateURI = () => {
    const myWalletId = user?.walletId || 'WALLET_ID';
    if (qrType === 'personal') {
      return `taler://pay?to=${myWalletId}`;
    }
    return `taler://pay?to=${myWalletId}&amount=PS:${amount}&desc=${encodeURIComponent(description)}`;
  };

  const uri = generateURI();

  useEffect(() => {
    const qrColor = qrType === 'merchant' ? '#7C3AED' : '#3B82F6';
    QRCode.toDataURL(uri, {
      width: 280, margin: 2,
      color: { dark: qrColor, light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [uri, qrType]);

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = qrType === 'personal'
      ? `Personal-QR-${user?.walletId}.png`
      : `Payment-QR-${amount}PS.png`;
    a.click();
  };

  const copyURI = () => {
    navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {}
        {canUseMerchantQR && (
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">{t.qrGenerator.selectQRType}</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button onClick={() => setQrType('personal')}
                className={`p-4 rounded-xl border-2 transition-all ${qrType === 'personal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <User className={`w-7 h-7 mx-auto mb-2 ${qrType === 'personal' ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${qrType === 'personal' ? 'text-blue-700' : 'text-gray-600'}`}>{t.qrGenerator.personalQR}</p>
                <p className="text-xs text-gray-500 mt-1">{t.qrGenerator.fixedPersonalQR}</p>
              </button>

              <button onClick={() => setQrType('merchant')}
                className={`p-4 rounded-xl border-2 transition-all ${qrType === 'merchant' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                <Store className={`w-7 h-7 mx-auto mb-2 ${qrType === 'merchant' ? 'text-purple-600' : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${qrType === 'merchant' ? 'text-purple-700' : 'text-gray-600'}`}>{t.qrGenerator.merchantQR}</p>
                <p className="text-xs text-gray-500 mt-1">{t.qrGenerator.preFilledAmount}</p>
              </button>
            </div>
          </div>
        )}

        {}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          <div className={`${qrType === 'personal' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'} p-5 sm:p-6 text-white text-center`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <QrIcon className="w-7 h-7" />
              <h1 className="text-2xl sm:text-3xl font-bold">
                {qrType === 'personal' ? t.qrGenerator.yourPersonalQR : t.qrGenerator.paymentQRGenerator}
              </h1>
            </div>
            <p className="text-sm opacity-90">
              {qrType === 'personal' ? t.qrGenerator.personalQRDesc : t.qrGenerator.merchantQRDesc}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className={`border-2 rounded-xl p-4 mb-5 ${qrType === 'personal' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full flex-shrink-0 ${qrType === 'personal' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  <QrIcon className={`w-4 h-4 ${qrType === 'personal' ? 'text-blue-600' : 'text-purple-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold mb-1 ${qrType === 'personal' ? 'text-blue-900' : 'text-purple-900'}`}>
                    {qrType === 'personal' ? `🎯 ${t.qrGenerator.fixedQR}` : `🔄 ${t.qrGenerator.dynamicQR}`}
                  </h3>
                  <p className={`text-xs mb-2 ${qrType === 'personal' ? 'text-blue-800' : 'text-purple-800'}`}>
                    {qrType === 'personal'
                      ? `${t.qrGenerator.neverChanges}. ${t.qrGenerator.othersEnterAmount}.`
                      : `${t.qrGenerator.changesWithAmount}.`}
                  </p>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {t.wallet.walletId}: {user?.walletId || t.common.loading}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {qrType === 'merchant' && (
              <>
                <div className="mb-5">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    {t.qrGenerator.amount}
                  </label>
                  <div className="relative">
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      min="0.01" step="0.01"
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                      placeholder="10.00" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">PS</span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[5, 10, 25, 50, 100, 200].map(val => (
                      <button key={val} onClick={() => setAmount(val.toString())}
                        className="flex-1 min-w-[44px] px-2 py-2 rounded-lg text-sm font-medium bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors">
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    {t.qrGenerator.description}
                  </label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder={t.qrGenerator.whatIsPaymentFor}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 {t.qrGenerator.appearsTo} {t.qrGenerator.customer} {t.qrGenerator.whenTheyScan}
                  </p>
                </div>

                <div className="rounded-xl p-4 mb-4 border bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">📋 {t.qrGenerator.paymentPreview}:</h3>
                  <div className="bg-white rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">{t.wallet.amount}:</span>
                      <span className="text-xs font-bold text-purple-700">{amount} PS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">{t.wallet.description}:</span>
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-[60%]">{description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">{t.qrGenerator.to}:</span>
                      <span className="text-xs font-mono text-gray-700">{user?.fullName}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center">
            <div className={`bg-white p-4 sm:p-6 rounded-2xl border-4 shadow-inner mb-5 ${qrType === 'personal' ? 'border-blue-200' : 'border-purple-200'}`}>
              {qrDataUrl
                ? <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 sm:w-72 sm:h-72" />
                : <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-gray-100 rounded">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${qrType === 'personal' ? 'border-blue-600' : 'border-purple-600'}`} />
                  </div>
              }
            </div>

            <div className={`mb-5 px-4 py-2 rounded-full flex items-center gap-2 ${qrType === 'personal' ? 'bg-blue-100' : 'bg-orange-100'}`}>
              {qrType === 'merchant' && <RefreshCw className="w-4 h-4 text-orange-600" />}
              <span className={`text-sm font-semibold ${qrType === 'personal' ? 'text-blue-800' : 'text-orange-800'}`}>
                {qrType === 'personal'
                  ? `${t.qrGenerator.fixedQR} — ${t.qrGenerator.neverChanges}`
                  : `${t.qrGenerator.dynamicQR} — ${t.qrGenerator.changesWithAmount}`}
              </span>
            </div>

            <div className="w-full bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
              <div className="flex items-start gap-2">
                <code className="text-xs text-gray-600 break-all flex-1 font-mono leading-relaxed">{uri}</code>
                <button onClick={copyURI} className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors" title={t.common.copy}>
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={downloadQR}
                className={`py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                  qrType === 'personal'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}>
                <Download className="w-5 h-5" /> {t.qrGenerator.downloadQR}
              </button>
              <button onClick={() => { setAmount('10'); setDescription('Product Purchase'); }}
                className="py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" /> {t.qrGenerator.reset}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            📋 {qrType === 'personal' ? t.qrGenerator.howPersonalQRWorks : t.qrGenerator.howMerchantQRWorks}
          </h3>
          <div className="space-y-2">
            {(qrType === 'personal'
              ? [t.qrGenerator.step1Personal, t.qrGenerator.step2Personal, t.qrGenerator.step3Personal, t.qrGenerator.step4Personal]
              : [t.qrGenerator.step1Merchant, t.qrGenerator.step2Merchant, t.qrGenerator.step3Merchant, t.qrGenerator.step4Merchant]
            ).map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`font-bold flex-shrink-0 ${qrType === 'personal' ? 'text-blue-600' : 'text-purple-600'}`}>{i + 1}.</span>
                <p className="text-xs text-gray-700"><strong>{step}</strong></p>
              </div>
            ))}
          </div>
        </div>

        <div className={`border rounded-xl p-4 ${qrType === 'personal' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'}`}>
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{t.qrGenerator.proTips}</h4>
              <ul className="text-xs text-gray-800 space-y-1">
                {(qrType === 'personal'
                  ? [t.qrGenerator.tip1Personal, t.qrGenerator.tip2Personal, t.qrGenerator.tip3Personal, t.qrGenerator.tip4Personal]
                  : [t.qrGenerator.tip1Merchant, t.qrGenerator.tip2Merchant, t.qrGenerator.tip3Merchant, t.qrGenerator.tip4Merchant]
                ).map((tip, i) => <li key={i}>• {tip}</li>)}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QRGenerator;