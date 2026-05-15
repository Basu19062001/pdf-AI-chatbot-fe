import { useEffect, useState } from 'react';

import { ContentSkeleton } from '../components/common/ContentSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { InlineMessage } from '../components/common/InlineMessage';
import { useAuth } from '../hooks/useAuth';

export function SessionsPage() {
  const { listSessions, session, getApiErrorMessage } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      setIsLoading(true);
      setError('');

      try {
        const nextItems = await listSessions();
        if (active) {
          setItems(nextItems);
        }
      } catch (loadError) {
        if (active) {
          setError(getApiErrorMessage(loadError, 'Unable to load active sessions.'));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      active = false;
    };
  }, [getApiErrorMessage, listSessions]);

  return (
    <section className="panel-stack">
      <article className="panel">
        <p className="eyebrow">Session intelligence</p>
        <h2>Active authenticated sessions</h2>
        <p>
          These values come from the backend&apos;s persisted auth sessions and reflect
          the refresh-token aware session model behind your login flow.
        </p>
      </article>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      {isLoading ? (
        <ContentSkeleton title="Loading active sessions..." />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="No active sessions"
          title="No device sessions are available yet."
          description="Once authenticated sessions are issued by the backend, device and refresh lifecycle details will appear here."
        />
      ) : (
        <div className="session-grid">
          {items.map((item) => {
            const isCurrentSession = item.id === session?.id;

            return (
              <article className="panel" key={item.id}>
                <div className="session-card__header">
                  <div>
                    <p className="eyebrow">{isCurrentSession ? 'Current session' : 'Active session'}</p>
                    <h3>{item.device_name || 'Unknown device'}</h3>
                  </div>
                  <span className={`pill ${isCurrentSession ? 'pill--highlight' : ''}`}>
                    {item.device_type || 'unknown'}
                  </span>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Session ID</dt>
                    <dd>{item.id}</dd>
                  </div>
                  <div>
                    <dt>Issued at</dt>
                    <dd>{new Date(item.issued_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Last seen</dt>
                    <dd>{new Date(item.last_seen_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Refresh expires</dt>
                    <dd>{item.refresh_expires_at ? new Date(item.refresh_expires_at).toLocaleString() : 'Unknown'}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
