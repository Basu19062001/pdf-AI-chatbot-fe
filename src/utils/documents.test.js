import {
  formatDocumentStatus,
  getDocumentDisplayTitle,
  getDocumentStatusTone,
  isDocumentPending,
  validateDocumentFile,
} from './documents';

describe('document utils', () => {
  it('prefers the explicit title when building the display title', () => {
    expect(
      getDocumentDisplayTitle({
        title: 'Quarterly Report',
        original_file_name: 'q1-report.pdf',
      }),
    ).toBe('Quarterly Report');
  });

  it('falls back to the original filename without the pdf suffix', () => {
    expect(
      getDocumentDisplayTitle({
        title: '',
        original_file_name: 'project-notes.pdf',
      }),
    ).toBe('project-notes');
  });

  it('maps backend statuses to consistent UI labels and tones', () => {
    expect(formatDocumentStatus('processed')).toBe('Ready');
    expect(getDocumentStatusTone('processing')).toBe('warning');
    expect(getDocumentStatusTone('failed')).toBe('danger');
    expect(isDocumentPending('uploaded')).toBe(true);
  });

  it('rejects non-pdf files during local upload validation', () => {
    const error = validateDocumentFile(
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
    );

    expect(error).toBe('Only PDF files are supported.');
  });
});
