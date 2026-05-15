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
          Upload PDFs, explore their content with confidence, and keep your document
          conversations organized inside a secure workspace built for focused review.
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
