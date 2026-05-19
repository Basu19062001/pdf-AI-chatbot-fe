import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { ContentSkeleton } from '../components/common/ContentSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { InlineMessage } from '../components/common/InlineMessage';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { chatsApi } from '../services/api/chats';
import { documentsApi } from '../services/api/documents';
import { formatDocumentDate, getDocumentDisplayTitle, isDocumentReady } from '../utils/documents';
import {
  buildDefaultChatTitle,
  formatChatStatus,
  getChatSessionTitle,
  getChatStatusTone,
  getLastMessagePreview,
} from '../utils/chats';

export function ChatsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getApiErrorMessage } = useAuth();
  const { pushToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(searchParams.get('documentId') || '');
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const processedDocuments = useMemo(
    () => documents.filter((item) => isDocumentReady(item.status)),
    [documents],
  );
  const documentMap = useMemo(
    () => new Map(documents.map((item) => [item.id, item])),
    [documents],
  );

  const loadChatWorkspace = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const [nextSessions, nextDocuments] = await Promise.all([
          chatsApi.listSessions({ force: silent }),
          documentsApi.listDocuments({ force: silent }),
        ]);
        setSessions(nextSessions);
        setDocuments(nextDocuments);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Unable to load chat sessions right now.'));
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [getApiErrorMessage],
  );

  useEffect(() => {
    loadChatWorkspace();
  }, [loadChatWorkspace]);

  useEffect(() => {
    const documentId = searchParams.get('documentId') || '';
    setSelectedDocumentId(documentId);
  }, [searchParams]);

  const selectedDocument = processedDocuments.find((item) => item.id === selectedDocumentId) || null;

  const filteredSessions = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return sessions.filter((session) => {
      if (!normalizedQuery) {
        return true;
      }

      const titleMatch = getChatSessionTitle(session, documentMap)
        .toLowerCase()
        .includes(normalizedQuery);
      const documentTitle = documentMap.get(session.document_id);
      const documentMatch = documentTitle
        ? getDocumentDisplayTitle(documentTitle).toLowerCase().includes(normalizedQuery)
        : false;

      return titleMatch || documentMatch;
    });
  }, [deferredQuery, documentMap, sessions]);

  async function handleCreateSession(event) {
    event.preventDefault();

    if (!selectedDocument) {
      setSubmitError('Choose a processed document before creating a chat session.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim() || buildDefaultChatTitle(selectedDocument),
        document_id: selectedDocument.id,
      };

      const createdSession = await chatsApi.createSession(payload);
      setSessions((current) => [createdSession, ...current]);
      pushToast({
        tone: 'success',
        title: 'Chat session created',
        message: `${payload.title} is ready for document-grounded conversation.`,
      });
      setTitle('');
      setSearchParams({});
      navigate(`/app/chats/${createdSession.id}`);
    } catch (createError) {
      const message = getApiErrorMessage(createError, 'Unable to create a chat session right now.');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Chat session management</p>
          <h2>Organize conversations per processed document.</h2>
          <p>
            Create a session from a ready PDF, review its linked source, and open a
            dedicated conversation route that Phase 5 can extend into the full AI panel.
          </p>
        </div>
        <div className="document-page__header-actions">
          <span className="status-chip">{sessions.length} total sessions</span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => loadChatWorkspace({ silent: true })}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh chats'}
          </button>
        </div>
      </article>

      <div className="document-page__hero-grid">
        <article className="panel document-upload">
          <div className="document-upload__header">
            <div>
              <p className="eyebrow">Create chat</p>
              <h3>Start from a ready document</h3>
            </div>
            <span className="pill">{processedDocuments.length} ready documents</span>
          </div>

          <form className="document-upload__form" onSubmit={handleCreateSession}>
            <label className="document-field">
              <span className="document-field__label">Choose processed document</span>
              <select
                className="field__input document-select"
                value={selectedDocumentId}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSelectedDocumentId(nextValue);
                  if (nextValue) {
                    setSearchParams({ documentId: nextValue });
                  } else {
                    setSearchParams({});
                  }
                }}
              >
                <option value="">Select a document</option>
                {processedDocuments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getDocumentDisplayTitle(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="document-field">
              <span className="document-field__label">Session title</span>
              <input
                className="field__input"
                type="text"
                placeholder={
                  selectedDocument
                    ? buildDefaultChatTitle(selectedDocument)
                    : 'Choose a document to generate a default title'
                }
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={255}
              />
            </label>

            {submitError ? <InlineMessage tone="error">{submitError}</InlineMessage> : null}

            <div className="document-upload__actions">
              <button
                type="submit"
                className="button"
                disabled={isSubmitting || processedDocuments.length === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create session'}
              </button>
              <p>
                Session creation is limited to processed documents so the next phase can
                rely on a ready source context from the first message onward.
              </p>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Session posture</p>
          <h3>Track readiness before conversation starts.</h3>
          <div className="document-stat-grid">
            <div className="document-stat">
              <span>Total chats</span>
              <strong>{sessions.length}</strong>
            </div>
            <div className="document-stat">
              <span>Ready docs</span>
              <strong>{processedDocuments.length}</strong>
            </div>
            <div className="document-stat">
              <span>Linked docs</span>
              <strong>{sessions.filter((item) => item.document_id).length}</strong>
            </div>
            <div className="document-stat">
              <span>Last refresh</span>
              <strong>{isRefreshing ? 'Updating' : 'Live'}</strong>
            </div>
          </div>
          <ul className="feature-list">
            <li>Each chat session is tied to a source document so context stays organized.</li>
            <li>The session detail route is already ready for full message compose/send work.</li>
            <li>Deep links from processed documents can preselect the source PDF for faster chat creation.</li>
          </ul>
        </article>
      </div>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      {isLoading ? (
        <ContentSkeleton title="Loading chat sessions..." />
      ) : processedDocuments.length === 0 ? (
        <EmptyState
          eyebrow="No ready documents"
          title="Process a PDF before starting a chat session."
          description="Chat creation only unlocks after a document finishes processing, so the conversation can be grounded in a ready source."
          action={
            <Link className="button" to="/app/documents">
              Open documents
            </Link>
          }
        />
      ) : (
        <>
          <article className="panel document-toolbar">
            <div className="document-toolbar__group">
              <label className="document-field document-field--compact">
                <span className="document-field__label">Search chat sessions</span>
                <input
                  className="field__input"
                  type="search"
                  placeholder="Search by chat title or linked document"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <p className="document-toolbar__summary">
              Showing {filteredSessions.length} of {sessions.length} sessions.
            </p>
          </article>

          {sessions.length === 0 ? (
            <EmptyState
              eyebrow="No chat sessions yet"
              title="Your first document-grounded chat is one click away."
              description="Choose a processed document above and create a dedicated session to prepare for the full AI chat panel."
            />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              eyebrow="No matching chats"
              title="Nothing matches the current search."
              description="Clear the query to see every conversation linked to your processed documents."
              action={
                <button type="button" className="button" onClick={() => setQuery('')}>
                  Clear search
                </button>
              }
            />
          ) : (
            <div className="document-card-grid">
              {filteredSessions.map((session) => {
                const linkedDocument = documentMap.get(session.document_id);
                const sessionTitle = getChatSessionTitle(session, documentMap);
                const statusTone = getChatStatusTone(session.status);

                return (
                  <article className="panel document-card document-card--chat" key={session.id}>
                    <div className="document-card__header">
                      <div>
                        <p className="eyebrow">Updated {formatDocumentDate(session.updated_at)}</p>
                        <h3>{sessionTitle}</h3>
                        <p className="document-card__filename">
                          {linkedDocument
                            ? getDocumentDisplayTitle(linkedDocument)
                            : session.document_id || 'No linked document'}
                        </p>
                      </div>
                      <span className={`status-badge status-badge--${statusTone}`}>
                        {formatChatStatus(session.status)}
                      </span>
                    </div>

                    <div className="document-card__meta">
                      <span>{session.messages.length} messages</span>
                      <span>Created {formatDocumentDate(session.created_at)}</span>
                      <span>{linkedDocument ? 'Source attached' : 'Source unavailable'}</span>
                    </div>

                    <p className="document-card__message">{getLastMessagePreview(session)}</p>

                    <div className="document-card__context">
                      <span className="document-card__context-label">Source context</span>
                      <strong>
                        {linkedDocument
                          ? `Grounded in ${getDocumentDisplayTitle(linkedDocument)}.`
                          : 'This session is missing its document record, so source inspection is limited.'}
                      </strong>
                    </div>

                    <div className="document-card__actions">
                      <Link className="button" to={`/app/chats/${session.id}`}>
                        Open session
                      </Link>
                      {linkedDocument ? (
                        <Link className="button button--ghost" to={`/app/documents/${linkedDocument.id}`}>
                          Open document
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
