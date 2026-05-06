import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
if (API_BASE_URL && !API_BASE_URL.endsWith('/api') && !API_BASE_URL.endsWith('/api/')) {
  API_BASE_URL = API_BASE_URL.endsWith('/') ? `${API_BASE_URL}api` : `${API_BASE_URL}/api`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Decode a JWT and return its payload, or null if invalid/missing.
 */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Returns true if the stored token is present and not yet expired.
 */
export function isTokenValid() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;
  // exp is in seconds, Date.now() is in ms
  return decoded.exp * 1000 > Date.now();
}

// Request interceptor — attach token if it's still valid
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // If token is expired, clear storage before the request even goes out
      if (!isTokenValid()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 from backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if we're already trying to login
      if (!error.config.url.endsWith('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
