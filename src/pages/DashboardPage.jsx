import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, session } = useAuth();

  return (
    <section className="dashboard-grid">
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
          <li>Router-level route protection for private pages.</li>
          <li>Backend-aligned signup and login validation.</li>
          <li>Bearer token attachment with 401-triggered refresh rotation.</li>
          <li>Session persistence and rehydration after browser reloads.</li>
          <li>Dedicated session management view wired to `/auth/sessions`.</li>
        </ul>
      </article>
    </section>
  );
}

