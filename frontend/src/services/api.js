import axios from 'axios';

const TOKEN_KEY = 'nyaya_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalises every failure into an Error with .status, .message and .details. */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    let message = body?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'The request timed out. Please try again.';
      else if (!error.response) message = 'Cannot reach the NyayaAI server. Is the backend running?';
      else message = `Request failed (${status})`;
    }
    if (status === 401 && tokenStore.get() && !error.config?.url?.includes('/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: message }));
    }
    const err = new Error(message);
    err.status = status;
    err.details = body?.error;
    return Promise.reject(err);
  },
);

/** Unwraps { success, data, message, meta } */
export const unwrap = (res) => ({ ...res.data.data, _meta: res.data.meta, _message: res.data.message });

export default api;
