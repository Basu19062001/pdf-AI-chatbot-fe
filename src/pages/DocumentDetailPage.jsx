import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ContentSkeleton } from '../components/common/ContentSkeleton';
import { DocumentStatusBadge } from '../components/common/DocumentStatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { InlineMessage } from '../components/common/InlineMessage';
import { documentsApi } from '../services/api/documents';
import { useAuth } from '../hooks/useAuth';
import {
  formatDocumentDate,
  formatFileSize,
  getDocumentDisplayTitle,
  getDocumentStatusMessage,
  isDocumentFailed,
  isDocumentReady,
} from '../utils/documents';

export function DocumentDetailPage() {
  const { documentId } = useParams();
  const { getApiErrorMessage } = useAuth();
  const [documentItem, setDocumentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocument = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const nextDocument = await documentsApi.getDocument(documentId);
      setDocumentItem(nextDocument);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load the requested document.'));
    } finally {
      setIsLoading(false);
    }
  }, [documentId, getApiErrorMessage]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  if (isLoading) {
    return <ContentSkeleton title="Loading document details..." />;
  }

  if (error) {
    return (
      <section className="panel-stack">
        <InlineMessage tone="error">{error}</InlineMessage>
        <EmptyState
          eyebrow="Document unavailable"
          title="We couldn&apos;t load that PDF right now."
          description="Try returning to the document library and re-opening the document after the next refresh."
          action={
            <Link className="button" to="/app/documents">
              Back to documents
            </Link>
          }
        />
      </section>
    );
  }

  const title = getDocumentDisplayTitle(documentItem);
  const isReady = isDocumentReady(documentItem.status);
  const hasFailed = isDocumentFailed(documentItem.status);

  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Document detail</p>
          <h2>{title}</h2>
          <p>
            Review the file metadata, readiness state, and upload timing for this PDF
            before starting downstream chat workflows.
          </p>
        </div>
        <div className="document-detail__hero-actions">
          <DocumentStatusBadge status={documentItem.status} />
          <Link className="button button--ghost" to="/app/documents">
            Back to library
          </Link>
        </div>
      </article>

      {hasFailed ? (
        <InlineMessage tone="error">{getDocumentStatusMessage(documentItem)}</InlineMessage>
      ) : null}

      <div className="document-detail__hero-grid">
        <article className="panel document-detail__summary">
          <p className="eyebrow">Readiness</p>
          <h3>{getDocumentStatusMessage(documentItem)}</h3>
          <p>
            Original file: <strong>{documentItem.original_file_name}</strong>
          </p>

          <div className="document-detail__action-row">
            {isReady ? (
              <Link className="button" to={`/app/chats?documentId=${documentItem.id}`}>
                Start chat
              </Link>
            ) : (
              <button type="button" className="button button--ghost" disabled>
                {hasFailed ? 'Processing failed' : 'Awaiting processing'}
              </button>
            )}
            <button type="button" className="button button--ghost" onClick={loadDocument}>
              Refresh status
            </button>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Snapshot</p>
          <div className="document-stat-grid">
            <div className="document-stat">
              <span>Pages</span>
              <strong>{documentItem.total_pages ?? 'Pending'}</strong>
            </div>
            <div className="document-stat">
              <span>Size</span>
              <strong>{formatFileSize(documentItem.file_size_bytes)}</strong>
            </div>
            <div className="document-stat">
              <span>Type</span>
              <strong>{documentItem.file_type?.toUpperCase() || 'PDF'}</strong>
            </div>
            <div className="document-stat">
              <span>Updated</span>
              <strong>{formatDocumentDate(documentItem.updated_at)}</strong>
            </div>
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <p className="eyebrow">Metadata</p>
          <h3>Stored document record</h3>
          <dl className="detail-list">
            <div>
              <dt>Document ID</dt>
              <dd>{documentItem.id}</dd>
            </div>
            <div>
              <dt>Uploaded at</dt>
              <dd>{formatDocumentDate(documentItem.uploaded_at)}</dd>
            </div>
            <div>
              <dt>Processed at</dt>
              <dd>{formatDocumentDate(documentItem.processed_at)}</dd>
            </div>
            <div>
              <dt>Stored file name</dt>
              <dd>{documentItem.stored_file_name}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Processing state</p>
          <h3>Status-driven guidance</h3>
          <ul className="feature-list">
            <li>Processed documents can move forward into chat session creation.</li>
            <li>Processing documents should be refreshed until page counts appear.</li>
            <li>Failed documents stay visible so users can retry with a corrected PDF.</li>
          </ul>
          {documentItem.file_url ? (
            <a className="button button--ghost document-detail__file-link" href={documentItem.file_url} target="_blank" rel="noreferrer">
              Open stored file
            </a>
          ) : (
            <p className="document-detail__helper">
              This backend currently stores the file internally, so no public file link is exposed yet.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
