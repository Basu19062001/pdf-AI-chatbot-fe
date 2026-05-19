export function EmptyState({ eyebrow, title, description, action = null, secondary = null }) {
  return (
    <article className="empty-state">
      <div className="empty-state__mark" aria-hidden="true">
        <span className="empty-state__mark-core" />
      </div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {action || secondary ? (
        <div className="empty-state__actions">
          {action}
          {secondary}
        </div>
      ) : null}
    </article>
  );
}
