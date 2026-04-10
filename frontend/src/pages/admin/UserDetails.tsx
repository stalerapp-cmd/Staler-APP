

// src/pages/admin/UserDetails.tsx

import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation'; 
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Save, Lock } from 'lucide-react';

interface UserData {
 id: string;
   full_name: string;
  email: string;
  role: string;
  wallet_id: string;
  balance: number;
}

const UserDetails: React.FC = () => {
  const { t } = useTranslation(); 
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', role: '' });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { load(); }, [id]);

 const load = async () => {
  try {
    setLoading(true);
    const res = await apiService.getUserById(id!);
    
    console.log('✅ User data received:', res);
    
    if (!res.data.success) {
      setError(t.userDetails.failedToLoad);
      return;
    }
    
    const userData = res.data.data;
    
    if (!userData) {
      setError(t.userDetails.failedToLoad);
      return;
    }
    
    setUser(userData);
    setForm({
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role
    });
  } catch (err: any) {
    console.error('❌ Load user error:', err);
    setError(t.userDetails.failedToLoad);
  } finally {
    setLoading(false);
  }
};

  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;
  
  try {
    setSaving(true);
    
    const res = await apiService.updateUser(id!, {
      fullName: form.full_name,
      email: form.email,
      role: form.role,
    });
    
    if (res.success) {
      setSuccess(t.userDetails.userDetailsUpdated);
      await load(); 
    } else {
      setError(t.userDetails.failedToUpdate);
    }
  } catch (err: any) {
    console.error('❌ Update error:', err);
    setError(err.response?.data?.message || t.userDetails.failedToUpdate);
  } finally {
    setSaving(false);
    setTimeout(() => setSuccess(''), 2500);
  }
};
const handleChangePassword = async () => {
  if (!newPassword) return alert(t.userDetails.enterNewPassword);
  
  try {
    console.log('🔐 Changing password for user:', id); 
    
    const res = await apiService.resetUserPassword(id!, newPassword);
    
    console.log('✅ Password change response:', res); 
    
    if (res.data.success) {
      setSuccess(t.userDetails.passwordChanged);
    } else {
      setError(t.userDetails.failedToChangePassword);
    }
    
    setNewPassword('');
    setTimeout(() => { 
      setSuccess('');   
      setError('');    
    }, 2500);
  } catch (err: any) {  
    console.error('❌ Password change error:', err);  
    setError(t.userDetails.failedToChangePassword);
  }
};

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <Loader className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  if (error && !user) return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center">
      <AlertCircle className="text-red-600 w-10 h-10 mb-3" />
      <p className="text-red-600">{error}</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-emerald-600 hover:underline">
          <ArrowLeft size={18} /> {t.common.back}
        </button>

        <h1 className="text-2xl font-bold text-slate-800">{t.userDetails.title}</h1>

        {(success || error) && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${success ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
            {success ? <CheckCircle className="text-green-600 w-5 h-5" /> : <AlertCircle className="text-red-600 w-5 h-5" />}
            <span>{success || error}</span>
          </div>
        )}

        {}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">{t.userDetails.fullName}</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">{t.userDetails.email}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">{t.userDetails.role}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="user">{t.userDetails.userRole}</option>
              <option value="merchant">{t.userDetails.merchantRole}</option>
              <option value="exchange">{t.userDetails.exchangeRole}</option>
              <option value="admin">{t.userDetails.adminRole}</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              <Save className="w-4 h-4" /> {saving ? t.userDetails.saving : t.userDetails.saveChanges}
            </button>
          </div>
        </form>

        {}
        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-semibold text-slate-700 mb-2">{t.userDetails.changePassword}</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="password"
              placeholder={t.userDetails.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full sm:w-2/3"
            />
            <button
              onClick={handleChangePassword}
              className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              <Lock className="w-4 h-4" /> {t.userDetails.change}
            </button>
          </div>
        </div>

        {}
        <div className="pt-4 border-t text-sm text-slate-600">
          <p><strong>{t.userDetails.wallet}:</strong> {user.wallet_id}</p>
          <p><strong>{t.userDetails.balance}:</strong> {user.balance} PS</p>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;