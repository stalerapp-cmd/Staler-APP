
// src/pages/admin/AdminUsers.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import { Users, UserPlus, AlertCircle, CheckCircle, X, Loader, Search, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface UserData {
  id: string;
  wallet_id: string;
  full_name: string;
  email: string;
  role: string;
  balance: number;
}

const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log('=== AdminUsers Debug ===');
  console.log('🔍 Current user:', user);
  console.log('🔍 user.adminLevel:', user?.adminLevel);
  console.log('🔍 user.role:', user?.role);
  console.log('🔍 Should show Create Admin?', user?.adminLevel === 'super_admin');
  console.log('========================');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [filtered, setFiltered] = useState<UserData[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | 'user' | 'merchant' | 'admin' | 'exchange'>('all');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'user' });

  useEffect(() => { load(); }, []);
  
  useEffect(() => {
    let data = [...users];
    if (role !== 'all') data = data.filter(u => u.role === role);
    if (q.trim()) {
      const s = q.toLowerCase();
      data = data.filter(u =>
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.wallet_id.toLowerCase().includes(s)
      );
    }
    setFiltered(data);
  }, [users, q, role]);

  const toast = (ok: boolean, msg: string) => {
    (ok ? setSuccess : setError)(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllUsers();
      if (res.success) { 
        setUsers(res.data.users); 
        setFiltered(res.data.users); 
      }
    } catch { 
      toast(false, t.adminUsers.failedToLoad); 
    } finally { 
      setLoading(false); 
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      
      const res = await apiService.createVerifiedUser({
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      
      if (res.success) {
        toast(true, t.adminUsers.userCreated);
        setShowCreate(false);
        setNewUser({ fullName: '', email: '', password: '', role: 'user' });
        await load();
      } else {
        toast(false, res.message || t.adminUsers.failedToCreate);
      }
    } catch (e: any) {
      toast(false, e?.response?.data?.message || t.adminUsers.failedToCreate);
    } finally { 
      setFormLoading(false); 
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    try {
      await apiService.changeUserRole(id, newRole);
      toast(true, t.adminUsers.roleUpdated);
      await load();
    } catch { 
      toast(false, t.adminUsers.failedToUpdateRole); 
    }
  };

  const del = async (id: string) => {
    if (!window.confirm(t.adminUsers.confirmDelete)) return;
    try {
      await apiService.deleteUser(id);
      toast(true, t.adminUsers.userDeleted);
      await load();
    } catch { 
      toast(false, t.adminUsers.failedToDelete); 
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <Loader className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 rounded-xl shadow">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{t.adminUsers.title}</h1>
              <p className="text-sm text-slate-500">{t.adminUsers.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-3">
  {user?.adminLevel === 'super_admin' && (
    <button 
      onClick={() => {
        console.log('✅ Create Admin button clicked!');
        navigate('/admin/create-admin');
      }} 
      className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow transition-all"
    >
      <Shield className="w-4 h-4" /> Create Admin
    </button>
  )}
  
  <button 
    onClick={() => setShowCreate(true)} 
    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow transition-all"
  >
    <UserPlus className="w-4 h-4" /> {t.adminUsers.addUser}
  </button>
</div>
        </div>

        {(error || success) && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${success ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
            {success ? <CheckCircle className="text-green-600 w-5 h-5" /> : <AlertCircle className="text-red-600 w-5 h-5" />}
            <span>{success || error}</span>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder={t.adminUsers.searchPlaceholder}
              className="w-full border rounded-lg pl-9 pr-3 py-2" 
            />
          </div>
          {(['all','user','merchant','admin','exchange'] as const).map(r => (
            <button 
              key={r} 
              onClick={() => setRole(r)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${role===r ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              {r === 'all' ? t.adminUsers.all.toUpperCase() : r.toUpperCase()}
            </button>
          ))}
        </div>

        {}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">{t.adminUsers.name}</th>
                <th className="px-4 py-3 text-left">{t.adminUsers.email}</th>
                <th className="px-4 py-3 text-center">{t.adminUsers.role}</th>
                <th className="px-4 py-3 text-center">{t.adminUsers.balance}</th>
                <th className="px-4 py-3 text-center">{t.adminUsers.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="text-center">{u.role}</td>
                  <td className="text-center text-emerald-600 font-semibold">{u.balance} PS</td>
                  <td className="px-4 py-3 flex gap-2 justify-center flex-wrap">
                    <button 
                      onClick={() => navigate(`/admin/users/${u.id}`)} 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      {t.adminUsers.details}
                    </button>
                    
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => changeRole(u.id, 'admin')} 
                        className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        {t.adminUsers.promote}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => del(u.id)} 
                      className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      {t.adminUsers.delete}
                    </button>
                    
                    {u.role === 'merchant' && (
                      <button 
                        onClick={() => navigate(`/admin/stores?merchant=${u.id}`)} 
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        {t.adminUsers.store}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{t.adminUsers.createNewUser}</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-slate-500 hover:text-slate-700" />
              </button>
            </div>
            <form onSubmit={createUser} className="p-6 space-y-4">
              <input 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" 
                placeholder={t.adminUsers.fullName}
                required 
                value={newUser.fullName} 
                onChange={(e) => setNewUser(s => ({ ...s, fullName: e.target.value }))} 
              />
              <input 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" 
                type="email" 
                placeholder={t.adminUsers.email}
                required 
                value={newUser.email} 
                onChange={(e) => setNewUser(s => ({ ...s, email: e.target.value }))} 
              />
              <input 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" 
                type="password" 
                placeholder={t.adminUsers.password}
                required 
                value={newUser.password} 
                onChange={(e) => setNewUser(s => ({ ...s, password: e.target.value }))} 
              />
              <select 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" 
                value={newUser.role} 
                onChange={(e) => setNewUser(s => ({ ...s, role: e.target.value }))}
              >
                <option value="user">{t.userDetails.userRole}</option>
                <option value="merchant">{t.userDetails.merchantRole}</option>
                <option value="exchange">{t.userDetails.exchangeRole}</option>
              </select>
              {}
{user?.adminLevel === 'super_admin' && (
  <button
    type="button"
    onClick={() => {
      setShowCreate(false);
      navigate('/admin/create-admin');
    }}
    className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-lg font-semibold hover:shadow flex items-center justify-center gap-2 transition-all"
  >
    <Shield className="w-5 h-5" />
    Create Admin User Instead
  </button>
)}

{}
{user?.adminLevel !== 'super_admin' && (
  <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
    <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-gray-600">
      Only Super Admins can create admin users
    </p>
  </div>
)}
              
              <button 
                type="submit" 
                disabled={formLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg font-semibold hover:shadow disabled:opacity-50 transition-all"
              >
                {formLoading ? t.adminUsers.creating : t.adminUsers.createUser}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;