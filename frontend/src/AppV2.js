// 🚀 App.js - Versione Ristrutturata
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Landing from './pages/Landing';
import LoginV2 from './pages/LoginV2';
import RegisterV2 from './pages/RegisterV2';
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';

// Components
import PrivateRouteV2 from './components/PrivateRouteV2';
import LoadingScreen from './components/LoadingScreen';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#9face6',
      dark: '#5568d3',
    },
    secondary: {
      main: '#764ba2',
      light: '#9b6ec5',
      dark: '#5c3a7d',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Component per redirect dashboard basato su user type
const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect basato su user_type
  switch (user.user_type) {
    case 'customer':
      return <Navigate to="/dashboard/customer" replace />;
    case 'provider':
      return <Navigate to="/dashboard/provider" replace />;
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginV2 />} />
            <Route path="/register" element={<RegisterV2 />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard/customer"
              element={
                <PrivateRouteV2 requiredUserType="customer">
                  <CustomerDashboard />
                </PrivateRouteV2>
              }
            />
            <Route
              path="/dashboard/provider"
              element={
                <PrivateRouteV2 requiredUserType="provider">
                  <ProviderDashboard />
                </PrivateRouteV2>
              }
            />

            {/* Dashboard redirect basato su user type */}
            <Route
              path="/dashboard"
              element={
                <PrivateRouteV2>
                  <DashboardRedirect />
                </PrivateRouteV2>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#4caf50',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f44336',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
