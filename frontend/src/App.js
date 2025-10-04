import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import itLocale from 'date-fns/locale/it';

// Components
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Chat from './components/Chat';
import PrivateRoute from './components/PrivateRoute';
import LoadingScreen from './components/LoadingScreen';

// Contexts
import { UserProvider, useUser } from './contexts/UserContext';
import { ChatProvider } from './contexts/ChatContext';

// Auth0 Config
const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN || 'your-domain.auth0.com';
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || 'your-client-id';
const AUTH0_REDIRECT_URI = process.env.REACT_APP_AUTH0_REDIRECT_URI || window.location.origin;
const AUTH0_AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE || 'https://api.commit.it';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1e40af',
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#5b21b6',
    },
    success: {
      main: '#10b981',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Auth0 Provider
function Auth0ProviderWithHistory({ children }) {
  const onRedirectCallback = (appState) => {
    window.history.replaceState(
      {},
      document.title,
      appState?.returnTo || window.location.pathname
    );
  };

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      redirectUri={AUTH0_REDIRECT_URI}
      audience={AUTH0_AUDIENCE}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}

/**
 * 🔥 DASHBOARD ROUTER - SOLUZIONE 2B HYBRID
 * 
 * Legge da localStorage per accesso immediato
 * UserContext verifica in background con API
 * Auto-correzione se i dati cambiano
 */
function DashboardRouter() {
  const { userData, userType, loading, isAuthenticated } = useUser();

  console.log('🔍 DashboardRouter check:', { 
    userData: !!userData, 
    userType, 
    loading, 
    isAuthenticated 
  });

  // Mostra loading solo se stiamo caricando E non abbiamo dati cached
  if (loading && !userData && !userType) {
    console.log('⏳ DashboardRouter: Loading...');
    return <LoadingScreen />;
  }

  // Determina user type da userData o localStorage
  const effectiveUserType = userData?.user_type || userType || localStorage.getItem('user_type');

  console.log('🎯 DashboardRouter: effectiveUserType =', effectiveUserType);

  // Se non autenticato, vai al login
  if (!isAuthenticated) {
    console.warn('⚠️ DashboardRouter: Not authenticated, redirect to /login');
    return <Navigate to="/login" replace />;
  }

  // Se non ci sono dati utente E non è in localStorage, vai a registrazione
  if (!effectiveUserType) {
    console.warn('⚠️ DashboardRouter: No user type found, redirect to /register');
    return <Navigate to="/register" replace />;
  }

  // Redirect basato sul tipo di utente
  if (effectiveUserType === 'provider') {
    console.log('✅ DashboardRouter: Redirect to /dashboard/provider');
    return <Navigate to="/dashboard/provider" replace />;
  } else if (effectiveUserType === 'customer') {
    console.log('✅ DashboardRouter: Redirect to /dashboard/customer');
    return <Navigate to="/dashboard/customer" replace />;
  } else if (effectiveUserType === 'admin') {
    console.log('✅ DashboardRouter: Redirect to /dashboard/admin (if exists)');
    return <Navigate to="/dashboard/admin" replace />;
  } else {
    console.warn('⚠️ DashboardRouter: Unknown user type:', effectiveUserType);
    return <Navigate to="/register" replace />;
  }
}

// App Content
function AppContent() {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 
        🔥 MODIFICA PRINCIPALE: Route separate per Customer e Provider 
        Questo permette un accesso diretto senza passare per DashboardRouter
      */}
      {/* 
        🔥 ROUTE DIRETTE CON CONTROLLO USER TYPE
        Accesso diretto senza passare per DashboardRouter
      */}
      <Route
        path="/dashboard/customer"
        element={
          <PrivateRoute requiredUserType="customer">
            <CustomerDashboard />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/dashboard/provider"
        element={
          <PrivateRoute requiredUserType="provider">
            <ProviderDashboard />
          </PrivateRoute>
        }
      />
      
      {/* 
        Route /dashboard generica per backward compatibility
        Reindirizza automaticamente alla dashboard corretta
      */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardRouter />
          </PrivateRoute>
        }
      />
      
      {/* Chat Route */}
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <Auth0ProviderWithHistory>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
            <UserProvider>
              <ChatProvider>
                <CssBaseline />
                <Toaster position="top-center" />
                <Router>
                  <AppContent />
                </Router>
              </ChatProvider>
            </UserProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Auth0ProviderWithHistory>
  );
}

export default App;
