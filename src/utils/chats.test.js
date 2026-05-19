import {
  buildDefaultChatTitle,
  countAssistantMessages,
  formatChatSourcePageRange,
  formatChatSourceSimilarity,
  formatChatStatus,
  getChatSessionTitle,
  getChatStatusTone,
  getLatestAssistantMessage,
  getLastMessagePreview,
  getMessageRoleLabel,
  getMessageRoleTone,
} from './chats';

describe('chat utils', () => {
  it('builds a fallback session title from the linked document', () => {
    const docs = new Map([
      ['doc-1', { id: 'doc-1', title: 'Policy Manual', original_file_name: 'policy.pdf' }],
    ]);

    expect(getChatSessionTitle({ title: '', document_id: 'doc-1' }, docs)).toBe('Policy Manual chat');
    expect(buildDefaultChatTitle({ title: 'Policy Manual' })).toBe('Policy Manual conversation');
  });

  it('maps chat statuses to UI labels and tones', () => {
    expect(formatChatStatus('active')).toBe('Active');
    expect(getChatStatusTone('closed')).toBe('warning');
    expect(getChatStatusTone('active')).toBe('success');
  });

  it('returns a helpful preview when a chat has no messages yet', () => {
    expect(getLastMessagePreview({ messages: [] })).toBe(
      'No messages have been added to this session yet.',
    );
  });

  it('formats message role metadata for the chat panel', () => {
    expect(getMessageRoleLabel('assistant')).toBe('Assistant');
    expect(getMessageRoleTone('system')).toBe('warning');
    expect(countAssistantMessages({ messages: [{ role: 'assistant' }, { role: 'user' }] })).toBe(1);
  });

  it('returns the latest assistant message and formats source metadata', () => {
    const latestAssistant = getLatestAssistantMessage({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'First answer' },
        { id: '3', role: 'assistant', content: 'Latest answer' },
      ],
    });

    expect(latestAssistant?.id).toBe('3');
    expect(
      formatChatSourcePageRange({ page_number_start: 4, page_number_end: 6 }),
    ).toBe('Pages 4-6');
    expect(formatChatSourceSimilarity({ similarity_score: 0.873 })).toBe('87% match');
  });
});
