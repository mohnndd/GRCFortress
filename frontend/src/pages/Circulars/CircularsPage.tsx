import { useEffect, useState, type FormEvent } from 'react';
import { listDepartments, type Department } from '../../api/departmentApi';
import {
  createCircular,
  deleteCircular,
  fetchCircularAttachment,
  listCirculars,
  updateCircular,
  type CircularSummary,
} from '../../api/circularApi';
import { useAuth } from '../../auth/AuthContext';
import './Circulars.css';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(iso));
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CircularsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [circulars, setCirculars] = useState<CircularSummary[]>([]);
  const [selected, setSelected] = useState<CircularSummary | null>(null);
  const [drawerMode, setDrawerMode] = useState<'new' | 'edit' | 'detail' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // form fields
  const [issuer, setIssuer] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([loadCirculars(), loadDepartments()]);
  }, []);

  async function loadCirculars() {
    setLoading(true);
    try {
      setCirculars(await listCirculars());
      setError(null);
    } catch {
      setError('Failed to load circulars.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDepartments() {
    try {
      setDepartments(await listDepartments());
    } catch {
      // non-fatal
    }
  }

  function openNew() {
    setIssuer('');
    setDescription('');
    setDepartmentId('');
    setAttachment(null);
    setSelected(null);
    setDrawerMode('new');
    setError(null);
  }

  function openDetail(circular: CircularSummary) {
    setSelected(circular);
    setDrawerMode('detail');
    setError(null);
  }

  function openEdit(circular: CircularSummary) {
    setSelected(circular);
    setIssuer(circular.issuer);
    setDescription(circular.description);
    setDepartmentId(circular.departmentId != null ? String(circular.departmentId) : '');
    setAttachment(null);
    setDrawerMode('edit');
    setError(null);
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelected(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const params = {
        issuer,
        description,
        departmentId: departmentId ? Number(departmentId) : null,
        attachment,
      };
      if (drawerMode === 'new') {
        const created = await createCircular(params);
        setCirculars((prev) => [created, ...prev]);
        setSelected(created);
        setDrawerMode('detail');
      } else if (drawerMode === 'edit' && selected) {
        const updated = await updateCircular(selected.id, params);
        setCirculars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelected(updated);
        setDrawerMode('detail');
      }
    } catch {
      setError('Failed to save circular.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected || !window.confirm(`Delete ${selected.circularNumber}?`)) return;
    setDeleting(true);
    try {
      await deleteCircular(selected.id);
      setCirculars((prev) => prev.filter((c) => c.id !== selected.id));
      closeDrawer();
    } catch {
      setError('Failed to delete circular.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(circular: CircularSummary) {
    try {
      const url = await fetchCircularAttachment(circular.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = circular.attachmentFileName ?? 'attachment';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download attachment.');
    }
  }

  return (
    <div className={`circulars-page${drawerMode ? ' circulars-page--with-drawer' : ''}`}>
      <div className="circulars-main">
        <div className="circulars-header">
          <div>
            <h2>Circulars</h2>
            <p className="circulars-subtitle">
              Capture regulatory, internal, and external circulars with issuer, department context, and original documents.
            </p>
          </div>
          <div className="circulars-header-actions">
            <button className="circulars-btn-ghost" onClick={loadCirculars}>Refresh</button>
            {isAdmin && (
              <button className="circulars-btn-primary" onClick={openNew}>+ New circular</button>
            )}
          </div>
        </div>

        {error && !drawerMode && <p className="circulars-error">{error}</p>}

        {loading && <p className="circulars-state">Loading circulars...</p>}

        {!loading && circulars.length === 0 && (
          <p className="circulars-state">No circulars recorded yet.</p>
        )}

        {!loading && circulars.length > 0 && (
          <table className="circulars-table">
            <thead>
              <tr>
                <th>Circular #</th>
                <th>Issuer</th>
                <th>Description</th>
                <th>Concerned department</th>
                <th>Attachment</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {circulars.map((circular) => (
                <tr
                  key={circular.id}
                  className={`circulars-table-row${selected?.id === circular.id ? ' circulars-table-row--selected' : ''}`}
                  onClick={() => openDetail(circular)}
                >
                  <td className="circulars-col-number">{circular.circularNumber}</td>
                  <td className="circulars-col-issuer">{circular.issuer}</td>
                  <td className="circulars-col-description">{circular.description}</td>
                  <td className="circulars-col-department">{circular.departmentName ?? 'All / not applicable'}</td>
                  <td className="circulars-col-attachment">
                    {circular.attachmentFileName
                      ? <span className="circulars-attachment-badge">{circular.attachmentFileType}</span>
                      : <span className="circulars-no-attachment">—</span>}
                  </td>
                  <td className="circulars-col-date">{formatDate(circular.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerMode && (
        <aside className="circulars-drawer">
          <div className="circulars-drawer-header">
            <h3>
              {drawerMode === 'new' ? 'New Circular'
                : drawerMode === 'edit' ? `Edit ${selected?.circularNumber}`
                : selected?.circularNumber ?? 'Circular'}
            </h3>
            <button className="circulars-drawer-close" type="button" onClick={closeDrawer}>✕</button>
          </div>

          {(drawerMode === 'new' || drawerMode === 'edit') && (
            <form className="circulars-drawer-body circulars-form" onSubmit={handleSubmit}>
              <label>
                Issuer
                <input value={issuer} onChange={(e) => setIssuer(e.target.value)} required maxLength={255} />
              </label>

              <label>
                Concerned department
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">All / not applicable</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                />
              </label>

              <label>
                Attachment {drawerMode === 'edit' && selected?.attachmentFileName && '(upload to replace)'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/png,image/jpeg"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                />
              </label>
              {attachment && <p className="circulars-file-note">{attachment.name}</p>}
              {drawerMode === 'edit' && selected?.attachmentFileName && !attachment && (
                <p className="circulars-file-note circulars-file-note--existing">
                  Current: {selected.attachmentFileName} ({formatSize(selected.attachmentFileSizeBytes)})
                </p>
              )}

              {error && <p className="circulars-error">{error}</p>}

              <div className="circulars-form-actions">
                <button className="circulars-btn-secondary" type="button" onClick={closeDrawer}>Cancel</button>
                <button className="circulars-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : drawerMode === 'new' ? 'Add circular' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {drawerMode === 'detail' && selected && (
            <div className="circulars-drawer-body">
              <section className="circulars-detail-section">
                <span className="circulars-badge">Recorded</span>
                <h4>{selected.issuer}</h4>
                <p>{selected.description}</p>
              </section>

              <section className="circulars-detail-grid">
                <div>
                  <span>Concerned department</span>
                  <strong>{selected.departmentName ?? 'All / not applicable'}</strong>
                </div>
                <div>
                  <span>Created</span>
                  <strong>{formatDate(selected.createdAt)}</strong>
                </div>
              </section>

              {selected.attachmentFileName ? (
                <button className="circulars-attachment-button" type="button" onClick={() => handleDownload(selected)}>
                  Download: {selected.attachmentFileName}
                  <span className="circulars-attachment-meta">
                    {selected.attachmentFileType} · {formatSize(selected.attachmentFileSizeBytes)}
                  </span>
                </button>
              ) : (
                <p className="circulars-no-attachment-note">No document attached.</p>
              )}

              {error && <p className="circulars-error">{error}</p>}

              {isAdmin && (
                <div className="circulars-detail-actions">
                  <button className="circulars-btn-secondary" type="button" onClick={() => openEdit(selected)}>
                    Edit
                  </button>
                  <button className="circulars-btn-danger" type="button" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
