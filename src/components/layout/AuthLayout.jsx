import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-layout__brand">
        <p className="eyebrow">Secure knowledge workflows</p>
        <h1>PDF research, grounded answers, and a calmer way to work.</h1>
        <p className="auth-layout__lead">
          This frontend is wired for a token-based FastAPI backend with session tracking,
          rotating refresh tokens, and browser-safe route protection.
        </p>
        <div className="auth-layout__grid">
          <article className="info-tile">
            <span>01</span>
            <h2>Account security</h2>
            <p>Strong-password signup, bearer auth, refresh rotation, and session visibility.</p>
          </article>
          <article className="info-tile">
            <span>02</span>
            <h2>Operational fit</h2>
            <p>Ready for CI, environment-based API targets, and clean service boundaries.</p>
          </article>
        </div>
      </section>
      <section className="auth-layout__content">
        <Outlet />
      </section>
    </main>
  );
}

