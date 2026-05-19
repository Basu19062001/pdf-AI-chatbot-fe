import { AppLogo } from './AppLogo';

export function FullScreenLoader({ label, variant = 'app' }) {
  const isAuthVariant = variant === 'auth';
  const accentTitle = isAuthVariant ? 'Securing entry' : 'Rebuilding workspace context';

  return (
    <section className={`fullscreen-loader fullscreen-loader--${variant}`} role="status" aria-live="polite">
      <div className="fullscreen-loader__backdrop" aria-hidden="true" />
      <div className="fullscreen-loader__shell">
        <div className="fullscreen-loader__header">
          <div className="fullscreen-loader__identity">
            <AppLogo className="fullscreen-loader__logo" label={isAuthVariant ? 'PDF Atlas auth loading' : 'PDF Atlas loading'} />
            <div className="fullscreen-loader__identity-copy">
              <span className="skeleton-line skeleton-line--short" />
              <span className="skeleton-line skeleton-line--tiny" />
            </div>
          </div>
          <div className="fullscreen-loader__nav" aria-hidden="true">
            <span className="skeleton-pill" />
            <span className="skeleton-pill skeleton-pill--muted" />
            <span className="skeleton-pill skeleton-pill--muted" />
          </div>
        </div>

        <div className="fullscreen-loader__body">
          <div className="fullscreen-loader__hero">
            <span className="fullscreen-loader__eyebrow">{accentTitle}</span>
            <h2>{label}</h2>
            <p>
              Refreshing your secure session, restoring page state, and preparing the next view.
            </p>
            <div className="fullscreen-loader__signal-row" aria-hidden="true">
              <span className="fullscreen-loader__signal-pill">Tokens</span>
              <span className="fullscreen-loader__signal-pill">Routes</span>
              <span className="fullscreen-loader__signal-pill">Documents</span>
            </div>
            <div className="fullscreen-loader__hero-lines" aria-hidden="true">
              <span className="skeleton-line skeleton-line--long" />
              <span className="skeleton-line skeleton-line--medium" />
            </div>
          </div>

          <div className="fullscreen-loader__preview" aria-hidden="true">
            <div className="fullscreen-loader__preview-sheet fullscreen-loader__preview-sheet--back skeleton-surface" />
            <div className="fullscreen-loader__preview-sheet fullscreen-loader__preview-sheet--front skeleton-surface">
              <span className="skeleton-line skeleton-line--medium" />
              <span className="skeleton-line skeleton-line--long" />
              <span className="skeleton-line skeleton-line--long" />
              <span className="skeleton-line skeleton-line--short" />
            </div>
          </div>
        </div>

        <div className="fullscreen-loader__grid" aria-hidden="true">
          <article className="skeleton-card skeleton-surface">
            <span className="skeleton-line skeleton-line--tiny" />
            <span className="skeleton-line skeleton-line--medium" />
            <span className="skeleton-line skeleton-line--long" />
            <span className="skeleton-line skeleton-line--short" />
          </article>
          <article className="skeleton-card skeleton-surface">
            <span className="skeleton-line skeleton-line--tiny" />
            <span className="skeleton-line skeleton-line--medium" />
            <span className="skeleton-line skeleton-line--long" />
            <span className="skeleton-line skeleton-line--medium" />
          </article>
          <article className="skeleton-card skeleton-card--wide skeleton-surface">
            <span className="skeleton-line skeleton-line--tiny" />
            <span className="skeleton-line skeleton-line--long" />
            <div className="fullscreen-loader__metric-row">
              <span className="skeleton-pill" />
              <span className="skeleton-pill skeleton-pill--muted" />
              <span className="skeleton-pill skeleton-pill--muted" />
            </div>
          </article>
        </div>

        <div className="fullscreen-loader__footer" aria-hidden="true">
          <div className="fullscreen-loader__footer-item">
            <span />
            <p>Context</p>
          </div>
          <div className="fullscreen-loader__footer-item">
            <span />
            <p>Source state</p>
          </div>
          <div className="fullscreen-loader__footer-item">
            <span />
            <p>Session rail</p>
          </div>
        </div>
      </div>
    </section>
  );
}
