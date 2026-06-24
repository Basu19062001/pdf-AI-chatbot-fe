import { Outlet } from 'react-router-dom';

import { AppLogo } from '../common/AppLogo';

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="panel auth-layout__intro">
        <div className="auth-layout__intro-top">
          <div className="auth-layout__identity">
            <AppLogo className="auth-layout__logo" label="PDF Atlas" />
            <div>
              <p className="eyebrow">Secure access</p>
              <strong className="auth-layout__product">PDF Atlas</strong>
            </div>
          </div>
          <span className="auth-layout__seal">Private route</span>
        </div>

        <div className="auth-layout__copy">
          <h1>Small, calm, document-first workspace.</h1>
          <p className="auth-layout__lead">
            Sign in to manage PDFs, monitor processing, and keep every chat tied to a real source.
          </p>
        </div>

        <div className="auth-layout__mini-grid">
          <article className="auth-layout__mini-card">
            <span>Source</span>
            <strong>Ready PDFs stay central</strong>
          </article>
          <article className="auth-layout__mini-card">
            <span>Security</span>
            <strong>Session-aware account access</strong>
          </article>
          <article className="auth-layout__mini-card">
            <span>Chat</span>
            <strong>Conversations stay grounded</strong>
          </article>
        </div>
      </section>

      <section className="auth-layout__stage">
        <div className="auth-layout__content-shell">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
