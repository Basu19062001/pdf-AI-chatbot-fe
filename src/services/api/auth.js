import { apiClient, publicClient } from './client';

let listSessionsPromise = null;

export const authApi = {
  async signup(payload) {
    const response = await publicClient.post('/auth/signup', payload);
    return response.data;
  },

  async login(payload) {
    const response = await publicClient.post('/auth/login', payload);
    return response.data;
  },

  async refresh(payload) {
    const response = await publicClient.post('/auth/refresh', payload);
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async listSessions() {
    if (!listSessionsPromise) {
      console.warn('[auth-debug][auth-api] Starting /auth/sessions request.');
      listSessionsPromise = apiClient
        .get('/auth/sessions')
        .then((response) => response.data.items)
        .finally(() => {
          console.warn('[auth-debug][auth-api] /auth/sessions request settled.');
          listSessionsPromise = null;
        });
    } else {
      console.warn('[auth-debug][auth-api] Reusing in-flight /auth/sessions request.');
    }

    return listSessionsPromise;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
