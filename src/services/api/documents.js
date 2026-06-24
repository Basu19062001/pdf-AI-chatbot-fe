import { apiClient } from './client';

const DOCUMENTS_LIST_CACHE_TTL_MS = 1000;

let documentsListPromise = null;
let documentsListCache = null;
let documentsListCacheTimestamp = 0;

export const documentsApi = {
  async listDocuments({ force = false } = {}) {
    const now = Date.now();

    if (
      !force &&
      documentsListCache &&
      now - documentsListCacheTimestamp < DOCUMENTS_LIST_CACHE_TTL_MS
    ) {
      return documentsListCache;
    }

    if (!force && documentsListPromise) {
      return documentsListPromise;
    }

    if (force) {
      documentsListPromise = null;
    }

    documentsListPromise = apiClient
      .get('/documents/')
      .then((response) => {
        documentsListCache = response.data.items;
        documentsListCacheTimestamp = Date.now();
        return documentsListCache;
      })
      .finally(() => {
        documentsListPromise = null;
      });

    return documentsListPromise;
  },

  async getDocument(documentId) {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data;
  },

  async uploadDocument({ file, title, onUploadProgress }) {
    const formData = new FormData();
    formData.append('file', file);

    if (title) {
      formData.append('title', title);
    }

    const response = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (!onUploadProgress) {
          return;
        }

        const total = event.total || file.size || 0;
        const nextProgress = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
        onUploadProgress(nextProgress);
      },
    });

    documentsListCache = null;
    documentsListCacheTimestamp = 0;

    return response.data;
  },
};
