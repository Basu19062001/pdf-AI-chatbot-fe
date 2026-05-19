import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { ContentSkeleton } from '../components/common/ContentSkeleton';
import { DocumentStatusBadge } from '../components/common/DocumentStatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { InlineMessage } from '../components/common/InlineMessage';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { documentsApi } from '../services/api/documents';
import {
  DOCUMENT_MAX_FILE_SIZE_BYTES,
  formatDocumentDate,
  formatFileSize,
  getDocumentDisplayTitle,
  getDocumentStatusMessage,
  isDocumentFailed,
  isDocumentPending,
  isDocumentReady,
  validateDocumentFile,
} from '../utils/documents';

const statusFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

export function DocumentsPage() {
  const fileInputRef = useRef(null);
  const { getApiErrorMessage } = useAuth();
  const { pushToast } = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const deferredQuery = useDeferredValue(query);

  const loadDocuments = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const nextItems = await documentsApi.listDocuments({ force: silent });
        setItems(nextItems);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Unable to load your document library.'));
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
    loadDocuments();
  }, [loadDocuments]);

  const hasPendingDocuments = useMemo(
    () => items.some((item) => isDocumentPending(item.status)),
    [items],
  );

  useEffect(() => {
    if (!hasPendingDocuments || isUploading) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (!document.hidden) {
        loadDocuments({ silent: true });
      }
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasPendingDocuments, isUploading, loadDocuments]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        getDocumentDisplayTitle(item).toLowerCase().includes(normalizedQuery) ||
        item.original_file_name.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) {
        return false;
      }

      if (statusFilter === 'ready') {
        return isDocumentReady(item.status);
      }

      if (statusFilter === 'processing') {
        return isDocumentPending(item.status);
      }

      if (statusFilter === 'failed') {
        return isDocumentFailed(item.status);
      }

      return true;
    });
  }, [deferredQuery, items, statusFilter]);

  const readyCount = useMemo(
    () => items.filter((item) => isDocumentReady(item.status)).length,
    [items],
  );
  const processingCount = useMemo(
    () => items.filter((item) => isDocumentPending(item.status)).length,
    [items],
  );
  const failedCount = useMemo(
    () => items.filter((item) => isDocumentFailed(item.status)).length,
    [items],
  );

  const attentionItems = useMemo(
    () => filteredItems.filter((item) => !isDocumentReady(item.status)),
    [filteredItems],
  );
  const readyItems = useMemo(
    () => filteredItems.filter((item) => isDocumentReady(item.status)),
    [filteredItems],
  );

  function resetSelection() {
    setSelectedFile(null);
    setTitle('');
    setUploadError('');
    setUploadProgress(0);
    setUploadPhase('idle');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleSelectedFile(file) {
    const validationError = validateDocumentFile(file);

    if (validationError) {
      setSelectedFile(null);
      setUploadError(validationError);
      return;
    }

    setSelectedFile(file);
    setUploadError('');
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    handleSelectedFile(event.dataTransfer.files?.[0] || null);
  }

  async function handleUpload(event) {
    event.preventDefault();

    const validationError = validateDocumentFile(selectedFile);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');

    try {
      const uploadResponse = await documentsApi.uploadDocument({
        file: selectedFile,
        title: title.trim(),
        onUploadProgress: (nextProgress) => {
          setUploadProgress(nextProgress);
          if (nextProgress >= 100) {
            setUploadPhase('processing');
          }
        },
      });

      const uploadedDocument = await documentsApi
        .getDocument(uploadResponse.document_id)
        .catch(() => null);

      if (uploadedDocument) {
        setItems((current) => [
          uploadedDocument,
          ...current.filter((item) => item.id !== uploadedDocument.id),
        ]);
      } else {
        await loadDocuments({ silent: true });
      }

      const titleForToast = uploadedDocument
        ? getDocumentDisplayTitle(uploadedDocument)
        : selectedFile.name.replace(/\.pdf$/i, '');

      pushToast({
        tone: uploadResponse.status === 'failed' ? 'warning' : 'success',
        title: 'Document uploaded',
        message:
          uploadResponse.status === 'processed'
            ? `${titleForToast} is ready with ${uploadResponse.pages} pages prepared for chat.`
            : `${titleForToast} is in the processing queue. We will keep the library refreshed automatically.`,
      });

      resetSelection();
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to upload the selected PDF.');
      setUploadError(message);
      pushToast({
        tone: 'warning',
        title: 'Upload failed',
        message,
      });
    } finally {
      setIsUploading(false);
      setUploadPhase('idle');
    }
  }

  return (
    <section className="panel-stack document-page">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Document management</p>
          <h2>Your PDF library is now live.</h2>
          <p>
            Upload documents, monitor processing outcomes, and move only ready PDFs
            forward into chat workflows.
          </p>
        </div>
        <div className="document-page__header-actions">
          <span className="status-chip">{items.length} total documents</span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => loadDocuments({ silent: true })}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh library'}
          </button>
        </div>
      </article>

      <div className="document-page__hero-grid">
        <article className="panel document-upload">
          <div className="document-upload__header">
            <div>
              <p className="eyebrow">Upload PDF</p>
              <h3>Add a new source document</h3>
            </div>
            <span className="pill">Max {formatFileSize(DOCUMENT_MAX_FILE_SIZE_BYTES)}</span>
          </div>

          <form className="document-upload__form" onSubmit={handleUpload}>
            <button
              type="button"
              className={`document-upload__dropzone ${isDragActive ? 'document-upload__dropzone--active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                className="document-upload__input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => handleSelectedFile(event.target.files?.[0] || null)}
              />
              <strong>Drag a PDF here or click to browse</strong>
              <span>Only PDF files are accepted, and the backend currently allows up to 10 MB per upload.</span>
            </button>

            <label className="document-field">
              <span className="document-field__label">Optional custom title</span>
              <input
                className="field__input"
                type="text"
                placeholder="Leave blank to use the PDF filename"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={255}
              />
            </label>

            {selectedFile ? (
              <div className="document-upload__selected-file">
                <div>
                  <strong>{selectedFile.name}</strong>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
                <button type="button" className="button button--ghost" onClick={resetSelection}>
                  Clear
                </button>
              </div>
            ) : null}

            {uploadError ? <InlineMessage tone="error">{uploadError}</InlineMessage> : null}

            {isUploading ? (
              <div className="document-upload__progress">
                <div className="document-upload__progress-copy">
                  <strong>
                    {uploadPhase === 'processing'
                      ? 'Upload finished. Backend processing is running...'
                      : 'Uploading your PDF...'}
                  </strong>
                  <span>{Math.min(uploadProgress, 100)}%</span>
                </div>
                <div className="document-upload__progress-bar">
                  <span style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
                </div>
              </div>
            ) : null}

            <div className="document-upload__actions">
              <button type="submit" className="button" disabled={isUploading || !selectedFile}>
                {isUploading ? 'Working...' : 'Upload document'}
              </button>
              <p>
                Once uploaded, failed documents stay visible and ready documents can
                move directly into chat creation.
              </p>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Library health</p>
          <h3>Keep an eye on readiness before chat creation.</h3>
          <div className="document-stat-grid">
            <div className="document-stat">
              <span>Ready</span>
              <strong>{readyCount}</strong>
            </div>
            <div className="document-stat">
              <span>Processing</span>
              <strong>{processingCount}</strong>
            </div>
            <div className="document-stat">
              <span>Failed</span>
              <strong>{failedCount}</strong>
            </div>
            <div className="document-stat">
              <span>Auto refresh</span>
              <strong>{hasPendingDocuments ? 'On' : 'Idle'}</strong>
            </div>
          </div>
          <ul className="feature-list">
            <li>Ready documents surface a chat CTA only after processing is complete.</li>
            <li>Pending documents are auto-refreshed so long-running processing is easier to follow.</li>
            <li>Failed items remain visible with clear retry guidance instead of disappearing.</li>
          </ul>
        </article>
      </div>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      {isLoading ? (
        <ContentSkeleton title="Loading your document library..." />
      ) : (
        <>
          <article className="panel document-toolbar">
            <div className="document-toolbar__group">
              <label className="document-field document-field--compact">
                <span className="document-field__label">Search documents</span>
                <input
                  className="field__input"
                  type="search"
                  placeholder="Search by title or filename"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <label className="document-field document-field--compact">
                <span className="document-field__label">Filter by status</span>
                <select
                  className="field__input document-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="document-toolbar__summary">
              Showing {filteredItems.length} of {items.length} documents.
            </p>
          </article>

          {items.length === 0 ? (
            <EmptyState
              eyebrow="No documents yet"
              title="Your workspace is ready for its first PDF."
              description="Upload a document above to start building the library that will power document-grounded chat sessions."
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              eyebrow="No matching documents"
              title="Nothing matches the current search and filter."
              description="Clear the current query or switch back to all statuses to see the rest of your library."
              action={
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              {attentionItems.length > 0 ? (
                <section className="panel-stack">
                  <div className="document-section__header">
                    <div>
                      <p className="eyebrow">Needs attention</p>
                      <h3>Processing and failed documents</h3>
                    </div>
                    <span className="status-chip">{attentionItems.length} items</span>
                  </div>

                  <div className="document-card-grid">
                    {attentionItems.map((item) => (
                      <article
                        className={`panel document-card ${
                          isDocumentFailed(item.status)
                            ? 'document-card--failed'
                            : 'document-card--pending'
                        }`}
                        key={item.id}
                      >
                        <div className="document-card__header">
                          <div>
                            <p className="eyebrow">
                              Uploaded {formatDocumentDate(item.uploaded_at)}
                            </p>
                            <h3>{getDocumentDisplayTitle(item)}</h3>
                            <p className="document-card__filename">{item.original_file_name}</p>
                          </div>
                          <DocumentStatusBadge status={item.status} />
                        </div>

                        <div className="document-card__meta">
                          <span>{formatFileSize(item.file_size_bytes)}</span>
                          <span>{item.total_pages ? `${item.total_pages} pages` : 'Pages pending'}</span>
                          <span>{item.file_type?.toUpperCase() || 'PDF'}</span>
                        </div>

                        <p className="document-card__message">
                          {getDocumentStatusMessage(item)}
                        </p>

                        <div className="document-card__context">
                          <span className="document-card__context-label">Workspace guidance</span>
                          <strong>
                            {isDocumentFailed(item.status)
                              ? 'This file needs replacement before it can support grounded chat.'
                              : 'Keep this file visible while ingestion completes in the background.'}
                          </strong>
                        </div>

                        <div className="document-card__actions">
                          <Link className="button button--ghost" to={`/app/documents/${item.id}`}>
                            Open details
                          </Link>
                          <button type="button" className="button button--ghost" disabled>
                            {isDocumentFailed(item.status) ? 'Retry with a new PDF' : 'Awaiting processing'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {readyItems.length > 0 ? (
                <section className="panel-stack">
                  <div className="document-section__header">
                    <div>
                      <p className="eyebrow">Ready library</p>
                      <h3>Processed documents ready for chat</h3>
                    </div>
                    <span className="status-chip">{readyItems.length} ready</span>
                  </div>

                  <div className="document-card-grid">
                    {readyItems.map((item) => (
                      <article className="panel document-card document-card--ready" key={item.id}>
                        <div className="document-card__header">
                          <div>
                            <p className="eyebrow">
                              Processed {formatDocumentDate(item.processed_at)}
                            </p>
                            <h3>{getDocumentDisplayTitle(item)}</h3>
                            <p className="document-card__filename">{item.original_file_name}</p>
                          </div>
                          <DocumentStatusBadge status={item.status} />
                        </div>

                        <div className="document-card__meta">
                          <span>{formatFileSize(item.file_size_bytes)}</span>
                          <span>{item.total_pages ? `${item.total_pages} pages` : 'Pages unavailable'}</span>
                          <span>{item.file_type?.toUpperCase() || 'PDF'}</span>
                        </div>

                        <p className="document-card__message">
                          {getDocumentStatusMessage(item)}
                        </p>

                        <div className="document-card__context">
                          <span className="document-card__context-label">Chat readiness</span>
                          <strong>
                            This source is fully prepared for a dedicated conversation workspace.
                          </strong>
                        </div>

                        <div className="document-card__actions">
                          <Link className="button button--ghost" to={`/app/documents/${item.id}`}>
                            Open details
                          </Link>
                          <Link className="button" to={`/app/chats?documentId=${item.id}`}>
                            Start chat
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </>
      )}
    </section>
  );
}
