import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';

import { ContentSkeleton } from '../components/common/ContentSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { InlineMessage } from '../components/common/InlineMessage';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { chatsApi } from '../services/api/chats';
import { documentsApi } from '../services/api/documents';
import { formatDocumentDate, getDocumentDisplayTitle, isDocumentReady } from '../utils/documents';
import {
  countAssistantMessages,
  formatChatStatus,
  getChatSessionTitle,
  getChatStatusTone,
  getMessageRoleLabel,
  getMessageRoleTone,
} from '../utils/chats';

const QUICK_PROMPTS = [
  'Summarize this PDF.',
  'What are the key risks or constraints?',
  'List the most important action items.',
  'Explain the main sections in plain language.',
];

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function ChatSessionDetailPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { getApiErrorMessage } = useAuth();
  const { pushToast } = useToast();
  const messageListRef = useRef(null);
  const [sessionItem, setSessionItem] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documentItem, setDocumentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('idle');

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [nextSession, nextSessions] = await Promise.all([
        chatsApi.getSession(chatId),
        chatsApi.listSessions(),
      ]);
      setSessionItem(nextSession);
      setSessions(nextSessions);

      if (nextSession.document_id) {
        const nextDocument = await documentsApi.getDocument(nextSession.document_id).catch(
          () => null,
        );
        setDocumentItem(nextDocument);
      } else {
        setDocumentItem(null);
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load the requested chat session.'));
    } finally {
      setIsLoading(false);
    }
  }, [chatId, getApiErrorMessage]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [assistantStatus, sessionItem?.messages]);

  const refreshSessionsList = useCallback(async () => {
    const nextSessions = await chatsApi.listSessions().catch(() => null);
    if (nextSessions) {
      setSessions(nextSessions);
    }
  }, []);

  const waitForAssistantReply = useCallback(
    async (existingAssistantCount) => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await delay(850);

        const nextSession = await chatsApi.getSession(chatId);
        setSessionItem(nextSession);
        const nextAssistantCount = countAssistantMessages(nextSession);

        if (nextAssistantCount > existingAssistantCount) {
          setAssistantStatus('received');
          await refreshSessionsList();
          return;
        }
      }

      setAssistantStatus('unavailable');
      await refreshSessionsList();
    },
    [chatId, refreshSessionsList],
  );

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      setSendError('Enter a question or instruction before sending.');
      return;
    }

    if (documentItem && !isDocumentReady(documentItem.status)) {
      setSendError('This document is not fully processed yet, so chat is temporarily unavailable.');
      return;
    }

    setSendError('');
    setIsSending(true);
    setAssistantStatus('waiting');

    try {
      const existingAssistantCount = countAssistantMessages(sessionItem);
      const updatedSession = await chatsApi.addMessage(chatId, {
        role: 'user',
        content: trimmedDraft,
        model_name: 'frontend-chat-panel',
      });

      setSessionItem(updatedSession);
      setDraft('');
      await waitForAssistantReply(existingAssistantCount);
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to send the message right now.');
      setSendError(message);
      setAssistantStatus('idle');
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return <ContentSkeleton title="Loading chat session..." />;
  }

  if (error) {
    return (
      <section className="panel-stack">
        <InlineMessage tone="error">{error}</InlineMessage>
        <EmptyState
          eyebrow="Chat unavailable"
          title="We couldn&apos;t open this chat session."
          description="Return to the sessions list and reopen the conversation after the next refresh."
          action={
            <Link className="button" to="/app/chats">
              Back to chats
            </Link>
          }
        />
      </section>
    );
  }

  const title = getChatSessionTitle(sessionItem);
  const statusTone = getChatStatusTone(sessionItem.status);
  const linkedDocumentTitle = documentItem
    ? getDocumentDisplayTitle(documentItem)
    : sessionItem.document_id || 'No linked document';
  const assistantMessages = countAssistantMessages(sessionItem);
  const isChatBlocked = documentItem ? !isDocumentReady(documentItem.status) : false;

  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Chat session</p>
          <h2>{title}</h2>
          <p>
            This detail shell anchors the selected conversation, its linked source
            document, and the message timeline that Phase 5 will expand into the full AI panel.
          </p>
        </div>
        <div className="document-detail__hero-actions">
          <span className={`status-badge status-badge--${statusTone}`}>
            {formatChatStatus(sessionItem.status)}
          </span>
          <Link className="button button--ghost" to="/app/chats">
            Back to chats
          </Link>
        </div>
      </article>

      <section className="chat-panel">
        <aside className="panel chat-panel__sidebar">
          <div className="chat-panel__sidebar-header">
            <div>
              <p className="eyebrow">Session rail</p>
              <h3>Related chats</h3>
            </div>
            <button type="button" className="button button--ghost" onClick={() => navigate('/app/chats')}>
              All chats
            </button>
          </div>

          <div className="chat-panel__session-list">
            {sessions.map((session) => {
              const isActive = session.id === sessionItem.id;
              return (
                <NavLink
                  key={session.id}
                  to={`/app/chats/${session.id}`}
                  className={`chat-session-link ${isActive ? 'chat-session-link--active' : ''}`}
                >
                  <div>
                    <strong>{getChatSessionTitle(session)}</strong>
                    <p>{formatDocumentDate(session.updated_at)}</p>
                  </div>
                  <span className={`status-badge status-badge--${getChatStatusTone(session.status)}`}>
                    {formatChatStatus(session.status)}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </aside>

        <div className="panel chat-panel__conversation">
          <div className="chat-panel__conversation-header">
            <div>
              <p className="eyebrow">Conversation</p>
              <h3>{title}</h3>
              <p className="chat-panel__conversation-subtitle">
                Linked to {linkedDocumentTitle}
              </p>
            </div>
            <div className="chat-panel__conversation-meta">
              <span className="pill">{sessionItem.messages.length} total messages</span>
              <span className="pill">{assistantMessages} assistant replies</span>
            </div>
          </div>

          {isChatBlocked ? (
            <InlineMessage tone="error">
              This source document is not fully processed yet. Chat can resume after the PDF is ready.
            </InlineMessage>
          ) : null}

          {sendError ? <InlineMessage tone="error">{sendError}</InlineMessage> : null}

          <div className="chat-panel__messages" ref={messageListRef}>
            {sessionItem.messages.length === 0 ? (
              <EmptyState
                eyebrow="No messages yet"
                title="Start the first document-grounded conversation."
                description="Use one of the quick prompts below or ask your own question about the linked PDF."
              />
            ) : (
              <div className="chat-message-list">
                {sessionItem.messages.map((message) => {
                  const tone = getMessageRoleTone(message.role);
                  const roleLabel = getMessageRoleLabel(message.role);

                  return (
                    <article className={`chat-message-card chat-message-card--${message.role}`} key={message.id}>
                      <div className="chat-message-card__header">
                        <span className={`status-badge status-badge--${tone}`}>{roleLabel}</span>
                        <span>{formatDocumentDate(message.created_at)}</span>
                      </div>
                      <p>{message.content}</p>
                      {message.model_name ? (
                        <small className="chat-message-card__meta">
                          Model hint: {message.model_name}
                        </small>
                      ) : null}
                    </article>
                  );
                })}

                {assistantStatus === 'waiting' ? (
                  <article className="chat-message-card chat-message-card--assistant chat-message-card--pending">
                    <div className="chat-message-card__header">
                      <span className="status-badge status-badge--success">Assistant</span>
                      <span>Generating...</span>
                    </div>
                    <div className="chat-message-card__typing">
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="chat-message-card__helper">
                      Waiting for the backend answer pipeline to append an assistant message to this session.
                    </p>
                  </article>
                ) : null}
              </div>
            )}
          </div>

          {assistantStatus === 'unavailable' ? (
            <InlineMessage tone="neutral">
              Your message was stored successfully, but this backend stub does not synthesize assistant replies yet. The UI is ready to display them as soon as the backend starts returning assistant messages.
            </InlineMessage>
          ) : null}

          <div className="chat-panel__prompt-row">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="pill chat-panel__prompt-chip"
                onClick={() => setDraft(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="chat-panel__composer" onSubmit={handleSendMessage}>
            <label className="chat-panel__composer-field">
              <span className="document-field__label">Ask about the document</span>
              <textarea
                className="field__input chat-panel__textarea"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask a grounded question, request a summary, or extract action items from the linked PDF."
                rows={4}
                disabled={isSending || isChatBlocked}
              />
            </label>

            <div className="chat-panel__composer-actions">
              <p>
                Messages are stored through the backend session endpoint. Assistant replies will appear automatically when the backend answer pipeline is connected.
              </p>
              <button type="submit" className="button" disabled={isSending || isChatBlocked}>
                {isSending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>
        </div>

        <aside className="panel chat-panel__context">
          <div className="chat-panel__context-hero">
            <p className="eyebrow">Source context</p>
            <h3>{linkedDocumentTitle}</h3>
            <p className="document-detail__helper">
              {documentItem
                ? 'This panel keeps the document context visible while you read answers and compose follow-up questions.'
                : 'The session is linked by document ID only, so source metadata is limited until the document record is available.'}
            </p>
            <div className="chat-context-pill-row">
              <span className="pill">{documentItem?.total_pages ?? 'Pending'} pages</span>
              <span className="pill">{documentItem ? formatDocumentDate(documentItem.updated_at) : 'Source pending'}</span>
            </div>
          </div>

          <div className="document-stat-grid">
            <div className="document-stat">
              <span>Document status</span>
              <strong>{documentItem ? (isDocumentReady(documentItem.status) ? 'Ready' : 'Pending') : 'Unknown'}</strong>
            </div>
            <div className="document-stat">
              <span>Pages</span>
              <strong>{documentItem?.total_pages ?? 'Pending'}</strong>
            </div>
            <div className="document-stat">
              <span>Session updated</span>
              <strong>{formatDocumentDate(sessionItem.updated_at)}</strong>
            </div>
            <div className="document-stat">
              <span>Assistant replies</span>
              <strong>{assistantMessages}</strong>
            </div>
          </div>

          <article className="chat-context-card">
            <p className="eyebrow">Citations</p>
            <h4>Answer evidence panel</h4>
            <p>
              The current backend does not return page-level citations yet. This panel is reserved for source references, page spans, and excerpt cards once answer generation is connected.
            </p>
            <div className="chat-context-card__evidence">
              <div>
                <span>Expected next</span>
                <strong>Page ranges and quoted snippets</strong>
              </div>
              <div>
                <span>Why it matters</span>
                <strong>Answers will feel inspectable instead of opaque.</strong>
              </div>
            </div>
          </article>

          <article className="chat-context-card">
            <p className="eyebrow">Response pipeline</p>
            <h4>Current backend posture</h4>
            <ul className="feature-list">
              <li>User messages are persisted to the session successfully.</li>
              <li>Assistant messages will render automatically when the backend starts appending them.</li>
              <li>The loading state already waits for a follow-up assistant message before resolving.</li>
            </ul>
          </article>

          <div className="document-detail__action-row">
            {documentItem ? (
              <Link className="button button--ghost" to={`/app/documents/${documentItem.id}`}>
                Open source PDF
              </Link>
            ) : null}
            <button
              type="button"
              className="button button--ghost"
              onClick={async () => {
                await loadSession();
                pushToast({
                  tone: 'success',
                  title: 'Chat refreshed',
                  message: 'The session timeline and source context were reloaded.',
                });
              }}
            >
              Refresh panel
            </button>
          </div>
        </aside>
      </section>
    </section>
  );
}
