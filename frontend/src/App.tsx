

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Settings from './pages/user/Settings';
import { LanguageProvider } from './contexts/LanguageContext'; 
import Login from './pages/Registeration/Login';
import Register from './pages/Registeration/Register';
import Home from './pages/Home';
import ForgotPassword from './pages/Registeration/ForgotPassword'; 
import Dashboard from './pages/user/Dashboard';
import Store from './pages/store/Store';
import Orders from './pages/store/Orders';
import Transfer from './pages/Transfer';
import Profile from './pages/user/Profile';
import Withdraw from './pages/Withdraw';
import ProductDetail from './pages/store/ProductDetail';

import QRGenerator from './pages/QR/QRGenerator';
import QRScanner from './pages/QR/QRScanner';
import QRPayment from './pages/QR/ QRPayment';
import MerchantPayment from './pages/merchant/MerchantPayment';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import MerchantProducts from './pages/merchant/MerchantProducts';
import MerchantOrders from './pages/merchant/MerchantOrders';

import ExchangeDashboard from './pages/exchange/ExchangeDashboard';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStores from './pages/admin/AdminStores';
import UserDetails from './pages/admin/UserDetails';
import SystemSettings from './pages/admin/SystemSettings';
import Deposit from './pages/Deposit';
import CreateAdmin from './pages/admin/CreateAdmin';
import Messages from './pages/Messages'; 
import AdminPendingUsers from './pages/admin/AdminPendingUsers';



interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'merchant':
        return <Navigate to="/merchant/dashboard" replace />;
      case 'exchange':
        return <Navigate to="/exchange/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};



const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'merchant':
      return <Navigate to="/merchant/dashboard" replace />;
    case 'exchange':
      return <Navigate to="/exchange/dashboard" replace />;
    case 'user':
    default:
      return <Navigate to="/dashboard" replace />;
  }
};


function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />

      <Route 
        path="/login" 
        element={!user ? <Login /> : <RoleBasedRedirect />} 
      />
      <Route 
        path="/register" 
        element={!user ? <Register /> : <RoleBasedRedirect />} 
      />
<Route 
  path="/forgot-password" 
  element={!user ? <ForgotPassword /> : <RoleBasedRedirect />} 
/>
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={<Settings />} />
<Route path="/messages" element={<Messages />} />

      <Route
        path="/transfer"
        element={
          <ProtectedRoute>
            <Transfer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/withdraw"
        element={
          <ProtectedRoute>
            <Withdraw />
          </ProtectedRoute>
        }
      />

      <Route
        path="/qr-generator"
        element={
          <ProtectedRoute>
            <QRGenerator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr-scanner"
        element={
          <ProtectedRoute>
            <QRScanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr-payment"
        element={
          <ProtectedRoute>
            <QRPayment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant-payment"
        element={
          <ProtectedRoute>
            <MerchantPayment />
          </ProtectedRoute>
        }
      />
    
<Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
    
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    <Route path="/store" element={<Store />} />

      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Orders />
          </ProtectedRoute>
        }
      />

   
      <Route
        path="/merchant/dashboard"
        element={
          <ProtectedRoute allowedRoles={['merchant']}>
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/products"
        element={
          <ProtectedRoute allowedRoles={['merchant']}>
            <MerchantProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/orders"
        element={
          <ProtectedRoute allowedRoles={['merchant']}>
            <MerchantOrders />
          </ProtectedRoute>
        }
      />

      
      <Route
        path="/exchange/dashboard"
        element={
          <ProtectedRoute allowedRoles={['exchange']}>
            <ExchangeDashboard />
          </ProtectedRoute>
        }
      />
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminUsers />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/users/:id"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <UserDetails />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/stores"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminStores />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/settings"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <SystemSettings />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/pending-users"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminPendingUsers />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/create-admin"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <CreateAdmin />
    </ProtectedRoute>
  }
/>

<Route path="/product/:productId" element={<ProductDetail />} />

<Route path="/admin/create-admin" element={<CreateAdmin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


function App() {
  return (
    <Router>
      <AuthProvider>
       
        <LanguageProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <AppRoutes />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;