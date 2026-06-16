import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  listDecisions, createDecision, updateDecision, deleteDecision,
  uploadDecisionAttachment, decisionAttachmentUrl, type Decision, type DecisionRequest,
} from '../../api/decisionApi';
import { useAuth } from '../../auth/AuthContext';
import './DecisionRegister.css';

type DrawerMode = 'create' | 'edit' | 'detail' | null;

const STATUSES = ['ACTIVE', 'SUPERSEDED', 'CLOSED', 'REVOKED'] as const;
type DecisionStatus = typeof STATUSES[number];

const STATUS_LABEL: Record<DecisionStatus, string> = {
  ACTIVE: 'Active', SUPERSEDED: 'Superseded', CLOSED: 'Closed', REVOKED: 'Revoked',
};

const STATUS_CLASS: Record<DecisionStatus, string> = {
  ACTIVE: 'badge-approved', SUPERSEDED: 'badge-superseded', CLOSED: 'badge-archived', REVOKED: 'badge-rejected',
};

const EMPTY_FORM: DecisionRequest = {
  title: '', decisionDate: '', decisionMaker: '', relatedRisk: '',
  relatedPolicyControl: '', backgroundContext: '', alternativesConsidered: '',
  decisionOutcome: '', justification: '', impactAssessment: '', actionsRequired: '',
  owner: '', dueDate: null, reviewDate: null, status: 'ACTIVE',
};

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function DecisionRegisterPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('COMPLIANCE_OFFICER');

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Decision | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [form, setForm] = useState<DecisionRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listDecisions()
      .then(setDecisions)
      .catch(() => setError('Failed to load decisions.'))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setAttachmentFile(null);
    setFormError(null);
    setSelected(null);
    setDrawerMode('create');
  }

  function openEdit(d: Decision) {
    setForm({
      title: d.title, decisionDate: d.decisionDate, decisionMaker: d.decisionMaker,
      relatedRisk: d.relatedRisk ?? '', relatedPolicyControl: d.relatedPolicyControl ?? '',
      backgroundContext: d.backgroundContext ?? '', alternativesConsidered: d.alternativesConsidered ?? '',
      decisionOutcome: d.decisionOutcome ?? '', justification: d.justification ?? '',
      impactAssessment: d.impactAssessment ?? '', actionsRequired: d.actionsRequired ?? '',
      owner: d.owner ?? '', dueDate: d.dueDate, reviewDate: d.reviewDate, status: d.status,
    });
    setAttachmentFile(null);
    setFormError(null);
    setSelected(d);
    setDrawerMode('edit');
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.decisionDate || !form.decisionMaker.trim()) {
      setFormError('Title, decision date, and decision maker are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      let saved: Decision;
      if (drawerMode === 'create') {
        saved = await createDecision(form);
        setDecisions((p) => [saved, ...p]);
      } else {
        saved = await updateDecision(selected!.id, form);
        setDecisions((p) => p.map((d) => d.id === saved.id ? saved : d));
      }

      if (attachmentFile) {
        saved = await uploadDecisionAttachment(saved.id, attachmentFile);
        setDecisions((p) => p.map((d) => d.id === saved.id ? saved : d));
      }

      setSelected(saved);
      setDrawerMode('detail');
    } catch {
      setFormError('Failed to save decision. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: Decision) {
    if (!window.confirm(`Delete decision "${d.decisionNumber}"?`)) return;
    await deleteDecision(d.id);
    setDecisions((p) => p.filter((x) => x.id !== d.id));
    if (selected?.id === d.id) { setSelected(null); setDrawerMode(null); }
  }

  const filtered = decisions.filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.decisionNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.decisionMaker.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={`dec-page${drawerMode ? ' dec-page--with-drawer' : ''}`}>
      <div className="dec-main">
        <div className="dec-header">
          <div>
            <h2>Decision Registers</h2>
            <p className="dec-subtitle">Store approved organizational decisions, rationale, impacts, actions, and supporting evidence.</p>
          </div>
          {isAdmin && <button className="dec-btn-primary" onClick={openCreate}>+ New decision</button>}
        </div>

        <div className="dec-filters">
          <input className="dec-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, ID, or decision maker…" />
          <select className="dec-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        {loading && <p className="dec-state">Loading…</p>}
        {error && <p className="dec-error">{error}</p>}

        {!loading && (
          <table className="dec-table">
            <thead>
              <tr>
                <th>Decision ID</th>
                <th>Title</th>
                <th>Decision maker</th>
                <th>Related risk</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Decision date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}
                  className={`dec-table-row${selected?.id === d.id ? ' dec-table-row--selected' : ''}`}
                  onClick={() => { setSelected(d); setDrawerMode('detail'); }}>
                  <td className="dec-col-number">{d.decisionNumber}</td>
                  <td className="dec-col-title">{d.title}</td>
                  <td className="dec-col-muted">{d.decisionMaker}</td>
                  <td className="dec-col-muted">{d.relatedRisk || '—'}</td>
                  <td className="dec-col-muted">{d.owner || '—'}</td>
                  <td><span className={`dec-badge ${STATUS_CLASS[d.status as DecisionStatus] ?? ''}`}>{STATUS_LABEL[d.status as DecisionStatus] ?? d.status}</span></td>
                  <td className="dec-col-updated">{relativeDate(d.decisionDate)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="dec-state">No decisions found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {drawerMode && (
        <div className="dec-drawer">
          <div className="dec-drawer-header">
            <h3>
              {drawerMode === 'create' ? 'New Decision' :
               drawerMode === 'edit' ? `Edit: ${selected?.decisionNumber}` :
               (selected?.decisionNumber ?? 'Decision')}
            </h3>
            <button className="dec-drawer-close" onClick={() => setDrawerMode(null)}>✕</button>
          </div>

          {/* Detail view */}
          {drawerMode === 'detail' && selected && (
            <div className="dec-drawer-body">
              <section className="dec-detail-section">
                <div className="dec-detail-top">
                  <span className={`dec-badge ${STATUS_CLASS[selected.status as DecisionStatus] ?? ''}`}>{STATUS_LABEL[selected.status as DecisionStatus] ?? selected.status}</span>
                  {isAdmin && (
                    <div className="dec-detail-actions">
                      <button className="dec-btn-ghost-sm" onClick={() => openEdit(selected)}>Edit</button>
                      <button className="dec-btn-danger-sm" onClick={() => handleDelete(selected)}>Delete</button>
                    </div>
                  )}
                </div>
                <h4>{selected.decisionNumber}</h4>
                <p className="dec-detail-title">{selected.title}</p>
              </section>

              <section className="dec-detail-grid">
                <Detail label="Decision Date" value={selected.decisionDate} />
                <Detail label="Decision Maker" value={selected.decisionMaker} />
                <Detail label="Related Risk" value={selected.relatedRisk || '—'} />
                <Detail label="Policy / Control" value={selected.relatedPolicyControl || '—'} />
                <Detail label="Owner" value={selected.owner || '—'} />
                <Detail label="Due Date" value={selected.dueDate || '—'} />
                <Detail label="Review Date" value={selected.reviewDate || '—'} />
                <Detail label="Recorded by" value={selected.createdBy || '—'} />
              </section>

              <LongDetail label="Background / Context" value={selected.backgroundContext} />
              <LongDetail label="Alternatives Considered" value={selected.alternativesConsidered} />
              <LongDetail label="Decision Outcome" value={selected.decisionOutcome} />
              <LongDetail label="Justification" value={selected.justification} />
              <LongDetail label="Impact Assessment" value={selected.impactAssessment} />
              <LongDetail label="Actions Required" value={selected.actionsRequired} />

              <section className="dec-detail-section">
                <h4>Supporting Document</h4>
                {selected.attachmentName ? (
                  <a className="dec-attachment-link" href={decisionAttachmentUrl(selected.id)} target="_blank" rel="noreferrer">
                    {selected.attachmentName}
                  </a>
                ) : <p className="dec-col-muted">No document attached.</p>}
              </section>
            </div>
          )}

          {/* Create / Edit form */}
          {(drawerMode === 'create' || drawerMode === 'edit') && (
            <form className="dec-drawer-body" onSubmit={handleSave}>
              <div className="dec-form-grid">
                <Field label="Title *">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </Field>
                <Field label="Decision Date *">
                  <input type="date" value={form.decisionDate} onChange={(e) => setForm({ ...form, decisionDate: e.target.value })} required />
                </Field>
                <Field label="Decision Maker *">
                  <input value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })} placeholder="Committee, board, or authority" required />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </Field>
                <Field label="Related Risk">
                  <input value={form.relatedRisk} onChange={(e) => setForm({ ...form, relatedRisk: e.target.value })} placeholder="e.g. RISK-004" />
                </Field>
                <Field label="Related Policy / Control">
                  <input value={form.relatedPolicyControl} onChange={(e) => setForm({ ...form, relatedPolicyControl: e.target.value })} />
                </Field>
                <Field label="Owner">
                  <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </Field>
                <Field label="Due Date">
                  <input type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })} />
                </Field>
                <Field label="Review Date">
                  <input type="date" value={form.reviewDate ?? ''} onChange={(e) => setForm({ ...form, reviewDate: e.target.value || null })} />
                </Field>
              </div>

              <Field label="Background / Context">
                <textarea rows={4} value={form.backgroundContext} onChange={(e) => setForm({ ...form, backgroundContext: e.target.value })} />
              </Field>
              <Field label="Alternatives Considered">
                <textarea rows={3} value={form.alternativesConsidered} onChange={(e) => setForm({ ...form, alternativesConsidered: e.target.value })} />
              </Field>
              <Field label="Decision Outcome">
                <textarea rows={3} value={form.decisionOutcome} onChange={(e) => setForm({ ...form, decisionOutcome: e.target.value })} />
              </Field>
              <Field label="Justification">
                <textarea rows={3} value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} />
              </Field>
              <Field label="Impact Assessment">
                <textarea rows={3} value={form.impactAssessment} onChange={(e) => setForm({ ...form, impactAssessment: e.target.value })} />
              </Field>
              <Field label="Actions Required">
                <textarea rows={3} value={form.actionsRequired} onChange={(e) => setForm({ ...form, actionsRequired: e.target.value })} />
              </Field>

              <div className="dec-field">
                <label>Supporting Document</label>
                {drawerMode === 'edit' && selected?.attachmentName && !attachmentFile && (
                  <p className="dec-attachment-existing">Current: {selected.attachmentName}</p>
                )}
                <input ref={fileInputRef} type="file" onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)} />
                {attachmentFile && <p className="dec-attachment-new">New file: {attachmentFile.name}</p>}
              </div>

              {formError && <p className="dec-error">{formError}</p>}

              <div className="dec-form-actions">
                <button className="dec-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : drawerMode === 'create' ? 'Create decision' : 'Save changes'}
                </button>
                <button className="dec-btn-ghost" type="button" onClick={() => setDrawerMode(null)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="dec-field"><label>{label}</label>{children}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="dec-detail-label">{label}</span><strong>{value}</strong></div>;
}

function LongDetail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <section className="dec-detail-section">
      <h4>{label}</h4>
      <p>{value}</p>
    </section>
  );
}
