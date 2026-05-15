import { getDocumentDisplayTitle } from './documents';

export function getChatSessionTitle(session, documentMap = new Map()) {
  const explicitTitle = session?.title?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const linkedDocument = documentMap.get(session?.document_id);
  if (linkedDocument) {
    return `${getDocumentDisplayTitle(linkedDocument)} chat`;
  }

  return 'Untitled chat session';
}

export function formatChatStatus(status) {
  if (status === 'archived') {
    return 'Archived';
  }

  if (status === 'closed') {
    return 'Closed';
  }

  return 'Active';
}

export function getChatStatusTone(status) {
  if (status === 'archived') {
    return 'neutral';
  }

  if (status === 'closed') {
    return 'warning';
  }

  return 'success';
}

export function buildDefaultChatTitle(documentItem) {
  return `${getDocumentDisplayTitle(documentItem)} conversation`;
}

export function getLastMessagePreview(session) {
  const lastMessage = session?.messages?.[session.messages.length - 1];
  if (!lastMessage?.content) {
    return 'No messages have been added to this session yet.';
  }

  return lastMessage.content;
}
