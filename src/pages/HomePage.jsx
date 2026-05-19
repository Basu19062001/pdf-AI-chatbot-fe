import { Link } from 'react-router-dom';

import { AppLogo } from '../components/common/AppLogo';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="marketing-shell">
      <section className="hero-card">
        <div className="hero-card__grid">
          <div className="hero-card__copy">
            <div className="hero-card__brand-row">
              <AppLogo className="hero-card__brand-logo" />
              <div>
                <p className="eyebrow">Document-grounded workspace</p>
                <strong className="hero-card__brand-name">PDF Atlas</strong>
              </div>
            </div>
            <h1>Smarter PDF review with less noise.</h1>
            <p className="hero-card__body">
              Upload source files, track readiness, and open compact chat workspaces that stay visually tied to the document.
            </p>
            <div className="hero-card__actions">
              <Link className="button" to={isAuthenticated ? '/app' : '/login'}>
                {isAuthenticated ? 'Open workspace' : 'Sign in'}
              </Link>
              <Link className="button button--ghost" to="/signup">
                Create account
              </Link>
            </div>
          </div>

          <div className="hero-card__stack">
            <article className="hero-card__floating-panel">
              <span>Upload</span>
              <strong>Small, clean document cards with visible processing state.</strong>
            </article>
            <article className="hero-card__floating-panel">
              <span>Inspect</span>
              <strong>Metadata and readiness stay easy to scan before chat begins.</strong>
            </article>
            <article className="hero-card__floating-panel hero-card__floating-panel--accent">
              <span>Chat</span>
              <strong>Conversations open beside their source context instead of a noisy inbox.</strong>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
