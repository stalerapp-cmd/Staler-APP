

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { User } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
  walletId: string;
  fullName: string;
  email: string;
  password: string;
  role?: string;

  phoneNumber?: string;
  verificationMethod?: 'email' ;
}) => Promise<void>;

  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

 const login = async (email: string, password: string) => {
  const loginRes = await apiService.login(email, password);

  const rawUser = loginRes.data.user;
  const token = loginRes.data.token;

  if (!rawUser || !token) {
    throw new Error('Invalid login response');
  }

  localStorage.setItem('token', token);
  setToken(token);

  const walletRes = await apiService.getWallet();

  const walletId = walletRes?.data?.wallet?.walletId;

  if (!walletId) {
    throw new Error('Wallet not found');
  }

  const mappedUser: User = {
    id: rawUser.id,
    walletId: walletId, 
    fullName: rawUser.full_name,
    email: rawUser.email,
    role: rawUser.role,
      adminLevel: rawUser.admin_level || null, 

    profileImage: rawUser.profile_image || undefined,
      emailVerified: rawUser.email_verified ?? false,
  phoneNumber: rawUser.phone_number || null,
  phoneVerified: rawUser.phone_verified ?? false,
  verificationMethod: rawUser.verification_method || 'email',
  };

  setUser(mappedUser);
  localStorage.setItem('user', JSON.stringify(mappedUser));
};



  const register = async (data: {
  walletId: string;
  fullName: string;
  email: string;
  password: string;
  role?: string;
  phoneNumber?: string;
  verificationMethod?: 'email' ;
}) => {
  const response = await apiService.register(data);
  if (!response.success) {
    throw new Error(response.message || 'Registration failed');
  }
};

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
  try {
    const profileRes = await apiService.getProfile();
    const rawUser = profileRes?.data?.data?.user;

    if (!rawUser) return;

    const walletRes = await apiService.getWallet();
    const walletId = walletRes?.data?.wallet?.walletId;

    if (!walletId) return;

    const updatedUser: User = {
      id: rawUser.id,
      walletId: walletId,
      fullName: rawUser.full_name,
      email: rawUser.email,
      role: rawUser.role,
      adminLevel: rawUser.admin_level || null,  
      profileImage: rawUser.profile_image || undefined,
      emailVerified: rawUser.email_verified ?? false,
      phoneNumber: rawUser.phone_number || null,
      phoneVerified: rawUser.phone_verified ?? false,
      verificationMethod: rawUser.verification_method || 'email',
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  } catch (err) {
    console.error('Failed to refresh user:', err);
  }
};

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
