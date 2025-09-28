// utils/api.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Get token from Auth0
    const getToken = async () => {
      try {
        // This will be injected by the app
        if (window.getAccessToken) {
          const token = await window.getAccessToken();
          return token;
        }
        return null;
      } catch (error) {
        console.error('Error getting access token:', error);
        return null;
      }
    };

    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          toast.error('Sessione scaduta. Effettua nuovamente il login.');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Non hai i permessi per questa azione');
          break;
        case 404:
          toast.error('Risorsa non trovata');
          break;
        case 500:
          toast.error('Errore del server. Riprova più tardi.');
          break;
        default:
          toast.error(data.message || 'Si è verificato un errore');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Impossibile connettersi al server');
    } else {
      // Something else happened
      toast.error('Si è verificato un errore imprevisto');
    }
    
    return Promise.reject(error);
  }
);

// API methods
const apiService = {
  // Auth
  auth: {
    register: (data) => api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    logout: () => api.post('/auth/logout'),
  },

  // Providers
  providers: {
    list: (params) => api.get('/providers', { params }),
    get: (id) => api.get(`/providers/${id}`),
    search: (query) => api.get('/providers/search', { params: { q: query } }),
    getByCategory: (category) => api.get(`/providers/category/${category}`),
  },

  // Bookings
  bookings: {
    create: (data) => api.post('/bookings', data),
    list: (params) => api.get('/bookings', { params }),
    get: (id) => api.get(`/bookings/${id}`),
    updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
    cancel: (id, reason) => api.delete(`/bookings/${id}`, { data: { reason } }),
  },

  // Chat
  chat: {
    startSession: () => api.post('/chat/start'),
    sendMessage: (sessionId, message) => 
      api.post('/chat/message', { session_id: sessionId, message }),
    getHistory: (sessionId) => api.get(`/chat/history/${sessionId}`),
    endSession: (sessionId) => api.post(`/chat/end/${sessionId}`),
  },

  // Reviews
  reviews: {
    create: (data) => api.post('/reviews', data),
    getForProvider: (providerId) => api.get(`/reviews/provider/${providerId}`),
    getForBooking: (bookingId) => api.get(`/reviews/booking/${bookingId}`),
  },

  // Notifications
  notifications: {
    list: () => api.get('/notifications'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
  },
};

export default apiService;
export { api, API_URL };
