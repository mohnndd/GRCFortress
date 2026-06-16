import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  addProgress,
  createIncident,
  deleteIncident,
  fetchNotificationAttachment,
  getIncident,
  listIncidents,
  setRca,
  updateIncident,
  uploadNotificationAttachment,
  type IncidentCreateRequest,
  type IncidentDetail,
  type IncidentPriority,
  type IncidentStatus,
  type IncidentSummary,
  type IncidentUpdateRequest,
} from '../../api/incidentApi';
import './Incidents.css';

// ── Constants ──────────────────────────────────────────────────────────────

const PRIORITIES: IncidentPriority[] = ['P1', 'P2', 'P3'];
const STATUSES: IncidentStatus[] = ['OPEN', 'IN_PROGRESS', 'CONTAINED', 'CLOSED', 'CANCELLED'];

const PRIORITY_LABEL: Record<IncidentPriority, string> = {
  P1: 'P1 — Critical',
  P2: 'P2 — Major',
  P3: 'P3 — Minor',
};

const STATUS_LABEL: Record<IncidentStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  CONTAINED: 'Contained',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

function fromDatetimeLocal(v: string): string | null {
  if (!v) return null;
  return new Date(v).toISOString();
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function PriorityBadge({ p }: { p: IncidentPriority }) {
  return <span className={`inc-priority inc-priority--${p.toLowerCase()}`}>{p}</span>;
}

function StatusBadge({ s }: { s: IncidentStatus }) {
  return (
    <span className={`inc-status inc-status--${s.toLowerCase().replace('_', '-')}`}>
      {STATUS_LABEL[s]}
    </span>
  );
}

// ── Empty form state ───────────────────────────────────────────────────────

function emptyForm(): IncidentCreateRequest {
  return {
    title: '', description: '', priority: 'P3', departmentId: null,
    assignedTo: '', detectedAt: null,
    requiresRegulatoryNotification: false, regulatoryBody: '', notifiedAt: null,
  };
}

// ── Main component ─────────────────────────────────────────────────────────

export function IncidentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [drawerMode, setDrawerMode] = useState<'detail' | 'form' | 'progress' | 'rca' | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create/edit form
  const [form, setForm] = useState<IncidentCreateRequest>(emptyForm());
  const [editStatus, setEditStatus] = useState<IncidentStatus>('OPEN');
  const [editResolvedAt, setEditResolvedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Progress update
  const [progressContent, setProgressContent] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Notification attachment
  const notifFileRef = useRef<HTMLInputElement>(null);
  const [uploadingNotif, setUploadingNotif] = useState(false);

  // RCA
  const [rcaRequired, setRcaRequired] = useState(false);
  const [rcaCompleted, setRcaCompleted] = useState(false);
  const [rcaSummary, setRcaSummary] = useState('');
  const [rcaOpensObservation, setRcaOpensObservation] = useState(false);
  const [savingRca, setSavingRca] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setIncidents(await listIncidents());
    } catch {
      setError('Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: number) {
    setSelectedId(id);
    setDrawerMode('detail');
    setDetailLoading(true);
    try {
      setDetail(await getIncident(id));
    } catch {
      setError('Failed to load incident details.');
    } finally {
      setDetailLoading(false);
    }
  }

  function openNew() {
    setForm(emptyForm());
    setEditStatus('OPEN');
    setEditResolvedAt('');
    setFormError(null);
    setDetail(null);
    setSelectedId(null);
    setDrawerMode('form');
  }

  function openEdit(d: IncidentDetail) {
    setForm({
      title: d.title,
      description: d.description ?? '',
      priority: d.priority,
      departmentId: d.departmentId,
      assignedTo: d.assignedTo ?? '',
      detectedAt: d.detectedAt,
      requiresRegulatoryNotification: d.requiresRegulatoryNotification,
      regulatoryBody: d.regulatoryBody ?? '',
      notifiedAt: d.notifiedAt,
    });
    setEditStatus(d.status);
    setEditResolvedAt(toDatetimeLocal(d.resolvedAt));
    setFormError(null);
    setDrawerMode('form');
  }

  function openRca(d: IncidentDetail) {
    setRcaRequired(d.rcaRequired);
    setRcaCompleted(d.rcaCompleted);
    setRcaSummary(d.rcaSummary ?? '');
    setRcaOpensObservation(d.rcaOpensObservation);
    setDrawerMode('rca');
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedId(null);
    setDetail(null);
    setProgressContent('');
    setProgressStatus('');
  }

  function setField<K extends keyof IncidentCreateRequest>(k: K, v: IncidentCreateRequest[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    setSaving(true); setFormError(null);
    try {
      if (selectedId) {
        const req: IncidentUpdateRequest = {
          ...form, status: editStatus,
          resolvedAt: fromDatetimeLocal(editResolvedAt),
        };
        const updated = await updateIncident(selectedId, req);
        setIncidents((p) => p.map((i) => i.id === updated.id ? updated : i));
        await openDetail(selectedId);
        setDrawerMode('detail');
      } else {
        const created = await createIncident(form);
        setIncidents((p) => [created, ...p]);
        setSelectedId(created.id);
        await openDetail(created.id);
        setDrawerMode('detail');
      }
    } catch {
      setFormError('Failed to save incident.');
    } finally {
      setSaving(false);
    }
  }

  async function handleProgress(e: FormEvent) {
    e.preventDefault();
    if (!progressContent.trim() || !detail) return;
    setSubmittingProgress(true);
    try {
      const updated = await addProgress(detail.id, { content: progressContent, newStatus: progressStatus });
      setDetail(updated);
      setIncidents((p) => p.map((i) => i.id === updated.id ? { ...i, status: updated.status } : i));
      setProgressContent('');
      setProgressStatus('');
      setDrawerMode('detail');
    } catch {
      setError('Failed to add progress update.');
    } finally {
      setSubmittingProgress(false);
    }
  }

  async function handleNotifUpload(file: File) {
    if (!detail) return;
    setUploadingNotif(true);
    try {
      const updated = await uploadNotificationAttachment(detail.id, file);
      setIncidents((p) => p.map((i) => i.id === updated.id ? updated : i));
      const fresh = await getIncident(detail.id);
      setDetail(fresh);
    } catch {
      setError('Failed to upload attachment.');
    } finally {
      setUploadingNotif(false);
    }
  }

  async function handleDownloadNotif() {
    if (!detail) return;
    const url = await fetchNotificationAttachment(detail.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = detail.notificationAttachmentName ?? 'notification';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRcaSave(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setSavingRca(true);
    try {
      const updated = await setRca(detail.id, { rcaRequired, rcaCompleted, rcaSummary, rcaOpensObservation });
      setDetail(updated);
      setIncidents((p) => p.map((i) => i.id === updated.id ? { ...i, rcaRequired: updated.rcaRequired, rcaCompleted: updated.rcaCompleted } : i));
      setDrawerMode('detail');
    } catch {
      setError('Failed to save RCA settings.');
    } finally {
      setSavingRca(false);
    }
  }

  async function handleDelete() {
    if (!detail || !window.confirm(`Delete ${detail.incidentNumber}?`)) return;
    try {
      await deleteIncident(detail.id);
      setIncidents((p) => p.filter((i) => i.id !== detail.id));
      closeDrawer();
    } catch {
      setError('Failed to delete incident.');
    }
  }

  const filtered = incidents.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterPriority && i.priority !== filterPriority) return false;
    return true;
  });

  const openCount = incidents.filter((i) => !['CLOSED', 'CANCELLED'].includes(i.status)).length;
  const p1Count = incidents.filter((i) => i.priority === 'P1' && !['CLOSED', 'CANCELLED'].includes(i.status)).length;

  return (
    <div className={`inc-page${drawerMode ? ' inc-page--with-drawer' : ''}`}>
      <div className="inc-main">
        <div className="inc-header">
          <div>
            <h2>Incident Management</h2>
            <p className="inc-subtitle">Track, respond to, and document security and operational incidents.</p>
          </div>
          <div className="inc-header-actions">
            <select className="inc-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select className="inc-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="inc-btn-primary" onClick={openNew}>+ New incident</button>
          </div>
        </div>

        <div className="inc-stats">
          <div className={`inc-stat${openCount > 0 ? ' inc-stat--alert' : ''}`}>
            <span className="inc-stat-value">{openCount}</span>
            <span className="inc-stat-label">Open</span>
          </div>
          <div className={`inc-stat${p1Count > 0 ? ' inc-stat--critical' : ''}`}>
            <span className="inc-stat-value">{p1Count}</span>
            <span className="inc-stat-label">P1 active</span>
          </div>
          <div className="inc-stat">
            <span className="inc-stat-value">{incidents.filter((i) => i.status === 'CLOSED').length}</span>
            <span className="inc-stat-label">Closed</span>
          </div>
          <div className="inc-stat">
            <span className="inc-stat-value">{incidents.filter((i) => i.requiresRegulatoryNotification).length}</span>
            <span className="inc-stat-label">Regulatory</span>
          </div>
        </div>

        {error && <p className="inc-error">{error}</p>}
        {loading && <p className="inc-state">Loading incidents…</p>}

        {!loading && filtered.length === 0 && (
          <p className="inc-state">{incidents.length === 0 ? 'No incidents recorded.' : 'No incidents match the current filters.'}</p>
        )}

        {!loading && filtered.length > 0 && (
          <table className="inc-table">
            <thead>
              <tr>
                <th>Incident #</th>
                <th>Priority</th>
                <th>Title</th>
                <th>Department</th>
                <th>Assigned to</th>
                <th>Status</th>
                <th>Regulatory</th>
                <th>Detected</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr
                  key={inc.id}
                  className={`inc-table-row${selectedId === inc.id ? ' inc-table-row--selected' : ''}`}
                  onClick={() => openDetail(inc.id)}
                >
                  <td className="inc-col-number">{inc.incidentNumber}</td>
                  <td><PriorityBadge p={inc.priority} /></td>
                  <td className="inc-col-title">{inc.title}</td>
                  <td className="inc-col-dept">{inc.departmentName ?? '—'}</td>
                  <td className="inc-col-assignee">{inc.assignedTo ?? '—'}</td>
                  <td><StatusBadge s={inc.status} /></td>
                  <td className="inc-col-reg">
                    {inc.requiresRegulatoryNotification
                      ? <span className="inc-reg-badge">{inc.notifiedAt ? '✓ Notified' : '! Pending'}</span>
                      : <span className="inc-no-reg">—</span>}
                  </td>
                  <td className="inc-col-date">{fmtDate(inc.detectedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerMode && (
        <aside className="inc-drawer">
          <div className="inc-drawer-header">
            <div className="inc-drawer-title-row">
              {detail && <PriorityBadge p={detail.priority} />}
              <h3>
                {drawerMode === 'form' && !selectedId ? 'New Incident'
                  : drawerMode === 'form' ? `Edit ${detail?.incidentNumber}`
                  : drawerMode === 'progress' ? 'Add Progress Update'
                  : drawerMode === 'rca' ? 'Root Cause Analysis'
                  : detail?.incidentNumber ?? 'Incident'}
              </h3>
            </div>
            <button className="inc-drawer-close" onClick={closeDrawer}>✕</button>
          </div>

          {/* ── Detail view ─────────────────────────────────────────────── */}
          {drawerMode === 'detail' && (
            <div className="inc-drawer-body">
              {detailLoading && <p className="inc-state">Loading…</p>}
              {!detailLoading && detail && (
                <>
                  <div className="inc-detail-header">
                    <StatusBadge s={detail.status} />
                    <h4>{detail.title}</h4>
                    {detail.description && <p className="inc-detail-desc">{detail.description}</p>}
                  </div>

                  <div className="inc-detail-grid">
                    <div><span>Department</span><strong>{detail.departmentName ?? '—'}</strong></div>
                    <div><span>Reported by</span><strong>{detail.reportedBy}</strong></div>
                    <div><span>Assigned to</span><strong>{detail.assignedTo ?? '—'}</strong></div>
                    <div><span>Detected</span><strong>{fmtDate(detail.detectedAt)}</strong></div>
                    {detail.resolvedAt && (
                      <div><span>Resolved</span><strong>{fmtDate(detail.resolvedAt)}</strong></div>
                    )}
                  </div>

                  {/* Regulatory notification */}
                  {detail.requiresRegulatoryNotification && (
                    <div className="inc-reg-panel">
                      <p className="inc-section-title">Regulatory notification</p>
                      <div className="inc-detail-grid">
                        <div><span>Regulatory body</span><strong>{detail.regulatoryBody ?? '—'}</strong></div>
                        <div><span>Notified at</span><strong>{fmt(detail.notifiedAt)}</strong></div>
                      </div>
                      {detail.notificationAttachmentName ? (
                        <button className="inc-btn-ghost" onClick={handleDownloadNotif}>
                          Download notification: {detail.notificationAttachmentName}
                        </button>
                      ) : (
                        <div className="inc-attach-upload">
                          <p className="inc-attach-hint">No notification document uploaded yet.</p>
                          <input ref={notifFileRef} type="file" style={{ display: 'none' }}
                            onChange={(e) => { if (e.target.files?.[0]) handleNotifUpload(e.target.files[0]); }} />
                          <button className="inc-btn-ghost" onClick={() => notifFileRef.current?.click()} disabled={uploadingNotif}>
                            {uploadingNotif ? 'Uploading…' : 'Upload notification document'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RCA section */}
                  {detail.rcaRequired && (
                    <div className="inc-rca-panel">
                      <p className="inc-section-title">Root Cause Analysis</p>
                      <div className="inc-detail-grid">
                        <div>
                          <span>RCA status</span>
                          <strong className={detail.rcaCompleted ? 'inc-rca-done' : 'inc-rca-pending'}>
                            {detail.rcaCompleted ? 'Completed' : 'Pending'}
                          </strong>
                        </div>
                        {detail.rcaOpensObservation && (
                          <div>
                            <span>Linked observation</span>
                            <strong>{detail.linkedObservationId ? `OBS #${detail.linkedObservationId}` : 'Will be created on RCA completion'}</strong>
                          </div>
                        )}
                      </div>
                      {detail.rcaSummary && (
                        <div className="inc-rca-summary">
                          <p className="inc-rca-label">RCA Summary</p>
                          <p className="inc-rca-text">{detail.rcaSummary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress timeline */}
                  <div className="inc-timeline">
                    <p className="inc-section-title">Progress timeline</p>
                    {detail.updates.length === 0
                      ? <p className="inc-state">No updates yet.</p>
                      : detail.updates.map((u) => (
                        <div key={u.id} className="inc-timeline-item">
                          <div className="inc-timeline-meta">
                            <strong>{u.author}</strong>
                            {u.newStatus && (
                              <StatusBadge s={u.newStatus as IncidentStatus} />
                            )}
                            <span>{fmt(u.createdAt)}</span>
                          </div>
                          <p className="inc-timeline-content">{u.content}</p>
                        </div>
                      ))
                    }
                  </div>

                  <div className="inc-detail-actions">
                    <button className="inc-btn-secondary" onClick={() => setDrawerMode('progress')}>
                      + Progress update
                    </button>
                    <button className="inc-btn-secondary" onClick={() => openEdit(detail)}>Edit</button>
                    {isAdmin && (
                      <button className="inc-btn-secondary" onClick={() => openRca(detail)}>RCA</button>
                    )}
                    {isAdmin && (
                      <button className="inc-btn-danger" onClick={handleDelete}>Delete</button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Progress update form ────────────────────────────────────── */}
          {drawerMode === 'progress' && detail && (
            <form className="inc-drawer-body inc-form" onSubmit={handleProgress}>
              <div className="inc-form-section">
                <label>Progress note *
                  <textarea
                    value={progressContent}
                    onChange={(e) => setProgressContent(e.target.value)}
                    rows={5}
                    placeholder="Describe what actions were taken, current status, and next steps…"
                    required
                  />
                </label>
                <label>Change status (optional)
                  <select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)}>
                    <option value="">Keep current ({STATUS_LABEL[detail.status]})</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
              </div>
              <div className="inc-form-actions">
                <button className="inc-btn-secondary" type="button" onClick={() => setDrawerMode('detail')}>Back</button>
                <button className="inc-btn-primary" type="submit" disabled={submittingProgress}>
                  {submittingProgress ? 'Saving…' : 'Add update'}
                </button>
              </div>
            </form>
          )}

          {/* ── RCA form (admin only) ───────────────────────────────────── */}
          {drawerMode === 'rca' && detail && isAdmin && (
            <form className="inc-drawer-body inc-form" onSubmit={handleRcaSave}>
              <p className="inc-form-note">
                Configure root cause analysis requirements for this incident. If "open observation" is enabled,
                an observation ticket will be created automatically when RCA is marked complete.
              </p>
              <div className="inc-form-section">
                <label className="inc-checkbox-label">
                  <input type="checkbox" checked={rcaRequired} onChange={(e) => setRcaRequired(e.target.checked)} />
                  RCA required for this incident
                </label>
                {rcaRequired && (
                  <>
                    <label className="inc-checkbox-label">
                      <input type="checkbox" checked={rcaOpensObservation} onChange={(e) => setRcaOpensObservation(e.target.checked)} />
                      Auto-open an observation when RCA is completed
                    </label>
                    <label className="inc-checkbox-label">
                      <input type="checkbox" checked={rcaCompleted} onChange={(e) => setRcaCompleted(e.target.checked)} />
                      Mark RCA as completed
                    </label>
                    {rcaCompleted && (
                      <label>RCA summary *
                        <textarea
                          value={rcaSummary}
                          onChange={(e) => setRcaSummary(e.target.value)}
                          rows={5}
                          placeholder="Root cause findings, corrective actions taken, preventive measures…"
                          required={rcaCompleted}
                        />
                      </label>
                    )}
                  </>
                )}
              </div>
              <div className="inc-form-actions">
                <button className="inc-btn-secondary" type="button" onClick={() => setDrawerMode('detail')}>Back</button>
                <button className="inc-btn-primary" type="submit" disabled={savingRca}>
                  {savingRca ? 'Saving…' : 'Save RCA'}
                </button>
              </div>
            </form>
          )}

          {/* ── Create / edit form ──────────────────────────────────────── */}
          {drawerMode === 'form' && (
            <form className="inc-drawer-body inc-form" onSubmit={handleSubmit}>
              <div className="inc-form-section">
                <p className="inc-form-section-label">Incident details</p>
                <label>Title *
                  <input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={200} required />
                </label>
                <label>Description
                  <textarea value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={3} />
                </label>
                <div className="inc-form-row">
                  <label>Priority *
                    <select value={form.priority} onChange={(e) => setField('priority', e.target.value as IncidentPriority)}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                    </select>
                  </label>
                  {selectedId && (
                    <label>Status
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <label>Assigned to (username)
                  <input value={form.assignedTo ?? ''} onChange={(e) => setField('assignedTo', e.target.value)} />
                </label>
                <div className="inc-form-row">
                  <label>Detected at
                    <input type="datetime-local" value={toDatetimeLocal(form.detectedAt)}
                      onChange={(e) => setField('detectedAt', fromDatetimeLocal(e.target.value))} />
                  </label>
                  {selectedId && (
                    <label>Resolved at
                      <input type="datetime-local" value={editResolvedAt} onChange={(e) => setEditResolvedAt(e.target.value)} />
                    </label>
                  )}
                </div>
              </div>

              <div className="inc-form-section">
                <p className="inc-form-section-label">Regulatory notification</p>
                <label className="inc-checkbox-label">
                  <input type="checkbox" checked={form.requiresRegulatoryNotification}
                    onChange={(e) => setField('requiresRegulatoryNotification', e.target.checked)} />
                  This incident requires notifying a regulatory body
                </label>
                {form.requiresRegulatoryNotification && (
                  <>
                    <label>Regulatory body name
                      <input value={form.regulatoryBody ?? ''} onChange={(e) => setField('regulatoryBody', e.target.value)}
                        placeholder="e.g. SAMA, NDMO, NCA" />
                    </label>
                    <label>Notification sent at
                      <input type="datetime-local" value={toDatetimeLocal(form.notifiedAt)}
                        onChange={(e) => setField('notifiedAt', fromDatetimeLocal(e.target.value))} />
                    </label>
                    <p className="inc-form-hint">
                      You can upload the notification document after creating the incident.
                    </p>
                  </>
                )}
              </div>

              {formError && <p className="inc-error">{formError}</p>}

              <div className="inc-form-actions">
                <button className="inc-btn-secondary" type="button" onClick={closeDrawer}>Cancel</button>
                <button className="inc-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : selectedId ? 'Save changes' : 'Create incident'}
                </button>
              </div>
            </form>
          )}
        </aside>
      )}
    </div>
  );
}
