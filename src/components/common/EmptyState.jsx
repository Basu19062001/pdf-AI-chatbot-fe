export function EmptyState({ eyebrow, title, description, action = null, secondary = null }) {
  return (
    <article className="empty-state">
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
