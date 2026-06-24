import { apiClient, authorizedFetch } from './client';

const CHAT_SESSIONS_CACHE_TTL_MS = 1000;
const CHAT_MODEL = import.meta.env.VITE_OPENAI_CHAT_MODEL?.trim() || '';

let chatSessionsPromise = null;
let chatSessionsCache = null;
let chatSessionsCacheTimestamp = 0;

async function parseErrorResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      if (typeof payload?.detail === 'string' && payload.detail.trim()) {
        return payload.detail;
      }
    } else {
      const text = await response.text();
      if (text.trim()) {
        return text;
      }
    }
  } catch {
    // Ignore body parsing issues and fall back to the default message below.
  }

  return fallbackMessage;
}

function parseEventBlock(block) {
  const normalizedBlock = block.trim();

  if (!normalizedBlock) {
    return null;
  }

  const lines = normalizedBlock.split(/\r?\n/);
  let eventName = 'message';
  const dataLines = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim() || eventName;
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n');

  return {
    type: eventName,
    payload: JSON.parse(rawData),
  };
}

async function consumeEventStream(stream, onEvent) {
  const reader = stream?.getReader?.();

  if (!reader) {
    throw new Error('Streaming is not supported in this browser.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  async function processBuffer(flush = false) {
    const delimiter = /\r?\n\r?\n/;
    let match = delimiter.exec(buffer);

    while (match) {
      const rawEvent = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);

      const parsedEvent = parseEventBlock(rawEvent);
      if (parsedEvent) {
        onEvent?.(parsedEvent);
      }

      match = delimiter.exec(buffer);
    }

    if (flush) {
      const parsedEvent = parseEventBlock(buffer);
      if (parsedEvent) {
        onEvent?.(parsedEvent);
      }
      buffer = '';
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    await processBuffer(done);

    if (done) {
      return;
    }
  }
}

function buildChatPayload(payload) {
  if (!CHAT_MODEL || payload?.model_name) {
    return payload;
  }

  return {
    ...payload,
    model_name: CHAT_MODEL,
  };
}

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

  async streamMessage(sessionId, payload, { signal, onEvent } = {}) {
    const response = await authorizedFetch(`/chats/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildChatPayload(payload)),
      signal,
    });

    if (!response.ok) {
      const detail = await parseErrorResponse(
        response,
        'Unable to send the message right now.',
      );
      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }

    await consumeEventStream(response.body, onEvent);
  },
};
