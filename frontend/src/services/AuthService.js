// 🔐 AuthService - Servizio centralizzato per autenticazione
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v2';

// Axios instance con configurazione
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor per aggiungere token
api.interceptors.request.use(
  (config) => {
    const token = AuthService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor per gestire errori e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e non è già un retry, prova refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = AuthService.getRefreshToken();
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          // Salva nuovo access token
          AuthService.setAccessToken(data.access_token);

          // Riprova richiesta originale
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh fallito, logout
        AuthService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

class AuthService {
  // ==================== TOKEN MANAGEMENT ====================

  static getAccessToken() {
    return localStorage.getItem('access_token');
  }

  static setAccessToken(token) {
    localStorage.setItem('access_token', token);
  }

  static getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  static setRefreshToken(token) {
    localStorage.setItem('refresh_token', token);
  }

  static removeTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // ==================== USER DATA ====================

  static getUserData() {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }

  static setUserData(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  static removeUserData() {
    localStorage.removeItem('user_data');
  }

  // ==================== AUTH OPERATIONS ====================

  /**
   * Registrazione nuovo utente
   */
  static async register(userData) {
    try {
      console.log('📝 Registrazione utente:', userData.email);

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        const { user, tokens } = response.data;

        // Salva tokens e user data
        this.setAccessToken(tokens.access_token);
        this.setRefreshToken(tokens.refresh_token);
        this.setUserData(user);

        console.log('✅ Registrazione successful');

        return { success: true, user, tokens };
      }

      return { success: false, error: 'Registrazione fallita' };
    } catch (error) {
      console.error('❌ Errore registrazione:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Login utente
   */
  static async login(email, password) {
    try {
      console.log('🔑 Login utente:', email);

      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, tokens } = response.data;

        // Salva tokens e user data
        this.setAccessToken(tokens.access_token);
        this.setRefreshToken(tokens.refresh_token);
        this.setUserData(user);

        console.log('✅ Login successful');

        return { success: true, user, tokens };
      }

      return { success: false, error: 'Login fallito' };
    } catch (error) {
      console.error('❌ Errore login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Email o password errati',
      };
    }
  }

  /**
   * Logout utente
   */
  static async logout() {
    try {
      console.log('🚪 Logout utente');

      // Chiama endpoint logout (opzionale con JWT stateless)
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // Ignora errori, continua con logout locale
      }

      // Rimuovi tutto dal localStorage
      this.removeTokens();
      this.removeUserData();

      console.log('✅ Logout successful');

      return { success: true };
    } catch (error) {
      console.error('❌ Errore logout:', error);
      // Rimuovi comunque i dati locali
      this.removeTokens();
      this.removeUserData();
      return { success: false, error: error.message };
    }
  }

  /**
   * Ottieni dati utente corrente dal server
   */
  static async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.success) {
        const user = response.data.user;

        // Aggiorna localStorage
        this.setUserData(user);

        return { success: true, user };
      }

      return { success: false, error: 'Utente non trovato' };
    } catch (error) {
      console.error('❌ Errore get current user:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Aggiorna profilo utente
   */
  static async updateProfile(updates) {
    try {
      console.log('✏️ Aggiornamento profilo');

      const response = await api.put('/auth/profile', updates);

      if (response.data.success) {
        const user = response.data.user;

        // Aggiorna localStorage
        this.setUserData(user);

        console.log('✅ Profilo aggiornato');

        return { success: true, user };
      }

      return { success: false, error: 'Aggiornamento fallito' };
    } catch (error) {
      console.error('❌ Errore aggiornamento profilo:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Cambia password
   */
  static async changePassword(oldPassword, newPassword) {
    try {
      console.log('🔒 Cambio password');

      const response = await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (response.data.success) {
        console.log('✅ Password cambiata');
        return { success: true };
      }

      return { success: false, error: 'Cambio password fallito' };
    } catch (error) {
      console.error('❌ Errore cambio password:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken() {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        return { success: false, error: 'No refresh token' };
      }

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      if (response.data.success) {
        this.setAccessToken(response.data.access_token);
        return { success: true, token: response.data.access_token };
      }

      return { success: false, error: 'Refresh fallito' };
    } catch (error) {
      console.error('❌ Errore refresh token:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== VALIDATION ====================

  /**
   * Verifica se utente è autenticato
   */
  static isAuthenticated() {
    const token = this.getAccessToken();
    const user = this.getUserData();
    return !!(token && user);
  }

  /**
   * Verifica se utente è customer
   */
  static isCustomer() {
    const user = this.getUserData();
    return user?.user_type === 'customer';
  }

  /**
   * Verifica se utente è provider
   */
  static isProvider() {
    const user = this.getUserData();
    return user?.user_type === 'provider';
  }

  /**
   * Verifica se utente è admin
   */
  static isAdmin() {
    const user = this.getUserData();
    return user?.user_type === 'admin';
  }

  /**
   * Ottieni tipo utente
   */
  static getUserType() {
    const user = this.getUserData();
    return user?.user_type || null;
  }

  // ==================== PASSWORD VALIDATION ====================

  /**
   * Valida forza password
   */
  static validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password deve essere almeno 8 caratteri');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password deve contenere almeno una maiuscola');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password deve contenere almeno una minuscola');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password deve contenere almeno un numero');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcola forza password (0-100)
   */
  static getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;

    return Math.min(strength, 100);
  }
}

// Export axios instance per altre chiamate API
export { api };

export default AuthService;
