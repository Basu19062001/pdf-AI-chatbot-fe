export function ContentSkeleton({ title = 'Loading workspace data...' }) {
  return (
    <section className="content-skeleton" aria-hidden="true">
      <article className="panel content-skeleton__hero skeleton-surface">
        <div className="content-skeleton__hero-top">
          <span className="skeleton-line skeleton-line--tiny" />
          <div className="content-skeleton__hero-pills">
            <span className="skeleton-pill skeleton-pill--muted" />
            <span className="skeleton-pill skeleton-pill--muted" />
          </div>
        </div>
        <div className="content-skeleton__hero-copy">
          <h3>{title}</h3>
          <div className="content-skeleton__lines">
            <span className="skeleton-line skeleton-line--long" />
            <span className="skeleton-line skeleton-line--medium" />
          </div>
        </div>
      </article>

      <div className="content-skeleton__grid">
        <article className="panel skeleton-surface content-skeleton__card">
          <span className="skeleton-line skeleton-line--tiny" />
          <span className="skeleton-line skeleton-line--medium" />
          <span className="skeleton-line skeleton-line--long" />
          <span className="skeleton-line skeleton-line--short" />
        </article>
        <article className="panel skeleton-surface content-skeleton__card">
          <span className="skeleton-line skeleton-line--tiny" />
          <span className="skeleton-line skeleton-line--medium" />
          <span className="skeleton-line skeleton-line--long" />
          <span className="skeleton-line skeleton-line--medium" />
        </article>
        <article className="panel skeleton-surface content-skeleton__card">
          <span className="skeleton-line skeleton-line--tiny" />
          <span className="skeleton-line skeleton-line--medium" />
          <div className="content-skeleton__pills">
            <span className="skeleton-pill" />
            <span className="skeleton-pill skeleton-pill--muted" />
          </div>
        </article>
      </div>
    </section>
  );
}
