import { apiClient } from './client';

export const documentsApi = {
  async listDocuments() {
    const response = await apiClient.get('/documents/');
    return response.data.items;
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

    return response.data;
  },
};
