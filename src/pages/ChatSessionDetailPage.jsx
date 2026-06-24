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
  formatChatSourcePageRange,
  formatChatSourceSimilarity,
  formatChatStatus,
  getChatSessionTitle,
  getChatStatusTone,
  getLatestAssistantMessage,
  getMessageRoleLabel,
  getMessageRoleTone,
} from '../utils/chats';

const QUICK_PROMPTS = [
  'Summarize this PDF.',
  'What are the key risks or constraints?',
  'List the most important action items.',
  'Explain the main sections in plain language.',
];

const CHAT_MODEL = import.meta.env.VITE_OPENAI_CHAT_MODEL?.trim() || '';

function buildPendingId(prefix) {
  const suffix = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function replaceMessage(messages, matcher, nextMessage) {
  return messages.map((message) => (matcher(message) ? nextMessage : message));
}

function removeMessage(messages, messageId) {
  return messages.filter((message) => message.id !== messageId);
}

function isAbortError(error) {
  return error?.name === 'AbortError';
}

export function ChatSessionDetailPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { getApiErrorMessage } = useAuth();
  const { pushToast } = useToast();
  const messageListRef = useRef(null);
  const activeStreamControllerRef = useRef(null);
  const [sessionItem, setSessionItem] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documentItem, setDocumentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('idle');

  const cancelActiveStream = useCallback(() => {
    activeStreamControllerRef.current?.abort();
    activeStreamControllerRef.current = null;
  }, []);

  const refreshSessionsList = useCallback(async () => {
    const nextSessions = await chatsApi.listSessions({ force: true }).catch(() => null);
    if (nextSessions) {
      setSessions(nextSessions);
    }
  }, []);

  const refreshSessionItem = useCallback(async () => {
    const nextSession = await chatsApi.getSession(chatId);
    setSessionItem(nextSession);
    return nextSession;
  }, [chatId]);

  const loadSession = useCallback(async () => {
    cancelActiveStream();
    setIsLoading(true);
    setError('');

    try {
      const [nextSession, nextSessions] = await Promise.all([
        chatsApi.getSession(chatId),
        chatsApi.listSessions({ force: true }),
      ]);
      setSessionItem(nextSession);
      setSessions(nextSessions);

      if (nextSession.document_id) {
        const nextDocument = await documentsApi.getDocument(nextSession.document_id).catch(() => null);
        setDocumentItem(nextDocument);
      } else {
        setDocumentItem(null);
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load the requested chat session.'));
    } finally {
      setIsLoading(false);
      setAssistantStatus('idle');
      setIsSending(false);
    }
  }, [cancelActiveStream, chatId, getApiErrorMessage]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    return () => {
      cancelActiveStream();
    };
  }, [cancelActiveStream]);

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [assistantStatus, sessionItem?.messages]);

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

    cancelActiveStream();
    setSendError('');
    setIsSending(true);
    setAssistantStatus('streaming');

    const createdAt = new Date().toISOString();
    const pendingUserId = buildPendingId('pending-user');
    const pendingAssistantId = buildPendingId('pending-assistant');
    const controller = new AbortController();
    let currentUserMessageId = pendingUserId;
    let currentAssistantMessageId = pendingAssistantId;
    let serverReportedError = '';
    let streamCompleted = false;

    activeStreamControllerRef.current = controller;
    setDraft('');
    setSessionItem((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      return {
        ...currentSession,
        messages: [
          ...currentSession.messages,
          {
            id: pendingUserId,
            role: 'user',
            content: trimmedDraft,
            created_at: createdAt,
            sources: [],
          },
          {
            id: pendingAssistantId,
            role: 'assistant',
            content: '',
            llm_model: CHAT_MODEL || null,
            created_at: createdAt,
            sources: [],
            isStreaming: true,
          },
        ],
      };
    });

    try {
      await chatsApi.streamMessage(
        chatId,
        {
          content: trimmedDraft,
        },
        {
          signal: controller.signal,
          onEvent: ({ type, payload }) => {
            if (type === 'message_start') {
              setSessionItem((currentSession) => {
                if (!currentSession) {
                  return currentSession;
                }

                return {
                  ...currentSession,
                  messages: currentSession.messages.map((message) => {
                    if (message.id === pendingUserId) {
                      currentUserMessageId = payload.user_message_id;
                      return {
                        ...message,
                        id: currentUserMessageId,
                      };
                    }

                    if (message.id === pendingAssistantId) {
                      currentAssistantMessageId = payload.assistant_message_id;
                      return {
                        ...message,
                        id: currentAssistantMessageId,
                        llm_model: payload.model_name || message.llm_model,
                        sources: payload.sources || [],
                        isStreaming: true,
                      };
                    }

                    return message;
                  }),
                };
              });
              return;
            }

            if (type === 'message_delta') {
              if (!payload?.delta) {
                return;
              }

              setSessionItem((currentSession) => {
                if (!currentSession) {
                  return currentSession;
                }

                return {
                  ...currentSession,
                  messages: replaceMessage(
                    currentSession.messages,
                    (message) => message.id === currentAssistantMessageId,
                    (() => {
                      const currentAssistant =
                        currentSession.messages.find(
                          (message) => message.id === currentAssistantMessageId,
                        ) ||
                        {};
                      return {
                        ...currentAssistant,
                        id: currentAssistantMessageId,
                        role: 'assistant',
                        content: `${currentAssistant.content || ''}${payload.delta}`,
                        created_at: currentAssistant.created_at || createdAt,
                        sources: currentAssistant.sources || [],
                        llm_model: currentAssistant.llm_model || CHAT_MODEL || null,
                        isStreaming: true,
                      };
                    })(),
                  ),
                };
              });
              return;
            }

            if (type === 'message_complete') {
              streamCompleted = true;
              setAssistantStatus('received');
              setSessionItem((currentSession) => {
                if (!currentSession) {
                  return currentSession;
                }

                return {
                  ...currentSession,
                  messages: replaceMessage(
                    currentSession.messages,
                    (message) =>
                      message.id === currentAssistantMessageId ||
                      message.id === payload?.assistant_message?.id,
                    {
                      ...payload.assistant_message,
                      isStreaming: false,
                    },
                  ),
                };
              });
              return;
            }

            if (type === 'error') {
              serverReportedError =
                typeof payload?.detail === 'string' && payload.detail.trim()
                  ? payload.detail
                  : 'Unable to stream the assistant response right now.';
              setAssistantStatus('idle');
              setSendError(serverReportedError);
              setSessionItem((currentSession) => {
                if (!currentSession) {
                  return currentSession;
                }

                return {
                  ...currentSession,
                  messages: removeMessage(currentSession.messages, currentAssistantMessageId),
                };
              });
            }
          },
        },
      );
    } catch (submitError) {
      if (!isAbortError(submitError)) {
        const message = getApiErrorMessage(submitError, 'Unable to send the message right now.');
        setSendError(message);
        setAssistantStatus('idle');
        setSessionItem((currentSession) => {
          if (!currentSession) {
            return currentSession;
          }

          return {
            ...currentSession,
            messages: removeMessage(
              removeMessage(currentSession.messages, currentAssistantMessageId),
              currentUserMessageId,
            ),
          };
        });
      }
    } finally {
      if (activeStreamControllerRef.current === controller) {
        activeStreamControllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setIsSending(false);
        await refreshSessionsList();

        if (streamCompleted || serverReportedError) {
          await refreshSessionItem().catch(() => null);
        }
      }
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
  const latestAssistantMessage = getLatestAssistantMessage(sessionItem);
  const latestSources = latestAssistantMessage?.sources || [];

  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Chat session</p>
          <h2>{title}</h2>
          <p>
            Keep the conversation, linked document, and message timeline together in one reading workspace.
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

                      {message.isStreaming && !message.content ? (
                        <>
                          <div className="chat-message-card__typing">
                            <span />
                            <span />
                            <span />
                          </div>
                          <p className="chat-message-card__helper">
                            Grounding the answer against the linked document and streaming the response.
                          </p>
                        </>
                      ) : (
                        <p className="chat-message-card__body">{message.content}</p>
                      )}

                      {message.role === 'assistant' && message.sources?.length ? (
                        <div className="chat-message-card__sources">
                          {message.sources.map((source) => (
                            <div className="chat-source-chip" key={`${message.id}-${source.chunk_id}`}>
                              <strong>{formatChatSourcePageRange(source)}</strong>
                              <span>{formatChatSourceSimilarity(source)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {message.llm_model ? (
                        <small className="chat-message-card__meta">
                          Model: {message.llm_model}
                        </small>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="chat-panel__prompt-row">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="pill chat-panel__prompt-chip"
                onClick={() => setDraft(prompt)}
                disabled={isSending || isChatBlocked}
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
                Responses stream in real time and are persisted with their supporting citations when the turn completes.
              </p>
              <button type="submit" className="button" disabled={isSending || isChatBlocked}>
                {isSending ? 'Streaming reply...' : 'Send message'}
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
                ? 'Keep the document context visible while reading answers and writing follow-up questions.'
                : 'This session is linked by document ID only, so source metadata is still limited.'}
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
            {latestSources.length ? (
              <div className="chat-context-card__evidence">
                {latestSources.map((source) => (
                  <div key={`${latestAssistantMessage.id}-${source.chunk_id}`}>
                    <span>
                      {formatChatSourcePageRange(source)} · {formatChatSourceSimilarity(source)}
                    </span>
                    <strong>{source.quoted_text || 'Quoted excerpt unavailable.'}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                {assistantStatus === 'streaming'
                  ? 'Matching document chunks will appear here as soon as the backend announces the source set for this answer.'
                  : 'Ask a question to see page-level support and quoted snippets for the latest assistant answer.'}
              </p>
            )}
          </article>

          <article className="chat-context-card">
            <p className="eyebrow">Response pipeline</p>
            <h4>Current session state</h4>
            <ul className="feature-list">
              <li>User turns are appended optimistically so the conversation never feels blocked.</li>
              <li>Assistant text streams token by token from the backend SSE endpoint.</li>
              <li>Completed replies are reconciled back to the persisted session state.</li>
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
