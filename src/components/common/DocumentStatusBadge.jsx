import {
  formatDocumentStatus,
  getDocumentStatusTone,
} from '../../utils/documents';

export function DocumentStatusBadge({ status }) {
  const tone = getDocumentStatusTone(status);
  const statusLabel = formatDocumentStatus(status);

  const accentByTone = {
    success: 'Ready',
    warning: 'Live',
    danger: 'Alert',
    neutral: 'Stored',
  };

  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__copy">
        <span className="status-badge__label">{statusLabel}</span>
        <span className="status-badge__meta">{accentByTone[tone] || 'State'}</span>
      </span>
    </span>
  );
}
