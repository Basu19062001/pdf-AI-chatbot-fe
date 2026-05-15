import { Link } from 'react-router-dom';

import { EmptyState } from '../components/common/EmptyState';

export function DocumentsPage() {
  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Documents</p>
          <h2>Document workspace foundation</h2>
          <p>
            This shell is ready for the upload, processing, and document detail flows
            planned in the next roadmap phase.
          </p>
        </div>
        <span className="status-chip">Phase 3 next</span>
      </article>

      <div className="dashboard-grid">
        <article className="panel">
          <p className="eyebrow">Prepared surface</p>
          <h3>What will land here next</h3>
          <ul className="feature-list">
            <li>Document list backed by `GET /api/v1/documents/`.</li>
            <li>Upload flow with status-driven feedback.</li>
            <li>Document detail view with readiness state.</li>
          </ul>
        </article>

        <EmptyState
          eyebrow="No documents yet"
          title="Your PDF library will live in this area."
          description="Once document management is implemented, uploaded PDFs, processing states, and document actions will appear here."
          action={
            <Link className="button" to="/app/dashboard">
              Back to overview
            </Link>
          }
          secondary={
            <Link className="button button--ghost" to="/app/sessions">
              Review active sessions
            </Link>
          }
        />
      </div>
    </section>
  );
}
