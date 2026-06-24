import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, session } = useAuth();

  return (
    <section className="panel-stack">
      <article className="panel dashboard-hero">
        <div>
          <p className="eyebrow">Workspace briefing</p>
          <h2>Everything important, above the fold.</h2>
          <p>
            Keep account context, session posture, and document workflow state visible without turning the page into a bulky dashboard.
          </p>
        </div>
        <div className="dashboard-hero__chips">
          <span className="status-chip">Secure</span>
          <span className="pill pill--highlight">Compact</span>
        </div>
      </article>

      <div className="dashboard-overview-grid">
        <article className="panel dashboard-spotlight">
          <p className="eyebrow">Operator</p>
          <h2>{user?.full_name}</h2>
          <p className="dashboard-spotlight__summary">
            Your account anchors every protected route, document library action, and chat session.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user?.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user?.is_active ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel dashboard-metric-board">
          <p className="eyebrow">Current session</p>
          <div className="dashboard-metric-board__grid">
            <div className="document-stat">
              <span>Device</span>
              <strong>{session?.device_name || 'Current device'}</strong>
            </div>
            <div className="document-stat">
              <span>Type</span>
              <strong>{session?.device_type || 'Unknown'}</strong>
            </div>
            <div className="document-stat">
              <span>IP</span>
              <strong>{session?.ip_address || 'Unavailable'}</strong>
            </div>
            <div className="document-stat">
              <span>Expires</span>
              <strong>{session?.expires_at ? new Date(session.expires_at).toLocaleString() : 'Unknown'}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
