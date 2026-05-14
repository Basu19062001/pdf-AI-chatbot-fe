import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-layout__brand">
        <div className="auth-layout__masthead">
          <div className="auth-layout__identity">
            <span className="auth-layout__logo">P</span>
            <div>
              <p className="eyebrow">Secure PDF workspace</p>
              <p className="auth-layout__product">PDF Chatbot Console</p>
            </div>
          </div>
          <span className="auth-layout__seal">Encrypted access</span>
        </div>
        <h1>Sign in to the document desk built for serious PDF work.</h1>
        <p className="auth-layout__lead">
          Review files, organize extracted knowledge, and keep every authenticated
          session tied to a protected research workspace.
        </p>
        <div className="auth-layout__stats">
          <div className="auth-stat">
            <strong>01</strong>
            <span>Secure session lifecycle</span>
          </div>
          <div className="auth-stat">
            <strong>02</strong>
            <span>Structured PDF review flow</span>
          </div>
          <div className="auth-stat">
            <strong>03</strong>
            <span>Production-ready frontend foundation</span>
          </div>
        </div>
        <div className="paper-preview" aria-hidden="true">
          <div className="paper-preview__sheet paper-preview__sheet--back" />
          <div className="paper-preview__sheet paper-preview__sheet--front">
            <div className="paper-preview__header">
              <span />
              <span />
              <span />
            </div>
            <div className="paper-preview__title" />
            <div className="paper-preview__line paper-preview__line--short" />
            <div className="paper-preview__line" />
            <div className="paper-preview__line" />
            <div className="paper-preview__line paper-preview__line--short" />
            <div className="paper-preview__stamp">Verified PDF</div>
          </div>
        </div>
        <div className="auth-layout__grid">
          <article className="info-tile">
            <span>01</span>
            <h2>Trusted access</h2>
            <p>Strong-password signup, bearer auth, refresh rotation, and visible device sessions.</p>
          </article>
          <article className="info-tile">
            <span>02</span>
            <h2>Document-first flow</h2>
            <p>A calmer white-and-ink surface that feels closer to reading and reviewing files.</p>
          </article>
        </div>
        <div className="auth-layout__footer-note">
          <span className="auth-layout__footer-dot" />
          Workspace access is designed to feel like opening a reviewed document, not entering a noisy dashboard.
        </div>
      </section>
      <section className="auth-layout__content">
        <div className="auth-layout__content-shell">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
