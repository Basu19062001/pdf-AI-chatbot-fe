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

export function getApiBaseUrl() {
  return baseURL;
}

export function configureApiClient({ getAccessToken, refreshSession, onUnauthorized }) {
  accessTokenGetter = getAccessToken;
  refreshSessionHandler = refreshSession;
  unauthorizedHandler = onUnauthorized;
}

async function getRefreshedAccessToken() {
  if (!refreshSessionHandler) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshSessionHandler();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function withAuthorizationHeader(headers, token) {
  const nextHeaders = new Headers(headers || {});

  if (token) {
    nextHeaders.set('Authorization', `Bearer ${token}`);
  }

  return nextHeaders;
}

export async function authorizedFetch(path, init = {}) {
  const requestUrl = String(path || '');
  const isAuthRequest = authPathFragments.some((fragment) => requestUrl.includes(fragment));

  async function execute(token) {
    const headers = withAuthorizationHeader(init.headers, token);
    return fetch(`${baseURL}${requestUrl}`, {
      ...init,
      headers,
    });
  }

  const initialToken = accessTokenGetter?.();
  let response = await execute(initialToken);

  if (response.status !== 401 || isAuthRequest) {
    return response;
  }

  const nextAccessToken = await getRefreshedAccessToken();

  if (!nextAccessToken) {
    unauthorizedHandler?.();
    return response;
  }

  response = await execute(nextAccessToken);

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  return response;
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
      const nextAccessToken = await getRefreshedAccessToken();

      if (!nextAccessToken) {
        unauthorizedHandler?.();
        throw error;
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      unauthorizedHandler?.();
      throw refreshError;
    }
  },
);
