import {
  formatDocumentStatus,
  getDocumentStatusTone,
} from '../../utils/documents';

export function DocumentStatusBadge({ status }) {
  const tone = getDocumentStatusTone(status);

  return (
    <span className={`status-badge status-badge--${tone}`}>
      {formatDocumentStatus(status)}
    </span>
  );
}
