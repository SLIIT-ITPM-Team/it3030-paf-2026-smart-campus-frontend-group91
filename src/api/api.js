import axios from 'axios';
import { clearAuthSession, getStoredToken, getStoredUser } from '../auth/authStorage';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

const api = axios.create({ baseURL: API_BASE_URL });

const setHeaderIfMissing = (headers, key, value) => {
  if (value === undefined || value === null || value === '') {
    return;
  }

  if (typeof headers?.set === 'function') {
    if (!headers.get?.(key)) {
      headers.set(key, String(value));
    }
    return;
  }

  if (headers && headers[key] == null) {
    headers[key] = String(value);
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  const user = getStoredUser();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const skipRedirect = error?.config?.skipAuthRedirect;

    if (!skipRedirect && status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event('auth:unauthorized'));

      if (window.location.pathname !== '/login') {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
