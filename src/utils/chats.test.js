import {
  buildDefaultChatTitle,
  formatChatStatus,
  getChatSessionTitle,
  getChatStatusTone,
  getLastMessagePreview,
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
});
