// PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useUser } from '../contexts/UserContext';
import LoadingScreen from './LoadingScreen';

/**
 * 🔥 PRIVATE ROUTE - SOLUZIONE 2B HYBRID
 * 
 * Protegge le route e verifica opzionalmente il user_type
 * Supporta accesso immediato da localStorage
 */
const PrivateRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const { userData, userType, loading: userLoading } = useUser();

  console.log('🔒 PrivateRoute check:', {
    isAuthenticated,
    authLoading,
    userLoading,
    userData: !!userData,
    userType,
    requiredUserType
  });

  // Mostra loading solo se stiamo ancora caricando E non abbiamo dati
  const effectiveUserType = userData?.user_type || userType || localStorage.getItem('user_type');
  
  if (authLoading || (userLoading && !effectiveUserType)) {
    console.log('⏳ PrivateRoute: Loading...');
    return <LoadingScreen />;
  }

  // Check autenticazione
  if (!isAuthenticated) {
    console.warn('⚠️ PrivateRoute: Not authenticated, redirect to /login');
    return <Navigate to="/login" replace />;
  }

  // Se è richiesto un user_type specifico, verificalo
  if (requiredUserType) {
    console.log('🔍 PrivateRoute: Checking user type...', {
      required: requiredUserType,
      actual: effectiveUserType
    });

    // Se non abbiamo user_type, redirect a registrazione
    if (!effectiveUserType) {
      console.warn('⚠️ PrivateRoute: No user type, redirect to /register');
      return <Navigate to="/register" replace />;
    }

    // Se user_type non corrisponde, redirect alla dashboard corretta
    if (effectiveUserType !== requiredUserType) {
      console.warn('⚠️ PrivateRoute: Wrong user type!', {
        required: requiredUserType,
        actual: effectiveUserType
      });
      
      // Redirect alla dashboard corretta per questo user type
      const correctDashboard = effectiveUserType === 'provider'
        ? '/dashboard/provider'
        : effectiveUserType === 'customer'
        ? '/dashboard/customer'
        : '/dashboard';
      
      console.log('🔄 PrivateRoute: Redirecting to correct dashboard:', correctDashboard);
      return <Navigate to={correctDashboard} replace />;
    }
  }

  console.log('✅ PrivateRoute: Access granted');
  return children;
};

export default PrivateRoute;
