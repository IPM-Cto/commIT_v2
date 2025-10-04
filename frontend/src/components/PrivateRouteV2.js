// 🔒 PrivateRoute - Component per route protette
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const PrivateRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, user, userType, loading } = useAuth();

  console.log('🔒 PrivateRoute check:', {
    isAuthenticated,
    userType,
    requiredUserType,
    loading,
  });

  // Mostra loading mentre verifica auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Non autenticato -> redirect a login
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Autenticato ma richiede tipo specifico
  if (requiredUserType && userType !== requiredUserType) {
    console.log(`❌ Wrong user type. Required: ${requiredUserType}, Got: ${userType}`);
    
    // Redirect al dashboard corretto
    if (userType === 'customer') {
      return <Navigate to="/dashboard/customer" replace />;
    } else if (userType === 'provider') {
      return <Navigate to="/dashboard/provider" replace />;
    } else if (userType === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  // Tutto ok, mostra il componente
  console.log('✅ Access granted');
  return children;
};

export default PrivateRoute;
