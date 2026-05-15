import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

let accessTokenGetter = () => null;
let refreshSessionHandler = null;
let unauthorizedHandler = null;
let refreshPromise = null;

const authPathFragments = ['/auth/login', '/auth/signup', '/auth/refresh'];

function authDebugLog(message, details) {
  if (details === undefined) {
    console.warn(`[auth-debug][api-client] ${message}`);
    return;
  }

  console.warn(`[auth-debug][api-client] ${message}`, details);
}

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
  authDebugLog('Configured API client auth handlers.');
}

apiClient.interceptors.request.use((config) => {
  const token = accessTokenGetter?.();
  const requestUrl = config.url || '';

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    authDebugLog('Attached access token to request.', {
      url: requestUrl,
      method: config.method,
    });
  } else {
    authDebugLog('Sending request without access token.', {
      url: requestUrl,
      method: config.method,
    });
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
    authDebugLog('Received API error response.', {
      url: requestUrl,
      method: originalRequest?.method,
      status,
      isAuthRequest,
      hasRetryFlag: Boolean(originalRequest?._retry),
    });

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
    authDebugLog('401 detected, attempting refresh flow.', {
      url: requestUrl,
      method: originalRequest.method,
    });

    try {
      if (!refreshPromise) {
        authDebugLog('Starting shared refresh request.');
        refreshPromise = refreshSessionHandler();
      } else {
        authDebugLog('Joining in-flight refresh request.');
      }

      const nextAccessToken = await refreshPromise;
      refreshPromise = null;

      if (!nextAccessToken) {
        authDebugLog('Refresh flow returned no access token; marking session unauthorized.');
        unauthorizedHandler?.();
        throw error;
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      authDebugLog('Retrying original request with refreshed access token.', {
        url: requestUrl,
        method: originalRequest.method,
      });
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      authDebugLog('Refresh flow failed; clearing auth state.', {
        url: requestUrl,
        method: originalRequest?.method,
        status: refreshError.response?.status,
        message: refreshError.message,
      });
      unauthorizedHandler?.();
      throw refreshError;
    }
  },
);
