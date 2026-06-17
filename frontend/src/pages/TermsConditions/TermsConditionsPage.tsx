import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  listTermsDocuments,
  createTermsDocument,
  updateTermsDocument,
  uploadTermsAttachment,
  termsAttachmentUrl,
  deleteTermsDocument,
  type TermsDocument,
  type TermsDocumentRequest,
} from '../../api/termsApi';
import './TermsConditions.css';

type DrawerMode = 'detail' | 'form' | null;
type TermsStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

const STATUSES: TermsStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];

function statusLabel(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    IN_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
  };
  return map[s] ?? s;
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'badge-draft',
    IN_REVIEW: 'badge-review',
    APPROVED: 'badge-approved',
    PUBLISHED: 'badge-published',
    ARCHIVED: 'badge-archived',
  };
  return map[s] ?? 'badge-draft';
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const EMPTY_FORM: TermsDocumentRequest = {
  title: '',
  product: '',
  owner: '',
  description: '',
  status: 'DRAFT',
  version: '1.0',
  nextReview: null,
};

export function TermsConditionsPage() {
  const { user } = useAuth();
  const canWrite = user?.roles.some((r) => r === 'ADMIN' || r === 'COMPLIANCE_OFFICER') ?? false;

  const [docs, setDocs] = useState<TermsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selected, setSelected] = useState<TermsDocument | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);

  const [form, setForm] = useState<TermsDocumentRequest>(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setDocs(await listTermsDocuments());
    } catch {
      setError('Failed to load terms documents.');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setPendingFile(null);
    setFormError(null);
    setDrawerMode('form');
  }

  function openEdit(doc: TermsDocument) {
    setSelected(doc);
    setForm({
      title: doc.title,
      product: doc.product,
      owner: doc.owner,
      description: doc.description ?? '',
      status: doc.status,
      version: doc.version,
      nextReview: doc.nextReview ?? null,
    });
    setPendingFile(null);
    setFormError(null);
    setDrawerMode('form');
  }

  function openDetail(doc: TermsDocument) {
    setSelected(doc);
    setDrawerMode('detail');
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelected(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.product.trim() || !form.owner.trim()) {
      setFormError('Title, product, and owner are required.');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      let saved: TermsDocument;
      if (selected) {
        saved = await updateTermsDocument(selected.id, form);
      } else {
        saved = await createTermsDocument(form);
      }
      if (pendingFile) {
        saved = await uploadTermsAttachment(saved.id, pendingFile);
      }
      await load();
      setSelected(saved);
      setDrawerMode('detail');
    } catch {
      setFormError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(doc: TermsDocument) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await deleteTermsDocument(doc.id);
      closeDrawer();
      await load();
    } catch {
      alert('Delete failed.');
    }
  }

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.documentNumber.toLowerCase().includes(q) ||
      d.product.toLowerCase().includes(q) ||
      d.owner.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`tc-page${drawerMode ? ' tc-page--with-drawer' : ''}`}>
      <div className="tc-main">
        <div className="tc-header">
          <div>
            <h2>Terms and Conditions</h2>
            <p className="tc-subtitle">
              Draft, version, and manage approval workflows for product-facing terms.
            </p>
          </div>
          {canWrite && (
            <button className="tc-btn-primary" onClick={openCreate}>+ New terms document</button>
          )}
        </div>

        <div className="tc-filters">
          <input
            className="tc-search"
            type="search"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="tc-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>

        {loading && <p className="tc-state">Loading…</p>}
        {error && <p className="tc-error">{error}</p>}

        {!loading && !error && (
          <table className="tc-table">
            <thead>
              <tr>
                <th>Document #</th>
                <th>Title</th>
                <th>Product</th>
                <th>Owner</th>
                <th>Version</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="tc-state">No documents found.</td>
                </tr>
              )}
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className={`tc-table-row${selected?.id === doc.id ? ' tc-table-row--selected' : ''}`}
                  onClick={() => openDetail(doc)}
                >
                  <td className="tc-col-number">{doc.documentNumber}</td>
                  <td className="tc-col-title">{doc.title}</td>
                  <td className="tc-col-category">{doc.product}</td>
                  <td className="tc-col-owner">{doc.owner}</td>
                  <td className="tc-col-version">v{doc.version}</td>
                  <td className="tc-col-status">
                    <span className={`tc-badge ${statusClass(doc.status)}`}>{statusLabel(doc.status)}</span>
                  </td>
                  <td className="tc-col-updated">{relativeDate(doc.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerMode === 'detail' && selected && (
        <div className="tc-drawer">
          <div className="tc-drawer-header">
            <h3>{selected.title}</h3>
            <button className="tc-drawer-close" onClick={closeDrawer}>✕</button>
          </div>
          <div className="tc-drawer-body">
            <div className="tc-detail-top">
              <span className={`tc-badge ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
              <span className="tc-col-number">{selected.documentNumber}</span>
            </div>

            {selected.description && (
              <section className="tc-detail-section">
                <p>{selected.description}</p>
              </section>
            )}

            <section className="tc-detail-grid">
              <div><span>Product</span><strong>{selected.product}</strong></div>
              <div><span>Owner</span><strong>{selected.owner}</strong></div>
              <div><span>Version</span><strong>v{selected.version}</strong></div>
              <div><span>Next review</span><strong>{selected.nextReview ?? '—'}</strong></div>
              {selected.createdBy && (
                <div><span>Created by</span><strong>{selected.createdBy}</strong></div>
              )}
            </section>

            {selected.attachmentName && (
              <section className="tc-detail-section">
                <h4>Attachment</h4>
                <a
                  className="tc-attachment-link"
                  href={termsAttachmentUrl(selected.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↓ {selected.attachmentName}
                </a>
              </section>
            )}

            {canWrite && (
              <div className="tc-detail-actions">
                <button className="tc-btn-ghost-sm" onClick={() => openEdit(selected)}>Edit</button>
                <button className="tc-btn-danger-sm" onClick={() => handleDelete(selected)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      )}

      {drawerMode === 'form' && (
        <div className="tc-drawer">
          <div className="tc-drawer-header">
            <h3>{selected ? 'Edit Terms Document' : 'New Terms Document'}</h3>
            <button className="tc-drawer-close" onClick={closeDrawer}>✕</button>
          </div>
          <div className="tc-drawer-body">
            <form className="tc-form" onSubmit={handleSubmit}>
              {formError && <p className="tc-error">{formError}</p>}

              <label>
                Title <span className="tc-required">*</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Customer Terms and Conditions"
                  required
                />
              </label>

              <label>
                Product / Service <span className="tc-required">*</span>
                <input
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  placeholder="e.g. Retail Banking Mobile App"
                  required
                />
              </label>

              <label>
                Owner <span className="tc-required">*</span>
                <input
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  placeholder="e.g. Legal"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief summary of what this document covers"
                />
              </label>

              <div className="tc-form-row">
                <label>
                  Version
                  <input
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="1.0"
                  />
                </label>
                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Next Review Date
                <input
                  type="date"
                  value={form.nextReview ?? ''}
                  onChange={(e) => setForm({ ...form, nextReview: e.target.value || null })}
                />
              </label>

              <label>
                Attachment
                <input
                  type="file"
                  ref={fileRef}
                  onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                />
                {pendingFile && <span className="tc-attachment-new">New: {pendingFile.name}</span>}
                {!pendingFile && selected?.attachmentName && (
                  <span className="tc-attachment-existing">Current: {selected.attachmentName}</span>
                )}
              </label>

              <div className="tc-form-footer">
                <button type="button" className="tc-btn-ghost-sm" onClick={closeDrawer}>Cancel</button>
                <button type="submit" className="tc-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : selected ? 'Save changes' : 'Create document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
