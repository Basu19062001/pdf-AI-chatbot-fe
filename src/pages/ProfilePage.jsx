import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user, session } = useAuth();

  return (
    <section className="dashboard-grid">
      <article className="panel">
        <p className="eyebrow">Profile</p>
        <h2>{user?.full_name || 'Unknown user'}</h2>
        <dl className="detail-list">
          <div>
            <dt>Email</dt>
            <dd>{user?.email || 'Unavailable'}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user?.role || 'user'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user?.is_active ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
      </article>

      <article className="panel">
        <p className="eyebrow">Current device</p>
        <h2>{session?.device_name || 'Current browser session'}</h2>
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
            <dt>Session expires</dt>
            <dd>{session?.expires_at ? new Date(session.expires_at).toLocaleString() : 'Unknown'}</dd>
          </div>
        </dl>
      </article>

      <article className="panel panel--wide">
        <p className="eyebrow">Account posture</p>
        <ul className="feature-list">
          <li>Your frontend session is restored on refresh through `/auth/me` or `/auth/refresh`.</li>
          <li>Session visibility and logout controls are already wired into the backend auth model.</li>
          <li>This page is ready for future account preferences and security settings.</li>
        </ul>
      </article>
    </section>
  );
}
