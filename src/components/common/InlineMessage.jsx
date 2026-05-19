export function InlineMessage({ tone = 'neutral', children }) {
  const labelByTone = {
    neutral: 'Note',
    success: 'Success',
    error: 'Attention',
  };

  return (
    <div className={`inline-message inline-message--${tone}`}>
      <span className="inline-message__marker" aria-hidden="true" />
      <div className="inline-message__content">
        <strong className="inline-message__label">{labelByTone[tone] || 'Update'}</strong>
        <div className="inline-message__text">{children}</div>
      </div>
    </div>
  );
}
