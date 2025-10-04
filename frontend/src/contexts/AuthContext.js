// 🔐 Auth Context - Context API semplificato per autenticazione
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    console.log('🔄 AuthContext: Initializing...');
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(() => {
    try {
      // Carica dati utente da localStorage
      const userData = AuthService.getUserData();
      const isAuth = AuthService.isAuthenticated();

      console.log('📊 Auth Status:', {
        isAuthenticated: isAuth,
        hasUserData: !!userData,
        userType: userData?.user_type,
      });

      if (isAuth && userData) {
        setUser(userData);
        
        // Fetch aggiornamento dati in background
        fetchCurrentUser();
      }
    } catch (err) {
      console.error('❌ Error initializing auth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== AUTH OPERATIONS ====================

  /**
   * Fetch dati utente corrente dal server
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const result = await AuthService.getCurrentUser();
      
      if (result.success) {
        setUser(result.user);
        setError(null);
        console.log('✅ User data updated');
      } else {
        console.warn('⚠️ Failed to fetch user data:', result.error);
      }
    } catch (err) {
      console.error('❌ Error fetching user:', err);
      // Non fare logout automatico, mantieni dati cached
    }
  }, []);

  /**
   * Registrazione
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const result = await AuthService.register(userData);

      if (result.success) {
        setUser(result.user);
        console.log('✅ Registration successful');
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore durante la registrazione';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await AuthService.login(email, password);

      if (result.success) {
        setUser(result.user);
        console.log('✅ Login successful');
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore durante il login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
      setError(null);
      console.log('✅ Logout successful');
      return { success: true };
    } catch (err) {
      console.error('❌ Logout error:', err);
      // Forza logout locale comunque
      setUser(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aggiorna profilo
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);

      const result = await AuthService.updateProfile(updates);

      if (result.success) {
        setUser(result.user);
        console.log('✅ Profile updated');
        return { success: true, user: result.user };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore aggiornamento profilo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cambia password
   */
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const result = await AuthService.changePassword(oldPassword, newPassword);

      if (result.success) {
        console.log('✅ Password changed');
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err.message || 'Errore cambio password';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== COMPUTED VALUES ====================

  const value = {
    // State
    user,
    loading,
    error,
    
    // Computed
    isAuthenticated: !!user,
    userType: user?.user_type || null,
    isCustomer: user?.user_type === 'customer',
    isProvider: user?.user_type === 'provider',
    isAdmin: user?.user_type === 'admin',
    
    // Operations
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    fetchCurrentUser,
    
    // Utility
    clearError: () => setError(null),
  };

  // Debug logging
  useEffect(() => {
    console.log('📊 AuthContext State:', {
      isAuthenticated: value.isAuthenticated,
      userType: value.userType,
      loading,
      error,
      user: user ? {
        email: user.email,
        user_type: user.user_type,
        _id: user._id,
      } : null,
    });
  }, [user, loading, error, value.isAuthenticated, value.userType]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
