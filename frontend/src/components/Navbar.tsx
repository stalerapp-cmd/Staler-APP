

// src/components/Navbar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';
import {
  Wallet, Menu, X, ChevronDown, LogOut, User, Settings,
  LayoutDashboard, ShoppingBag, Package, Users, QrCode,
  MessageCircle,
} from 'lucide-react';
import messagesApi from '../services/messagesApi';

const MessagesButton: React.FC = () => {
  const { user }   = useAuth();
  const [count, setCount] = useState(0);
  const location   = useLocation();
  const isActive   = location.pathname === '/messages';

  const fetchCount = useCallback(async () => {
    if (!user) { setCount(0); return; }
    try {
      const r = await messagesApi.getUnreadCount();
      if (r.success) setCount(r.unreadCount);
    } catch {  }
  }, [user]);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 15_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  useEffect(() => {
    const handler = () => { setCount(0); fetchCount(); };
    window.addEventListener('messages:read', handler);
    return () => window.removeEventListener('messages:read', handler);
  }, [fetchCount]);

  return (
    <Link
      to="/messages"
      className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all ${
        isActive
          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
      }`}
      title="Messages"
    >
      <MessageCircle className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none shadow-sm border border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t }            = useTranslation();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setMenuOpen(false); setMobileMenuOpen(false); }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const NavLink: React.FC<{ to: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ to, children, icon }) => (
    <Link to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive(to)
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}<span>{children}</span>
    </Link>
  );

  const MobileNavLink: React.FC<{ to: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ to, children, icon }) => (
    <Link to={to} onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
        isActive(to)
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}<span>{children}</span>
    </Link>
  );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                S-Taler
              </span>
            </Link>
          </div>

          {}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {user ? (
              <>
                {}
                {user.role === 'admin' && (
                  <>
                    <NavLink to="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>{t.nav.dashboard}</NavLink>
                    <NavLink to="/admin/users"     icon={<Users           className="w-4 h-4" />}>{t.admin.users}</NavLink>
                  </>
                )}
                {}
                {user.role === 'user' && (
                  <>
                    <NavLink to="/dashboard"    icon={<LayoutDashboard className="w-4 h-4" />}>{t.nav.dashboard}</NavLink>
                    <NavLink to="/store"        icon={<ShoppingBag     className="w-4 h-4" />}>{t.nav.store}</NavLink>
                    <NavLink to="/orders"       icon={<Package         className="w-4 h-4" />}>{t.nav.orders}</NavLink>
                    <NavLink to="/qr-generator" icon={<QrCode          className="w-4 h-4" />}>{t.qrGenerator.title}</NavLink>
                  </>
                )}
                {}
                {user.role === 'merchant' && (
                  <>
                    <NavLink to="/merchant/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>{t.nav.dashboard}</NavLink>
                    <NavLink to="/merchant/products"  icon={<Package         className="w-4 h-4" />}>{t.merchant.products}</NavLink>
                    <NavLink to="/merchant/orders"    icon={<ShoppingBag     className="w-4 h-4" />}>{t.merchant.orders}</NavLink>
                    <NavLink to="/qr-generator"       icon={<QrCode          className="w-4 h-4" />}>{t.qrGenerator.title}</NavLink>
                  </>
                )}
                {}
                {user.role === 'exchange' && (
                  <>
                    <NavLink to="/exchange/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>{t.nav.dashboard}</NavLink>
                    <NavLink to="/transfer"           icon={<Wallet          className="w-4 h-4" />}>{t.nav.transfer}</NavLink>
                    <NavLink to="/qr-generator"       icon={<QrCode          className="w-4 h-4" />}>{t.qrGenerator.title}</NavLink>
                  </>
                )}

                <LanguageToggle />
                <MessagesButton />

                {}
                <div className="relative ml-1" ref={dropdownRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-800 hover:bg-gray-100 transition-all">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.fullName}
                        className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 shadow-md" />
                    ) : (
                      <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold shadow-md">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium hidden lg:block max-w-[100px] truncate">{user.fullName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile"  onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                        <User     className="w-4 h-4 text-gray-500" /><span>{t.nav.profile}</span>
                      </Link>
                      <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-500" /><span>{t.nav.settings}</span>
                      </Link>
                      <div className="border-t border-gray-100">
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" /><span>{t.nav.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <LanguageToggle />
                <Link to="/login" className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  {t.nav.login}
                </Link>
                <Link to="/register" className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium shadow-md transition-all">
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>

          {}
          <div className="md:hidden flex items-center gap-1.5">
            {user && <MessagesButton />}
            <LanguageToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-1 bg-white border-t border-gray-100 animate-fade-in">
          {user ? (
            <>
              {}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl mb-2 flex items-center gap-3">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-md flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold flex-shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
              </div>

              {user.role === 'admin' && (
                <>
                  <MobileNavLink to="/admin/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>{t.nav.dashboard}</MobileNavLink>
                  <MobileNavLink to="/admin/users"     icon={<Users           className="w-5 h-5" />}>{t.admin.users}</MobileNavLink>
                </>
              )}
              {user.role === 'user' && (
                <>
                  <MobileNavLink to="/dashboard"    icon={<LayoutDashboard className="w-5 h-5" />}>{t.nav.dashboard}</MobileNavLink>
                  <MobileNavLink to="/store"        icon={<ShoppingBag     className="w-5 h-5" />}>{t.nav.store}</MobileNavLink>
                  <MobileNavLink to="/orders"       icon={<Package         className="w-5 h-5" />}>{t.nav.orders}</MobileNavLink>
                  <MobileNavLink to="/qr-generator" icon={<QrCode          className="w-5 h-5" />}>{t.qrGenerator.title}</MobileNavLink>
                </>
              )}
              {user.role === 'merchant' && (
                <>
                  <MobileNavLink to="/merchant/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>{t.nav.dashboard}</MobileNavLink>
                  <MobileNavLink to="/merchant/products"  icon={<Package         className="w-5 h-5" />}>{t.merchant.products}</MobileNavLink>
                  <MobileNavLink to="/merchant/orders"    icon={<ShoppingBag     className="w-5 h-5" />}>{t.merchant.orders}</MobileNavLink>
                  <MobileNavLink to="/qr-generator"       icon={<QrCode          className="w-5 h-5" />}>{t.qrGenerator.title}</MobileNavLink>
                </>
              )}
              {user.role === 'exchange' && (
                <>
                  <MobileNavLink to="/exchange/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>{t.nav.dashboard}</MobileNavLink>
                  <MobileNavLink to="/transfer"           icon={<Wallet          className="w-5 h-5" />}>{t.nav.transfer}</MobileNavLink>
                  <MobileNavLink to="/qr-generator"       icon={<QrCode          className="w-5 h-5" />}>{t.qrGenerator.title}</MobileNavLink>
                </>
              )}

              <div className="pt-2 border-t border-gray-100 space-y-1">
                <MobileNavLink to="/messages" icon={<MessageCircle className="w-5 h-5" />}>Messages</MobileNavLink>
                <MobileNavLink to="/profile"  icon={<User          className="w-5 h-5" />}>{t.nav.profile}</MobileNavLink>
                <MobileNavLink to="/settings" icon={<Settings      className="w-5 h-5" />}>{t.nav.settings}</MobileNavLink>
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" /><span>{t.nav.logout}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100">
                {t.nav.login}
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-medium text-center">
                {t.nav.register}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;