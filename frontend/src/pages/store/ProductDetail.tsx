// src/pages/store/ProductDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import {
  Package, ArrowLeft, ShoppingCart, File,
  CheckCircle, LogIn, Share2, Copy, Zap, Shield, AlertCircle,
} from 'lucide-react';

interface ProductData {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  is_digital: boolean;
  store_name: string;
  merchant_id: string;
}

const LoginModal: React.FC<{ productId: number; onClose: () => void }> = ({ productId, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-7 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <LogIn className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-center text-gray-900 mb-1">{t.auth.loginTitle}</h2>
        <p className="text-center text-gray-400 text-sm mb-6">{t.auth.dontHaveAccount}</p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/login?redirect=/product/${productId}`)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-2xl font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            {t.auth.loginHere}
          </button>
          <button
            onClick={() => navigate(`/register?redirect=/product/${productId}`)}
            className="w-full border-2 border-gray-200 text-gray-700 py-3.5 rounded-2xl font-semibold hover:border-emerald-300 hover:text-emerald-700 transition-all"
          >
            {t.auth.registerHere}
          </button>
          <button onClick={onClose} className="w-full text-gray-400 text-sm py-2">
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { t }         = useTranslation();

  const [product,    setProduct]    = useState<ProductData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showLogin,  setShowLogin]  = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [added,      setAdded]      = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [expanded,   setExpanded]   = useState(false);

  const API_URL          = process.env.REACT_APP_API_URL || window.location.origin;
  const DESCRIPTION_LIMIT = 300;

  useEffect(() => { load(); }, [productId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/store/products/${productId}`);
      if (res.success) {
        const p = res.data.product;
        setProduct({ ...p, store_name: p.merchants?.store_name || p.store_name || 'Store' });
      } else {
        setError('not found');
      }
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!user) { setShowLogin(true); return; }
    if (!product) return;
    setAdding(true);
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const i = cart.findIndex((x: any) => x.productId === product.id);
      if (i >= 0) cart[i].quantity += 1;
      else cart.push({ productId: product.id, quantity: 1 });
      localStorage.setItem('cart', JSON.stringify(cart));
      setAdded(true);
      setTimeout(() => { setAdded(false); navigate('/store'); }, 1000);
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${productId}`;
    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({ title: product?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      try { await navigator.clipboard.writeText(url); setCopied(true); } catch {}
    }
  };

  const imgUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('http') || url.startsWith('data:') ? url : `${API_URL}${url}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">{t.common.loading}</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-20 h-20 bg-white rounded-3xl shadow flex items-center justify-center">
        <Package className="w-10 h-10 text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">{t.productDetail.notFound}</p>
      <Link
        to="/store"
        className="text-emerald-600 text-sm font-semibold hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> {t.productDetail.backToStore}
      </Link>
    </div>
  );

  const outOfStock = !product.is_digital && product.stock === 0;
  const longDesc   = product.description?.length > DESCRIPTION_LIMIT;
  const displayDesc = longDesc && !expanded
    ? product.description.slice(0, DESCRIPTION_LIMIT) + '…'
    : product.description;

  return (
    <div className="min-h-screen bg-gray-50">
      {showLogin && <LoginModal productId={product.id} onClose={() => setShowLogin(false)} />}
      {copied    && <CopyToast message={t.productDetail.linkCopied} onClose={() => setCopied(false)} />}

      {/* ── Page body ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

        {/* Back button */}
        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 mb-4 transition-colors group"
        >
          <div className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t.store.store}
        </Link>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">

            {/* ── Image panel ── */}
            <div className="lg:w-[44%] lg:flex-shrink-0">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square lg:aspect-auto lg:h-full lg:min-h-[480px] flex items-center justify-center overflow-hidden">

                {product.is_digital && (
                  <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                    <File className="w-3 h-3" /> {t.productDetail.digital}
                  </span>
                )}
                {outOfStock && (
                  <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                    {t.store.outOfStock}
                  </span>
                )}

                {product.image_url ? (
                  <img
                    src={imgUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-contain sm:object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <Package className="w-16 h-16" />
                    <span className="text-xs">{t.productDetail.noImage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Info panel ── */}
            <div className="flex-1 flex flex-col p-5 sm:p-7 lg:p-8">

              {/* Store pill + share */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {product.store_name}
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-all font-medium"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.productDetail.share}</span>
                  <Copy className="w-3 h-3 opacity-50" />
                </button>
              </div>

              {/* Name */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-snug mb-4">
                {product.name}
              </h1>

              {/* Description */}
              <div className="mb-5">
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed">{displayDesc}</p>
                {longDesc && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-emerald-600 text-sm font-medium hover:underline"
                  >
                    {expanded ? t.productDetail.showLess : t.productDetail.readMore}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-5" />

              {/* Price + stock badge */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">
                    {t.productDetail.price}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{product.price}</span>
                    <span className="text-base font-semibold text-emerald-500">PS</span>
                  </div>
                </div>

                {product.is_digital ? (
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-2xl">
                    <Zap className="w-3.5 h-3.5" /> {t.productDetail.instantDownload}
                  </div>
                ) : !outOfStock ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-2xl">
                    <CheckCircle className="w-3.5 h-3.5" /> {product.stock} {t.productDetail.inStock}
                  </div>
                ) : null}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-full">
                  <Shield className="w-3 h-3 text-emerald-500" /> {t.productDetail.securePayment}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> {t.productDetail.verified}
                </span>
              </div>

              {/* Guest hint */}
              {!user && !outOfStock && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-5">
                  <p className="text-amber-800 text-sm leading-relaxed">
                    <button
                      onClick={() => navigate(`/login?redirect=/product/${product.id}`)}
                      className="font-bold hover:underline"
                    >
                      {t.auth.loginHere}
                    </button>
                    {' '}{t.productDetail.or}{' '}
                    <button
                      onClick={() => navigate(`/register?redirect=/product/${product.id}`)}
                      className="font-bold hover:underline"
                    >
                      {t.auth.registerHere}
                    </button>
                    {' '}{t.productDetail.toPurchase}.
                  </p>
                </div>
              )}

              {/* ── CTA ── */}
              <div className="mt-auto space-y-3">
                <button
                  onClick={handleBuy}
                  disabled={outOfStock || adding}
                  className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-200 ${
                    outOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : !user
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:brightness-105 active:scale-[.98]'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:brightness-105 active:scale-[.98]'
                  }`}
                >
                  {adding ? (
                    <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t.common.processing}</>
                  ) : added ? (
                    <><CheckCircle className="w-5 h-5" />{t.productDetail.added}</>
                  ) : outOfStock ? (
                    t.store.outOfStock
                  ) : !user ? (
                    <><LogIn className="w-5 h-5" />{t.productDetail.loginToBuy}</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" />{product.is_digital ? t.store.buyAndDownload : t.store.addToCart}</>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4" />
                  {t.productDetail.shareProductLink}
                  <Copy className="w-3.5 h-3.5 opacity-40" />
                </button>
              </div>

            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
};

export default ProductDetail;