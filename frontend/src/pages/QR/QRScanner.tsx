
// src/pages/QR/QRScanner.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation'; 
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle, Loader, Shield } from 'lucide-react';

const QRScanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraList, setCameraList] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    checkPermissions();
    return () => {
      stopScanner();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        setError(`🔒 ${t.qrScanner.cameraRequiresHTTPS}`);
        setPermissionStatus('denied');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setPermissionStatus('granted');
      stream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraList(videoDevices);
      console.log('📷 Available cameras:', videoDevices.length);

      await startScanner(videoDevices);
      
    } catch (err: any) {
      console.error('Permission error:', err);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError') {
        setError(`❌ ${t.qrScanner.cameraPermissionDenied}`);
      } else if (err.name === 'NotFoundError') {
        setError(`❌ ${t.qrScanner.noCameraFound}`);
      } else if (err.name === 'NotReadableError') {
        setError(`❌ ${t.qrScanner.cameraInUse}`);
      } else {
        setError(`❌ ${t.qrScanner.cameraError}: ${err.message}`);
      }
    }
  };

  const startScanner = async (cameras?: MediaDeviceInfo[]) => {
    try {
      setError('');
      setScanning(true);

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      const availableCameras = cameras ?? cameraList;
      let cameraId: string;
      
      if (availableCameras.length > 0) {
        const backCamera = availableCameras.find((device: MediaDeviceInfo) => 
          /back|rear|environment/i.test(device.label)
        );
        cameraId = backCamera ? backCamera.deviceId : availableCameras[0].deviceId;
      } else {
        cameraId = 'environment';
      }

      console.log('📷 Starting camera:', cameraId);

      await scanner.start(
        cameraId,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        handleScan,
        (errorMessage) => {
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.log('Scan error:', errorMessage);
          }
        }
      );

      console.log('✅ Scanner started successfully');
      
    } catch (err: any) {
      console.error('Start scanner error:', err);
      setError(err.message || t.qrScanner.failedToStart);
      setScanning(false);
      setPermissionStatus('denied');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        console.log('🛑 Scanner stopped');
      } catch (e) {
        console.error('Stop scanner error:', e);
      }
      scannerRef.current = null;
    }
  };

  const handleScan = async (decodedText: string) => {
    console.log('🔍 QR Scanned:', decodedText);
    
    await stopScanner();
    setScanning(false);

    if (
      decodedText.includes('start-operation') ||
      decodedText.includes('withdrawal-operation') ||
      decodedText.startsWith('taler://withdraw')
    ) {
      const uuidMatch = decodedText.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      );
      const operationId = uuidMatch ? uuidMatch[0] : null;
 
      if (!operationId) {
        setError(t.qrScanner.unrecognizedQR);
        return;
      }
 
      setSuccess(`🏦 ${t.qrScanner.bankQRDetected}`);
      setTimeout(() => {
        navigate(`/qr-payment?type=bank-qr&operationId=${operationId}`);
      }, 800);
      return;
    }
 
    if (decodedText.startsWith('taler://exchange')) {
      try {
        const url = new URL(decodedText.replace('taler://', 'https://'));
        const to = url.searchParams.get('to') || '';
        const amount = url.searchParams.get('amount') || '';
        const desc = url.searchParams.get('desc') || '';
        const ts = url.searchParams.get('ts') || '';
        
        console.log('💱 Exchange QR parsed:', { to, amount, desc, ts });
        
        if (!to) {
          setError(t.qrScanner.exchangeWalletMissing);
          return;
        }
        
        setSuccess(`💱 ${t.qrScanner.exchangeQRDetected}`);
        setTimeout(() => {
          navigate(`/exchange-payment?to=${encodeURIComponent(to)}&amount=${amount}&desc=${encodeURIComponent(desc)}&ts=${ts}`);
        }, 500);
      } catch (e) {
        console.error('Exchange QR parse error:', e);
        setError(t.qrScanner.invalidExchangeQR);
      }
      return;
    }

    if (decodedText.startsWith('taler://pay')) {
      try {
        const url = new URL(decodedText.replace('taler://', 'https://'));
        const to = url.searchParams.get('to') || '';
        const amount = url.searchParams.get('amount') || '';
        const desc = url.searchParams.get('desc') || '';
        
        if (amount) {
          setSuccess(`💳 ${t.qrScanner.merchantPaymentDetected}`);
          setTimeout(() => {
            navigate(`/merchant-payment?to=${encodeURIComponent(to)}&amount=${amount}&desc=${encodeURIComponent(desc)}`);
          }, 500);
        } else {
          setSuccess(`💳 ${t.qrScanner.personalQRDetected}`);
          setTimeout(() => {
            navigate(`/qr-payment?type=payment&to=${encodeURIComponent(to)}`);
          }, 500);
        }
      } catch (e) {
        setError(t.qrScanner.invalidPaymentQR);
      }
      return;
    }

    if (decodedText.length > 5 && !decodedText.includes('://')) {
      setSuccess(`💳 ${t.qrScanner.walletIdDetected}`);
      setTimeout(() => {
        navigate(`/qr-payment?type=payment&to=${encodeURIComponent(decodedText)}`);
      }, 500);
      return;
    }

    setError(t.qrScanner.unrecognizedQR);
  };

  const retryPermissions = async () => {
    setError('');
    setSuccess('');
    setPermissionStatus('pending');
    await checkPermissions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6" />
              <div>
                <h1 className="text-2xl font-bold">{t.qrScanner.qrScanner}</h1>
                <p className="text-sm opacity-90">{t.qrScanner.scanAnyQR}</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="hover:opacity-80">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {permissionStatus === 'pending' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4 flex items-start gap-3">
                <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                <div>
                  <p className="text-sm text-blue-800 font-semibold">{t.qrScanner.requestingCamera}</p>
                  <p className="text-xs text-blue-700 mt-1">{t.qrScanner.allowCameraPermission}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-semibold">{error}</p>
                    
                    {error.includes('permission denied') && (
                      <div className="mt-3 text-xs text-red-700 space-y-1">
                        <p className="font-semibold">{t.qrScanner.howToFix}</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>{t.qrScanner.fixStep1}</li>
                          <li>{t.qrScanner.fixStep2}</li>
                          <li>{t.qrScanner.fixStep3}</li>
                          <li>{t.qrScanner.fixStep4}</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800 font-semibold">{success}</p>
                  <p className="text-xs text-green-700 mt-1">{t.qrScanner.redirecting}</p>
                </div>
              </div>
            )}

            <div 
              id="qr-reader" 
              className="rounded-xl overflow-hidden border-4 border-blue-200 shadow-inner mb-4"
              style={{ minHeight: '250px' }}
            />

            {scanning && !error && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    {t.qrScanner.cameraActive}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-6">
              {(error || permissionStatus === 'denied') && (
                <button
                  onClick={retryPermissions}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  {t.qrScanner.requestCameraAccess}
                </button>
              )}
              
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 {t.qrScanner.supportedQRTypes}</h3>
              <ul className="text-xs text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">💳</span>
                  <span><strong>{t.qrScanner.personalQR}:</strong> {t.qrScanner.personalQRDesc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">🏪</span>
                  <span><strong>{t.qrScanner.merchantQR}:</strong> {t.qrScanner.merchantQRDesc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">💱</span>
                  <span><strong>{t.qrScanner.exchangeQR}:</strong> {t.qrScanner.exchangeQRDesc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">🏦</span>
                  <span><strong>{t.qrScanner.bankQR}:</strong> {t.qrScanner.bankQRDesc}</span>
                </li>
              </ul>
              
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700 font-medium mb-2">💡 {t.qrScanner.scanningTips}</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• {t.qrScanner.tip1}</li>
                  <li>• {t.qrScanner.tip2}</li>
                  <li>• {t.qrScanner.tip3}</li>
                  <li>• {t.qrScanner.tip4}</li>
                </ul>
              </div>
            </div>

            {cameraList.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  📷 {cameraList.length} {t.qrScanner.camerasDetected}
                </p>
                <p className="text-xs text-gray-500">
                  🔒 {t.qrScanner.connection}: {window.location.protocol}
                </p>
              </div>
            )}
          </div>
        </div>

        {window.location.protocol === 'http:' && 
         window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-900 font-medium">🔒 {t.qrScanner.httpsRequired}</p>
                <p className="text-xs text-orange-700 mt-1">
                  {t.qrScanner.cameraRequiresHTTPS}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;