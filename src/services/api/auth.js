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
      listSessionsPromise = apiClient
        .get('/auth/sessions')
        .then((response) => response.data.items)
        .finally(() => {
          listSessionsPromise = null;
        });
    }

    return listSessionsPromise;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
