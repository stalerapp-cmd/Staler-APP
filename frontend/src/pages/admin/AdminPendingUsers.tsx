// src/pages/admin/AdminPendingUsers.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import {
  Clock, Trash2, RefreshCw, AlertCircle, CheckCircle, X,
  Shield, Copy, ChevronDown, ChevronUp, Search,
  ArrowLeft, Loader, Edit2, Save, XCircle, Timer,
} from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  verification_method: string;
  verification_code: string;
  code_expires_at: string;
  created_at: string;
  expires_at: string;
}

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const styles = { success: 'bg-emerald-500', error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' };
  const icons  = {
    success: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
    error:   <XCircle     className="w-4 h-4 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 flex-shrink-0" />,
    info:    <AlertCircle className="w-4 h-4 flex-shrink-0" />,
  };
  return (
    <div className={`fixed top-4 right-4 z-[9999] ${styles[type]} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium max-w-xs`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 p-0.5 rounded flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
};

const ConfirmModal: React.FC<{
  message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}> = ({ message, onConfirm, onCancel, danger = true }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
        <AlertCircle className={`w-6 h-6 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
      </div>
      <p className="text-gray-700 text-center text-sm mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const EditModal: React.FC<{
  user: PendingUser;
  onSave: (id: string, data: { email: string; full_name: string; role: string }) => Promise<void>;
  onClose: () => void;
}> = ({ user, onSave, onClose }) => {
  const [email,    setEmail]    = useState(user.email);
  const [fullName, setFullName] = useState(user.full_name);
  const [role,     setRole]     = useState(user.role);
  const [saving,   setSaving]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(user.id, { email, full_name: fullName, role }); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-base">Edit Pending Registration</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="user">User</option>
              <option value="merchant">Merchant</option>
              <option value="exchange">Exchange</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPendingUsers: React.FC = () => {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  const [users,    setUsers]    = useState<PendingUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<'all' | 'active' | 'expired'>('all');
  const [toast,    setToast]    = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [confirm,  setConfirm]  = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [editing,  setEditing]  = useState<PendingUser | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') =>
    setToast({ message, type });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPendingUsers();
      if (res.success) setUsers(res.data.pendingUsers || []);
    } catch { showToast('Failed to load pending users', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const isExpired     = (u: PendingUser) => new Date(u.expires_at)      < new Date();
  const isCodeExpired = (u: PendingUser) => new Date(u.code_expires_at) < new Date();

  const filteredUsers = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.full_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all'     ? true :
                        filter === 'expired' ? isExpired(u) : !isExpired(u);
    return matchSearch && matchFilter;
  });

  const expiredCount = users.filter(isExpired).length;
  const activeCount  = users.filter(u => !isExpired(u)).length;

  const handleDelete = (user: PendingUser) => {
    setConfirm({
      message: `${t.adminPending.deleteConfirm}\n\n${user.full_name} (${user.email})`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await apiService.deletePendingUser(user.id);
          setUsers(prev => prev.filter(u => u.id !== user.id));
          showToast('Deleted successfully', 'success');
        } catch { showToast('Failed to delete', 'error'); }
      },
    });
  };

  const handleClearExpired = () => {
    setConfirm({
      message: `${t.adminPending.deleteAllConfirm} (${expiredCount} records)`,
      onConfirm: async () => {
        setConfirm(null);
        setClearing(true);
        try {
          const res = await apiService.clearExpiredPending();
          showToast(`Cleared ${res.data?.deleted || expiredCount} expired records`, 'success');
          load();
        } catch { showToast('Failed to clear', 'error'); }
        finally { setClearing(false); }
      },
    });
  };

  const handleSaveEdit = async (id: string, data: { email: string; full_name: string; role: string }) => {
    await apiService.updatePendingUser(id, data);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    showToast('Updated successfully', 'success');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    showToast('Code copied!', 'info');
  };

  const roleColors: Record<string, string> = {
    user:     'bg-gray-100 text-gray-700',
    merchant: 'bg-emerald-100 text-emerald-700',
    exchange: 'bg-violet-100 text-violet-700',
    admin:    'bg-blue-100 text-blue-700',
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  const timeUntil = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 sm:py-8 px-3 sm:px-4 lg:px-6">
      {toast   && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      {editing && <EditModal user={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />}

      <div className="max-w-6xl mx-auto">

        {}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/dashboard')}
              className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50 border border-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{t.adminPending.title}</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{t.adminPending.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {expiredCount > 0 && (
              <button onClick={handleClearExpired} disabled={clearing}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors">
                {clearing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {t.adminPending.clearExpired} ({expiredCount})
              </button>
            )}
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {[
            { label: t.adminPending.totalPending, value: users.length, color: 'from-blue-500 to-indigo-600',  icon: Clock },
            { label: 'Active',                   value: activeCount,   color: 'from-emerald-500 to-teal-600', icon: CheckCircle },
            { label: t.adminPending.expiredSoon, value: expiredCount,  color: 'from-red-500 to-rose-600',     icon: Timer },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 sm:mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'expired'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors capitalize ${
                    filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t.adminPending.noRecords}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => {
              const expired     = isExpired(user);
              const codeExpired = isCodeExpired(user);
              const isOpen      = expanded === user.id;

              return (
                <div key={user.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-all overflow-hidden ${
                    expired ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                  }`}>

                  <div className="flex items-center gap-3 p-4">
                    {}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm ${
                      expired ? 'bg-red-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleColors[user.role] || roleColors.user}`}>
                          {user.role}
                        </span>
                        {expired && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600 flex-shrink-0">
                            {t.adminPending.expired}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.adminPending.expires}:{' '}
                        <span className={expired ? 'text-red-500 font-medium' : 'text-gray-600'}>
                          {expired ? 'Expired' : timeUntil(user.expires_at)}
                        </span>
                      </p>
                    </div>

                    {}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setEditing(user)}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(user)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setExpanded(isOpen ? null : user.id)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {}
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">Verification Code</p>
                        <div className="flex items-center gap-2">
                          <code className={`text-sm font-mono font-bold ${codeExpired ? 'text-red-400 line-through' : 'text-gray-800'}`}>
                            {user.verification_code}
                          </code>
                          {!codeExpired && (
                            <button onClick={() => copyCode(user.verification_code)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          )}
                          {codeExpired && <span className="text-xs text-red-400">expired</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Code expires: {fmtDate(user.code_expires_at)}</p>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Details</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">Method: {user.verification_method || 'email'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">Created: {fmtDate(user.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Timer className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className={`text-xs ${expired ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                              Expires: {fmtDate(user.expires_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
};

export default AdminPendingUsers;