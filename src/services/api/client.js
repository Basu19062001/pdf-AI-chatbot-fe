import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

let accessTokenGetter = () => null;
let refreshSessionHandler = null;
let unauthorizedHandler = null;
let refreshPromise = null;

const authPathFragments = ['/auth/login', '/auth/signup', '/auth/refresh'];

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

export const publicClient = axios.create({
  baseURL,
  timeout: 15000,
});

export function configureApiClient({ getAccessToken, refreshSession, onUnauthorized }) {
  accessTokenGetter = getAccessToken;
  refreshSessionHandler = refreshSession;
  unauthorizedHandler = onUnauthorized;
}

apiClient.interceptors.request.use((config) => {
  const token = accessTokenGetter?.();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = authPathFragments.some((path) => requestUrl.includes(path));

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest ||
      !refreshSessionHandler
    ) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshSessionHandler();
      }

      const nextAccessToken = await refreshPromise;
      refreshPromise = null;

      if (!nextAccessToken) {
        unauthorizedHandler?.();
        throw error;
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      unauthorizedHandler?.();
      throw refreshError;
    }
  },
);
