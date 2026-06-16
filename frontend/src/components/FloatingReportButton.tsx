import { useState, type FormEvent } from 'react';
import { createReportedItem, type ReportType } from '../api/reportedItemApi';
import './FloatingReportButton.css';

export function FloatingReportButton() {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('ISSUE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createReportedItem({
        reportType,
        title: title.trim(),
        description: description.trim(),
        attachment,
      });
      setTitle('');
      setDescription('');
      setAttachment(null);
      setReportType('ISSUE');
      setSuccess('Your report has been submitted.');
    } catch {
      setError('Failed to submit the report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="floating-report-button"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report issue or suggestion"
      >
        !
      </button>

      {open && (
        <div className="report-drawer-backdrop" onClick={() => setOpen(false)}>
          <aside className="report-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="report-drawer-header">
              <div>
                <h2>Report issue or suggestion</h2>
                <p>Send details and supporting evidence to the admin team.</p>
              </div>
              <button className="report-drawer-close" type="button" onClick={() => setOpen(false)}>
                X
              </button>
            </div>

            <form className="report-form" onSubmit={submit}>
              <label>
                Type
                <select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
                  <option value="ISSUE">Issue</option>
                  <option value="SUGGESTION">Suggestion</option>
                </select>
              </label>

              <label>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={255}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={7}
                  maxLength={4000}
                  required
                />
              </label>

              <label>
                Attachment
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                  onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                />
              </label>

              {attachment && (
                <p className="report-file-note">{attachment.name}</p>
              )}
              {error && <p className="report-form-error">{error}</p>}
              {success && <p className="report-form-success">{success}</p>}

              <div className="report-form-actions">
                <button className="report-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit report'}
                </button>
                <button className="report-cancel" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
