
// src/pages/admin/AdminStores.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import apiService from '../../services/api';
import { Store, Edit, Trash2, Loader, CheckCircle, X, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface StoreData {
  id: number;
  user_id: number;
  store_name: string;
  description: string;
  wallet_id: string;
  status: string;
  created_at: string;
}

const AdminStores: React.FC = () => {
  const { t } = useTranslation();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState({ storeName: '', description: '', status: 'active' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [params] = useSearchParams();
  const merchant = params.get('merchant');

  useEffect(() => { load(); }, [merchant]);

  const toast = (ok: boolean, msg: string) => {
    (ok ? setSuccess : setError)(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 2500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAdminStores();
      setStores(res.data.stores || []);
    } catch {
      setError(t.adminStores.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const filtered = stores.filter(s => {
    const searchTerm = q.toLowerCase();
    return !searchTerm || 
      s.store_name.toLowerCase().includes(searchTerm) || 
      (s.description || '').toLowerCase().includes(searchTerm) || 
      s.wallet_id.toLowerCase().includes(searchTerm);
  });

  const handleEdit = (store: StoreData) => {
    setEditing(store);
    setFormData({ 
      storeName: store.store_name, 
      description: store.description, 
      status: store.status || 'active' 
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await apiService.updateStore(editing.id, formData);
      toast(true, t.adminStores.storeUpdated);
      setEditing(null);
      await load();
    } catch {
      toast(false, t.adminStores.failedToUpdate);
    }
  };

  const handleDelete = async (storeId: number) => {
    if (!window.confirm(t.adminStores.confirmDelete)) return;
    try {
      await apiService.deleteStore(storeId);
      toast(true, t.adminStores.storeDeleted);
      await load();
    } catch {
      toast(false, t.adminStores.failedToDelete);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <Loader className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-800">{t.adminStores.title}</h1>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              className="w-full border rounded-lg pl-9 pr-3 py-2" 
              placeholder={t.adminStores.searchPlaceholder} 
            />
          </div>
        </div>

        {(success || error) && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${success ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
            {success ? <CheckCircle className="text-green-600 w-5 h-5" /> : <X className="text-red-600 w-5 h-5" />}
            <span>{success || error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
              {editing?.id === s.id ? (
                <div className="space-y-3">
                  <input 
                    value={formData.storeName} 
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="active">{t.adminStores.active}</option>
                    <option value="suspended">{t.adminStores.suspended}</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={handleSave} 
                      className="bg-emerald-600 text-white px-3 py-1 rounded"
                    >
                      {t.adminStores.save}
                    </button>
                    <button 
                      onClick={() => setEditing(null)} 
                      className="bg-slate-400 text-white px-3 py-1 rounded"
                    >
                      {t.adminStores.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-slate-800">{s.store_name}</h2>
                  <p className="text-slate-500">{s.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{t.adminStores.wallet}: {s.wallet_id}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.adminStores.status}: {s.status}</p>
                  <div className="flex justify-end gap-2 mt-3">
                    <button 
                      onClick={() => handleEdit(s)} 
                      className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <Edit size={14} /> {t.adminStores.edit}
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)} 
                      className="bg-rose-500 text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <Trash2 size={14} /> {t.adminStores.delete}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStores;