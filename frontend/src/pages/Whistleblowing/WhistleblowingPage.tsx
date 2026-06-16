import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listDepartments, listStakeholders, type Department, type Stakeholder } from '../../api/departmentApi';
import './Whistleblowing.css';

interface DepartmentHeadOption {
  departmentId: number;
  departmentName: string;
  head: Stakeholder;
}

export function WhistleblowingPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [heads, setHeads] = useState<DepartmentHeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [target, setTarget] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [anonymous, setAnonymous] = useState(true);
  const [showIdentityWarning, setShowIdentityWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadHeads() {
      try {
        const departmentList = await listDepartments();
        setDepartments(departmentList);
        const headLists = await Promise.all(
          departmentList.map(async (department) => {
            const stakeholders = await listStakeholders(department.id);
            const head = stakeholders.find((stakeholder) => stakeholder.isHead);
            return head ? { departmentId: department.id, departmentName: department.name, head } : null;
          }),
        );
        const options = headLists.filter(Boolean) as DepartmentHeadOption[];
        setHeads(options);
        setTarget(options[0] ? String(options[0].departmentId) : '');
      } catch {
        setError('Failed to load department heads.');
      } finally {
        setLoading(false);
      }
    }

    loadHeads();
  }, []);

  const selectedHead = useMemo(
    () => heads.find((option) => String(option.departmentId) === target),
    [heads, target],
  );

  function handleAnonymousChange(nextValue: boolean) {
    if (!nextValue) {
      setShowIdentityWarning(true);
      return;
    }
    setAnonymous(nextValue);
  }

  function confirmIdentityVisible() {
    setAnonymous(false);
    setShowIdentityWarning(false);
  }

  function keepAnonymous() {
    setAnonymous(true);
    setShowIdentityWarning(false);
  }

  function addAttachments(files: FileList | null) {
    if (!files) return;
    setAttachments((current) => [...current, ...Array.from(files)]);
  }

  function removeAttachment(index: number) {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!title.trim() || !subject.trim() || !target) {
      setError('Title, subject, and receiving department head are required.');
      return;
    }
    setTitle('');
    setSubject('');
    setAttachments([]);
    setAnonymous(true);
    setSuccess('Whistleblowing report prepared for submission.');
  }

  return (
    <div className="wb-page">
      <div className="wb-main">
        <div className="wb-header">
          <div>
            <h2>Whistleblowing</h2>
            <p className="wb-subtitle">
              Submit a confidential report to a department head with anonymous reporting enabled by default.
            </p>
          </div>
        </div>

        <section className="wb-panel">
          <div className="wb-panel-header">
            <h3>New Whistleblowing Report</h3>
            <span>{anonymous ? 'Anonymous mode' : 'Identity visible'}</span>
          </div>

          <form className="wb-form" onSubmit={submit}>
            <div className="wb-form-grid">
              <label>
                Title
                <input value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>

              <label>
                Send to department head
                <select value={target} onChange={(event) => setTarget(event.target.value)} disabled={loading}>
                  <option value="">Select department head</option>
                  {heads.map((option) => (
                    <option key={option.departmentId} value={option.departmentId}>
                      {option.departmentName} - {option.head.firstName} {option.head.lastName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Subject
              <textarea
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                rows={8}
                required
              />
            </label>

            <div className="wb-attachments">
              <label className="wb-file-upload">
                Attach supporting documents
                <input
                  type="file"
                  multiple
                  onChange={(event) => {
                    addAttachments(event.target.files);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {attachments.length > 0 && (
                <div className="wb-attachment-list">
                  {attachments.map((file, index) => (
                    <div className="wb-attachment-item" key={`${file.name}-${file.lastModified}-${index}`}>
                      <div>
                        <strong>{file.name}</strong>
                        <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
                      </div>
                      <button type="button" onClick={() => removeAttachment(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="wb-checkbox">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => handleAnonymousChange(event.target.checked)}
              />
              Report anonymously
            </label>

            <div className={`wb-identity-note${anonymous ? '' : ' wb-identity-note--visible'}`}>
              {anonymous
                ? 'Your name will not be shown to the receiving party.'
                : 'Your name will be visible to the receiving department head.'}
            </div>

            {selectedHead && (
              <div className="wb-recipient">
                <span>Receiving party</span>
                <strong>{selectedHead.departmentName}</strong>
                <em>{selectedHead.head.positionTitle}: {selectedHead.head.firstName} {selectedHead.head.lastName}</em>
              </div>
            )}

            {departments.length > 0 && heads.length === 0 && !loading && (
              <p className="wb-error">No department heads are configured yet.</p>
            )}
            {error && <p className="wb-error">{error}</p>}
            {success && <p className="wb-success">{success}</p>}

            <div className="wb-form-actions">
              <button className="wb-btn-primary" type="submit">Submit report</button>
            </div>
          </form>
        </section>
      </div>

      {showIdentityWarning && (
        <div className="wb-modal-backdrop" role="presentation" onMouseDown={keepAnonymous}>
          <div
            className="wb-warning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wb-identity-warning-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="wb-warning-icon" aria-hidden="true">!</div>
            <div>
              <p className="wb-warning-kicker">Identity disclosure warning</p>
              <h3 id="wb-identity-warning-title">Your name will be visible</h3>
              <p>
                If you turn off anonymous reporting, your name will be shown to the receiving department head
                with this report.
              </p>
            </div>
            <div className="wb-warning-actions">
              <button className="wb-btn-secondary" type="button" onClick={keepAnonymous}>
                Keep anonymous
              </button>
              <button className="wb-btn-danger" type="button" onClick={confirmIdentityVisible}>
                Show my identity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
