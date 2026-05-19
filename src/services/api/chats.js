import { apiClient } from './client';

const CHAT_SESSIONS_CACHE_TTL_MS = 1000;

let chatSessionsPromise = null;
let chatSessionsCache = null;
let chatSessionsCacheTimestamp = 0;

export const chatsApi = {
  async listSessions({ force = false } = {}) {
    const now = Date.now();

    if (
      !force &&
      chatSessionsCache &&
      now - chatSessionsCacheTimestamp < CHAT_SESSIONS_CACHE_TTL_MS
    ) {
      return chatSessionsCache;
    }

    if (!force && chatSessionsPromise) {
      return chatSessionsPromise;
    }

    if (force) {
      chatSessionsPromise = null;
    }

    chatSessionsPromise = apiClient
      .get('/chats/sessions')
      .then((response) => {
        chatSessionsCache = response.data.items;
        chatSessionsCacheTimestamp = Date.now();
        return chatSessionsCache;
      })
      .finally(() => {
        chatSessionsPromise = null;
      });

    return chatSessionsPromise;
  },

  async getSession(sessionId) {
    const response = await apiClient.get(`/chats/sessions/${sessionId}`);
    return response.data;
  },

  async createSession(payload) {
    const response = await apiClient.post('/chats/sessions', payload);
    chatSessionsCache = null;
    chatSessionsCacheTimestamp = 0;
    return response.data;
  },

  async addMessage(sessionId, payload) {
    const response = await apiClient.post(`/chats/sessions/${sessionId}/messages`, payload);
    return response.data;
  },
};
