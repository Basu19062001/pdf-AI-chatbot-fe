import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="marketing-shell">
      <section className="hero-card">
        <p className="eyebrow">Production-ready React frontend</p>
        <h1>Secure document intelligence for teams that need trustworthy answers.</h1>
        <p className="hero-card__body">
          This frontend is designed to connect to your FastAPI backend with bearer auth,
          refresh-token rotation, route protection, and a clean integration layer you can
          extend into uploads, chat sessions, and workspace features.
        </p>
        <div className="hero-card__actions">
          <Link className="button" to={isAuthenticated ? '/app' : '/login'}>
            {isAuthenticated ? 'Open dashboard' : 'Sign in'}
          </Link>
          <Link className="button button--ghost" to="/signup">
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}

