import { Link } from 'react-router-dom';

import { EmptyState } from '../components/common/EmptyState';

export function ChatsPage() {
  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">Chats</p>
          <h2>Conversation shell is ready</h2>
          <p>
            Chat session management and the AI conversation panel will plug into this
            protected workspace after document flows are in place.
          </p>
        </div>
        <span className="status-chip">Phase 4 and 5 next</span>
      </article>

      <EmptyState
        eyebrow="No chat sessions yet"
        title="Document-grounded conversations will appear here."
        description="This area will list chat sessions per document, show latest activity, and open the full source-aware chat panel."
        action={
          <Link className="button" to="/app/documents">
            Open documents area
          </Link>
        }
        secondary={
          <Link className="button button--ghost" to="/app/dashboard">
            View workspace overview
          </Link>
        }
      />
    </section>
  );
}
