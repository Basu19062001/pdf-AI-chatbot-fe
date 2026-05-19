const authorizedFetchMock = vi.fn();

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  authorizedFetch: (...args) => authorizedFetchMock(...args),
}));

import { chatsApi } from './chats';

function buildStreamResponse(chunks) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    },
  );
}

describe('chatsApi.streamMessage', () => {
  afterEach(() => {
    authorizedFetchMock.mockReset();
  });

  it('parses SSE events and forwards payloads in order', async () => {
    authorizedFetchMock.mockResolvedValue(
      buildStreamResponse([
        'event: message_start\n',
        'data: {"assistant_message_id":"msg-1","sources":[]}\n\n',
        'event: message_delta\n',
        'data: {"delta":"Hello"}\n\n',
        'event: message_complete\n',
        'data: {"assistant_message":{"id":"msg-1","role":"assistant","content":"Hello","sources":[]}}\n\n',
      ]),
    );

    const receivedEvents = [];

    await chatsApi.streamMessage(
      'session-1',
      { content: 'Hi there' },
      {
        onEvent: (event) => receivedEvents.push(event),
      },
    );

    expect(receivedEvents).toEqual([
      {
        type: 'message_start',
        payload: {
          assistant_message_id: 'msg-1',
          sources: [],
        },
      },
      {
        type: 'message_delta',
        payload: {
          delta: 'Hello',
        },
      },
      {
        type: 'message_complete',
        payload: {
          assistant_message: {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello',
            sources: [],
          },
        },
      },
    ]);
  });
});
