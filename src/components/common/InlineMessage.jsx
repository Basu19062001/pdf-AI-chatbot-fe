export function InlineMessage({ tone = 'neutral', children }) {
  return <div className={`inline-message inline-message--${tone}`}>{children}</div>;
}

