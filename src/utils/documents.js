export const DOCUMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeStatus(status) {
  return typeof status === 'string' ? status.toLowerCase() : 'uploaded';
}

export function getDocumentDisplayTitle(document) {
  const title = document?.title?.trim();
  if (title) {
    return title;
  }

  const originalName = document?.original_file_name?.trim();
  if (originalName) {
    return originalName.replace(/\.pdf$/i, '');
  }

  return 'Untitled document';
}

export function formatDocumentStatus(status) {
  const normalized = normalizeStatus(status);

  if (normalized === 'processed') {
    return 'Ready';
  }

  if (normalized === 'processing') {
    return 'Processing';
  }

  if (normalized === 'failed') {
    return 'Failed';
  }

  return 'Uploaded';
}

export function getDocumentStatusTone(status) {
  const normalized = normalizeStatus(status);

  if (normalized === 'processed') {
    return 'success';
  }

  if (normalized === 'failed') {
    return 'danger';
  }

  if (normalized === 'processing') {
    return 'warning';
  }

  return 'neutral';
}

export function isDocumentReady(status) {
  return normalizeStatus(status) === 'processed';
}

export function isDocumentFailed(status) {
  return normalizeStatus(status) === 'failed';
}

export function isDocumentPending(status) {
  const normalized = normalizeStatus(status);
  return normalized === 'uploaded' || normalized === 'processing';
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'Unknown size';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function formatDocumentDate(value) {
  if (!value) {
    return 'Unavailable';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unavailable';
  }

  return parsed.toLocaleString();
}

export function getDocumentStatusMessage(document) {
  if (isDocumentReady(document?.status)) {
    return 'This document has finished processing and is ready for chat session creation.';
  }

  if (isDocumentFailed(document?.status)) {
    return document?.error_message || 'Processing failed before the document became ready.';
  }

  return 'The PDF is still being prepared. Refreshing the library will pick up the latest processing state.';
}

export function validateDocumentFile(file) {
  if (!file) {
    return 'Choose a PDF file to continue.';
  }

  const hasPdfExtension = /\.pdf$/i.test(file.name || '');
  const isPdfMimeType =
    file.type === 'application/pdf' || file.type === 'application/x-pdf';

  if (!hasPdfExtension && !isPdfMimeType) {
    return 'Only PDF files are supported.';
  }

  if (file.size === 0) {
    return 'The selected PDF is empty.';
  }

  if (file.size > DOCUMENT_MAX_FILE_SIZE_BYTES) {
    return 'The selected PDF exceeds the 10 MB upload limit.';
  }

  return '';
}
