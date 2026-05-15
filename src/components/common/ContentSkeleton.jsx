export function ContentSkeleton({ title = 'Loading workspace data...' }) {
  return (
    <section className="content-skeleton" aria-hidden="true">
      <article className="panel content-skeleton__hero skeleton-surface">
        <span className="skeleton-line skeleton-line--tiny" />
        <h3>{title}</h3>
        <div className="content-skeleton__lines">
          <span className="skeleton-line skeleton-line--long" />
          <span className="skeleton-line skeleton-line--medium" />
        </div>
      </article>

      <div className="content-skeleton__grid">
        <article className="panel skeleton-surface">
          <span className="skeleton-line skeleton-line--tiny" />
          <span className="skeleton-line skeleton-line--medium" />
          <span className="skeleton-line skeleton-line--long" />
          <span className="skeleton-line skeleton-line--short" />
        </article>
        <article className="panel skeleton-surface">
          <span className="skeleton-line skeleton-line--tiny" />
          <span className="skeleton-line skeleton-line--medium" />
          <span className="skeleton-line skeleton-line--long" />
          <span className="skeleton-line skeleton-line--medium" />
        </article>
        <article className="panel skeleton-surface">
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
