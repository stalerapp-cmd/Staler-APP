

// src/pages/admin/SystemSettings.tsx

import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation'; 
import apiService from '../../services/api';
import { Settings, Loader, CheckCircle, X } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ 
    siteName: 'S-Taler', 
    currency: 'PS', 
    bankUrl: '', 
    theme: 'emerald' 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminSettings();
      if (res.success) setForm(prev => ({ ...prev, ...res.data }));
    } catch {
      setError(t.systemSettings.failedToLoad);
    } finally { 
      setLoading(false); 
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiService.updateAdminSettings(form);
      if (res.success) setSuccess(t.systemSettings.settingsSaved);
      else setError(t.systemSettings.failedToSave);
      setTimeout(() => { setSuccess(''); setError(''); }, 2500);
    } catch { 
      setError(t.systemSettings.failedToSave); 
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6 border border-slate-100">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-800">{t.systemSettings.title}</h1>
        </div>

        {(success || error) && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${success ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
            {success ? <CheckCircle className="text-green-600 w-5 h-5" /> : <X className="text-red-600 w-5 h-5" />}
            <span>{success || error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={save}>
          <div>
            <label className="text-sm text-slate-600">{t.systemSettings.siteName}</label>
            <input 
              className="w-full border rounded-lg px-3 py-2" 
              value={form.siteName} 
              onChange={(e) => setForm({ ...form, siteName: e.target.value })} 
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">{t.systemSettings.currencyCode}</label>
            <input 
              className="w-full border rounded-lg px-3 py-2" 
              value={form.currency} 
              onChange={(e) => setForm({ ...form, currency: e.target.value })} 
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">{t.systemSettings.bankUrl}</label>
            <input 
              className="w-full border rounded-lg px-3 py-2" 
              value={form.bankUrl} 
              onChange={(e) => setForm({ ...form, bankUrl: e.target.value })} 
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">{t.systemSettings.theme}</label>
            <select 
              className="w-full border rounded-lg px-3 py-2" 
              value={form.theme} 
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
            >
              <option value="emerald">{t.systemSettings.emerald}</option>
              <option value="indigo">{t.systemSettings.indigo}</option>
              <option value="rose">{t.systemSettings.rose}</option>
              <option value="slate">{t.systemSettings.slate}</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button 
              disabled={saving} 
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              {saving ? t.systemSettings.saving : t.systemSettings.saveSettings}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;