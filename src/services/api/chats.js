import { apiClient } from './client';

export const chatsApi = {
  async listSessions() {
    const response = await apiClient.get('/chats/sessions');
    return response.data.items;
  },

  async getSession(sessionId) {
    const response = await apiClient.get(`/chats/sessions/${sessionId}`);
    return response.data;
  },

  async createSession(payload) {
    const response = await apiClient.post('/chats/sessions', payload);
    return response.data;
  },

  async addMessage(sessionId, payload) {
    const response = await apiClient.post(`/chats/sessions/${sessionId}/messages`, payload);
    return response.data;
  },
};
