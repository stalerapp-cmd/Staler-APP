
// src/pages/admin/AdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  BarChart3, Users, Store, DollarSign, Activity,
  RefreshCw, AlertCircle, Settings, Clock,
} from 'lucide-react';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  totalMerchants: number;
  totalBalance: number;
  totalTransactions: number;
}

const AdminDashboard: React.FC = () => {
  const { t }    = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [pending, setPending] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes] = await Promise.allSettled([
        apiService.getAdminStats(),
        apiService.get('/admin/pending-users'),
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value.success)
        setStats(statsRes.value.data);
      else throw new Error();
      if (pendingRes.status === 'fulfilled' && pendingRes.value.success)
        setPending(pendingRes.value.data.pendingUsers?.length || 0);
    } catch {
      setError(t.adminDashboard.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
      <p className="text-red-600 font-semibold mb-3">{error}</p>
      <button onClick={loadAll} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm">
        {t.adminDashboard.retry}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{t.adminDashboard.title}</h1>
          </div>
          <button onClick={loadAll}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> {t.adminDashboard.refresh}
          </button>
        </div>

        {}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          <StatCard icon={Users}      title={t.adminDashboard.totalUsers}    value={stats?.totalUsers || 0}                         color="from-indigo-500 to-blue-600" />
          <StatCard icon={Store}      title={t.adminDashboard.merchants}     value={stats?.totalMerchants || 0}                     color="from-purple-500 to-pink-600" />
          <StatCard icon={DollarSign} title={t.adminDashboard.totalBalance}  value={`${(stats?.totalBalance || 0).toFixed(2)} PS`}  color="from-emerald-500 to-green-600" />
          <StatCard icon={Activity}   title={t.adminDashboard.transactions}  value={stats?.totalTransactions || 0}                  color="from-amber-500 to-orange-600" />
        </div>

        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <AdminAction title={t.adminDashboard.manageUsers}   icon={Users}     color="from-blue-500 to-cyan-600"     onClick={() => navigate('/admin/users')} />
          <AdminAction title={t.adminDashboard.manageStores}  icon={Store}     color="from-purple-500 to-fuchsia-600" onClick={() => navigate('/admin/stores')} />
          <AdminAction title={t.adminDashboard.systemSettings} icon={Settings} color="from-slate-700 to-slate-900"   onClick={() => navigate('/admin/settings')} />

          {}
          <button
            onClick={() => navigate('/admin/pending-users')}
            className="relative flex flex-col items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 sm:p-6 rounded-2xl shadow hover:scale-[1.02] transition-all"
          >
            {pending > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 shadow">
                {pending > 99 ? '99+' : pending}
              </span>
            )}
            <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-sm sm:text-base font-semibold text-center leading-tight">Pending Users</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }: any) => (
  <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6 border border-slate-100">
    <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-r ${color} w-fit mb-3 shadow text-white`}>
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
    <p className="text-slate-500 text-xs sm:text-sm">{title}</p>
    <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mt-0.5">{value}</h3>
  </div>
);

const AdminAction = ({ title, icon: Icon, color, onClick }: any) => (
  <button onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r ${color} text-white p-4 sm:p-6 rounded-2xl shadow hover:scale-[1.02] transition-all`}>
    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
    <span className="text-sm sm:text-base font-semibold text-center leading-tight">{title}</span>
  </button>
);

export default AdminDashboard;