import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ContentSkeleton } from '../components/common/ContentSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { InlineMessage } from '../components/common/InlineMessage';
import { useAuth } from '../hooks/useAuth';
import { chatsApi } from '../services/api/chats';
import { documentsApi } from '../services/api/documents';
import { formatDocumentDate, getDocumentDisplayTitle, isDocumentReady } from '../utils/documents';
import {
  formatChatStatus,
  getChatSessionTitle,
  getChatStatusTone,
  getLastMessagePreview,
} from '../utils/chats';

export function ChatSessionDetailPage() {
  const { chatId } = useParams();
  const { getApiErrorMessage } = useAuth();
  const [sessionItem, setSessionItem] = useState(null);
  const [documentItem, setDocumentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextSession = await chatsApi.getSession(chatId);
      setSessionItem(nextSession);

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

      <div className="document-detail__hero-grid">
        <article className="panel document-detail__summary">
          <p className="eyebrow">Linked source</p>
          <h3>{linkedDocumentTitle}</h3>
          <p>
            {documentItem
              ? isDocumentReady(documentItem.status)
                ? 'The backing document is processed and ready for source-grounded conversation.'
                : 'The backing document exists, but it is not fully ready yet.'
              : 'This session is linked only by document ID in the current backend response.'}
          </p>

          <div className="document-detail__action-row">
            {documentItem ? (
              <Link className="button" to={`/app/documents/${documentItem.id}`}>
                Open document
              </Link>
            ) : null}
            <button type="button" className="button button--ghost" onClick={loadSession}>
              Refresh session
            </button>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Session snapshot</p>
          <div className="document-stat-grid">
            <div className="document-stat">
              <span>Messages</span>
              <strong>{sessionItem.messages.length}</strong>
            </div>
            <div className="document-stat">
              <span>Status</span>
              <strong>{formatChatStatus(sessionItem.status)}</strong>
            </div>
            <div className="document-stat">
              <span>Created</span>
              <strong>{formatDocumentDate(sessionItem.created_at)}</strong>
            </div>
            <div className="document-stat">
              <span>Updated</span>
              <strong>{formatDocumentDate(sessionItem.updated_at)}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <p className="eyebrow">Latest activity</p>
          <h3>Message timeline preview</h3>
          {sessionItem.messages.length === 0 ? (
            <EmptyState
              eyebrow="No conversation yet"
              title="This chat session is ready for its first message."
              description="Phase 5 will add the full composer and assistant response flow on top of this selected session."
            />
          ) : (
            <div className="chat-message-list">
              {sessionItem.messages.map((message) => (
                <article className="chat-message-card" key={message.id}>
                  <div className="chat-message-card__header">
                    <span className={`status-badge status-badge--${message.role === 'assistant' ? 'success' : 'neutral'}`}>
                      {message.role}
                    </span>
                    <span>{formatDocumentDate(message.created_at)}</span>
                  </div>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Phase 5 handoff</p>
          <h3>The chat panel will grow from this route.</h3>
          <ul className="feature-list">
            <li>Message history is already anchored to a dedicated session route.</li>
            <li>The linked document context is visible before message sending begins.</li>
            <li>The next phase can attach composer, citations, and assistant streaming to this shell.</li>
          </ul>
          <p className="document-detail__helper">{getLastMessagePreview(sessionItem)}</p>
        </article>
      </div>
    </section>
  );
}
