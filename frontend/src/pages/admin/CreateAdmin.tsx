// src/pages/admin/CreateAdmin.tsx

import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Shield, UserPlus, Loader, CheckCircle, X } from 'lucide-react';
import apiService from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CreateAdmin: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    fullName: string;
    adminLevel: 'admin' | 'super_admin';
  }>({
    email: '',
    password: '',
    fullName: '',
    adminLevel: 'admin',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.createAdminUser(formData);
      
      if (response.success) {
        setSuccess('✅ Admin created successfully!');
        setFormData({ email: '', password: '', fullName: '', adminLevel: 'admin' });
        
        setTimeout(() => {
          navigate('/admin/users');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">
              {}
              Create Admin User
            </h1>
          </div>

          {(success || error) && (
            <div className={`p-3 rounded-lg border flex items-center gap-2 mb-6 ${
              success ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'
            }`}>
              {success ? (
                <CheckCircle className="text-green-600 w-5 h-5" />
              ) : (
                <X className="text-red-600 w-5 h-5" />
              )}
              <span>{success || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Level
              </label>
              <select
                value={formData.adminLevel}
                onChange={(e) => setFormData({
                  ...formData, 
                  adminLevel: e.target.value as 'admin' | 'super_admin'  
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Regular Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Regular Admin:</strong> View and edit users, manage stores<br />
                <strong>Super Admin:</strong> Full control (create/delete admins, system settings)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Admin
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;