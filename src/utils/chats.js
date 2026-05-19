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

export function getMessageRoleLabel(role) {
  if (role === 'assistant') {
    return 'Assistant';
  }

  if (role === 'system') {
    return 'System';
  }

  return 'You';
}

export function getMessageRoleTone(role) {
  if (role === 'assistant') {
    return 'success';
  }

  if (role === 'system') {
    return 'warning';
  }

  return 'neutral';
}

export function countAssistantMessages(session) {
  return session?.messages?.filter((message) => message.role === 'assistant').length || 0;
}

export function getLatestAssistantMessage(session) {
  const messages = session?.messages || [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'assistant') {
      return messages[index];
    }
  }

  return null;
}

export function formatChatSourcePageRange(source) {
  const start = source?.page_number_start;
  const end = source?.page_number_end;

  if (Number.isInteger(start) && Number.isInteger(end) && start !== end) {
    return `Pages ${start}-${end}`;
  }

  if (Number.isInteger(start)) {
    return `Page ${start}`;
  }

  if (Number.isInteger(end)) {
    return `Page ${end}`;
  }

  return 'Page unavailable';
}

export function formatChatSourceSimilarity(source) {
  const similarity = source?.similarity_score;

  if (typeof similarity !== 'number' || Number.isNaN(similarity)) {
    return 'Similarity unavailable';
  }

  return `${Math.round(similarity * 100)}% match`;
}
