import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, session } = useAuth();

  return (
    <section className="panel-stack">
      <article className="page-section-header panel">
        <div>
          <p className="eyebrow">App shell</p>
          <h2>Phase 2 foundation is now active.</h2>
          <p>
            The workspace shell, guarded routes, user menu, and shared app surfaces are
            in place so document and chat features can land on stable UI foundations.
          </p>
        </div>
        <span className="status-chip">Roadmap phase 2</span>
      </article>

      <div className="dashboard-grid">
      <article className="panel">
        <p className="eyebrow">Authenticated user</p>
        <h2>{user?.full_name}</h2>
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

      <article className="panel">
        <p className="eyebrow">Current session</p>
        <h2>{session?.device_name || 'Current device'}</h2>
        <dl className="detail-list">
          <div>
            <dt>Device type</dt>
            <dd>{session?.device_type || 'Unknown'}</dd>
          </div>
          <div>
            <dt>IP address</dt>
            <dd>{session?.ip_address || 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Expires at</dt>
            <dd>{session?.expires_at ? new Date(session.expires_at).toLocaleString() : 'Unknown'}</dd>
          </div>
        </dl>
      </article>

      <article className="panel panel--wide">
        <p className="eyebrow">What is already production-ready</p>
        <ul className="feature-list">
          <li>Protected shell with sidebar navigation and top bar.</li>
          <li>User profile menu with route actions and logout.</li>
          <li>Shared skeleton loading while session bootstrap runs.</li>
          <li>Global toast system ready for cross-app feedback.</li>
          <li>Placeholder product sections for documents and chats.</li>
        </ul>
      </article>
      </div>
    </section>
  );
}
