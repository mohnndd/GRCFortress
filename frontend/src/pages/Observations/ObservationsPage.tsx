import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  acceptClosure,
  confirmTargetDate,
  createObservation,
  fetchEvidenceFile,
  fetchObservationFile,
  getObservation,
  listObservations,
  postObservationMessage,
  rejectClosure,
  requestClosure,
  type ClosureRequestDto,
  type ObservationDetail,
  type ObservationListItem,
  type ObservationMessageDto,
  type ObservationStatus,
} from '../../api/observationApi';
import { listDepartments, type Department } from '../../api/departmentApi';
import { listCirculars, type CircularSummary } from '../../api/circularApi';
import '../Policies/Policies.css';
import './Observations.css';

// ── Helpers ────────────────────────────────────────────────────────────────

function obsStatusLabel(s: ObservationStatus): string {
  const map: Record<ObservationStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    PENDING_CLOSURE: 'Pending Closure',
    CLOSED: 'Closed',
  };
  return map[s] ?? s;
}

function obsStatusClass(s: ObservationStatus): string {
  const map: Record<ObservationStatus, string> = {
    OPEN: 'obs-badge-open',
    IN_PROGRESS: 'obs-badge-in-progress',
    PENDING_CLOSURE: 'obs-badge-pending-closure',
    CLOSED: 'obs-badge-closed',
  };
  return map[s] ?? 'obs-badge-open';
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return d;
  }
}

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Create form state ──────────────────────────────────────────────────────

interface CreateForm {
  name: string;
  description: string;
  receivingDepartmentId: string;
  controlViolation: string;
  isRegulationRelated: boolean;
  regulationMode: 'upload' | 'circular';
  regulationFile: File | null;
  linkedCircularId: string;
  proposedTargetDate: string;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  description: '',
  receivingDepartmentId: '',
  controlViolation: '',
  isRegulationRelated: false,
  regulationMode: 'upload',
  regulationFile: null,
  linkedCircularId: '',
  proposedTargetDate: '',
};

// ── Main component ─────────────────────────────────────────────────────────

export function ObservationsPage() {
  const { user } = useAuth();
  const [observations, setObservations] = useState<ObservationListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [circulars, setCirculars] = useState<CircularSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Drawer
  const [drawerMode, setDrawerMode] = useState<'create' | 'detail' | null>(null);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const regulationFileRef = useRef<HTMLInputElement>(null);

  // Detail
  const [selectedObs, setSelectedObs] = useState<ObservationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirm date
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Request closure
  const [closureNotes, setClosureNotes] = useState('');
  const [closureFile, setClosureFile] = useState<File | null>(null);
  const [closureSaving, setClosureSaving] = useState(false);
  const [closureError, setClosureError] = useState<string | null>(null);
  const closureFileRef = useRef<HTMLInputElement>(null);

  // Accept / reject closure
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [decideSaving, setDecideSaving] = useState(false);
  const [decideError, setDecideError] = useState<string | null>(null);

  // Discussion thread
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listObservations(), listDepartments(), listCirculars()])
      .then(([o, d, c]) => { setObservations(o); setDepartments(d); setCirculars(c); })
      .catch(() => setPageError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Create form ────────────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setCreateError(null);
    setDrawerMode('create');
  }

  function setField<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setFormErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function validateCreate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Observation name is required';
    if (!form.receivingDepartmentId) errs.receivingDepartmentId = 'Receiving department is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!validateCreate()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createObservation({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        controlViolation: form.controlViolation.trim() || undefined,
        isRegulationRelated: form.isRegulationRelated,
        proposedTargetDate: form.proposedTargetDate || undefined,
        receivingDepartmentId: Number(form.receivingDepartmentId),
        regulationFile: form.regulationMode === 'upload' ? (form.regulationFile ?? undefined) : undefined,
        linkedCircularId: form.regulationMode === 'circular' && form.linkedCircularId
          ? Number(form.linkedCircularId) : null,
      });
      setObservations((p) => [created, ...p]);
      setDrawerMode(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg ?? 'Failed to create observation.');
    } finally {
      setCreating(false);
    }
  }

  // ── Detail ─────────────────────────────────────────────────────────────

  async function openDetail(obs: ObservationListItem) {
    setDrawerMode('detail');
    setSelectedObs(null);
    setDetailLoading(true);
    resetActionState();
    try {
      const detail = await getObservation(obs.id);
      setSelectedObs(detail);
      setConfirmDate(detail.proposedTargetDate ?? '');
    } catch {
      setPageError('Failed to load observation details.');
      setDrawerMode(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function resetActionState() {
    setConfirmDate('');
    setConfirmError(null);
    setClosureNotes('');
    setClosureFile(null);
    setClosureError(null);
    setRejectMode(false);
    setRejectReason('');
    setDecideError(null);
    setNewMessage('');
    setMsgError(null);
  }

  async function refreshDetail() {
    if (!selectedObs) return;
    const detail = await getObservation(selectedObs.id);
    setSelectedObs(detail);
    setObservations((p) => p.map((o) => o.id === detail.id ? detail : o));
  }

  // ── Confirm date ───────────────────────────────────────────────────────

  async function handleConfirmDate() {
    if (!selectedObs || !confirmDate) {
      setConfirmError('Please select a target date.');
      return;
    }
    setConfirmSaving(true);
    setConfirmError(null);
    try {
      await confirmTargetDate(selectedObs.id, confirmDate);
      await refreshDetail();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConfirmError(msg ?? 'Failed to confirm target date.');
    } finally {
      setConfirmSaving(false);
    }
  }

  // ── Request closure ────────────────────────────────────────────────────

  async function handleRequestClosure() {
    if (!selectedObs) return;
    setClosureSaving(true);
    setClosureError(null);
    try {
      await requestClosure(selectedObs.id, closureNotes || undefined, closureFile ?? undefined);
      setClosureNotes('');
      setClosureFile(null);
      await refreshDetail();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setClosureError(msg ?? 'Failed to submit closure request.');
    } finally {
      setClosureSaving(false);
    }
  }

  // ── Accept / reject ────────────────────────────────────────────────────

  async function handleAcceptClosure() {
    if (!selectedObs) return;
    setDecideSaving(true);
    setDecideError(null);
    try {
      await acceptClosure(selectedObs.id);
      await refreshDetail();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDecideError(msg ?? 'Failed to accept closure.');
    } finally {
      setDecideSaving(false);
    }
  }

  async function handleRejectClosure() {
    if (!selectedObs) return;
    setDecideSaving(true);
    setDecideError(null);
    try {
      await rejectClosure(selectedObs.id, rejectReason || undefined);
      setRejectMode(false);
      setRejectReason('');
      await refreshDetail();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDecideError(msg ?? 'Failed to reject closure.');
    } finally {
      setDecideSaving(false);
    }
  }

  // ── Send message ───────────────────────────────────────────────────────

  async function handleSendMessage() {
    if (!selectedObs || !newMessage.trim()) return;
    setSendingMsg(true);
    setMsgError(null);
    try {
      await postObservationMessage(selectedObs.id, newMessage.trim());
      setNewMessage('');
      await refreshDetail();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsgError(msg ?? 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  }

  // ── File open helpers ──────────────────────────────────────────────────

  async function openRegulationFile() {
    if (!selectedObs) return;
    const url = await fetchObservationFile(selectedObs.id, 'regulation');
    window.open(url, '_blank');
  }

  async function openEvidenceFile(closureId: number) {
    if (!selectedObs) return;
    const url = await fetchEvidenceFile(selectedObs.id, closureId);
    window.open(url, '_blank');
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) return <p className="pol-loading">Loading observations…</p>;

  const latestPendingClosure = selectedObs?.closureRequests.find((c) => c.status === 'PENDING') ?? null;

  return (
    <div className={`pol-page${drawerMode ? ' pol-page--with-drawer' : ''}`}>
      {/* Main */}
      <div className="pol-main">
        <div className="pol-header">
          <div>
            <h2>Observations</h2>
            <p className="pol-subtitle">
              Raise and track inter-departmental observations and control findings.
            </p>
          </div>
          <button className="pol-btn-primary" onClick={openCreate}>+ New observation</button>
        </div>

        {pageError && <p className="pol-error">{pageError}</p>}

        {observations.length === 0 ? (
          <div className="pol-empty">
            <p>No observations yet.</p>
            <button className="pol-btn-primary" onClick={openCreate}>Raise an observation</button>
          </div>
        ) : (
          <table className="pol-table">
            <thead>
              <tr>
                <th>Obs #</th>
                <th>Name</th>
                <th>From → To</th>
                <th>Status</th>
                <th>Target date</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr
                  key={o.id}
                  className={`pol-table-row${selectedObs?.id === o.id ? ' pol-table-row--selected' : ''}`}
                  onClick={() => openDetail(o)}
                >
                  <td className="pol-col-number">{o.observationNumber}</td>
                  <td className="pol-col-title">{o.name}</td>
                  <td className="obs-col-flow">
                    <div className="obs-dept-flow">
                      <span className="obs-dept-name" title={o.creatorDepartmentName}>{o.creatorDepartmentName}</span>
                      <span className="obs-dept-arrow">→</span>
                      <span className="obs-dept-name" title={o.receivingDepartmentName}>{o.receivingDepartmentName}</span>
                    </div>
                  </td>
                  <td className="pol-col-status">
                    <span className={`pol-badge ${obsStatusClass(o.status)}`}>{obsStatusLabel(o.status)}</span>
                  </td>
                  <td className="pol-col-updated">
                    {o.confirmedTargetDate
                      ? formatDate(o.confirmedTargetDate)
                      : o.proposedTargetDate
                      ? <span style={{ opacity: 0.7 }}>{formatDate(o.proposedTargetDate)} (proposed)</span>
                      : '—'}
                  </td>
                  <td className="pol-col-updated">{relativeDate(o.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerMode && (
        <div className="pol-drawer">
          <div className="pol-drawer-header">
            <h3>
              {drawerMode === 'create'
                ? 'New Observation'
                : selectedObs?.name ?? '…'}
            </h3>
            <button className="pol-drawer-close" onClick={() => setDrawerMode(null)}>✕</button>
          </div>

          {/* ── Create form ── */}
          {drawerMode === 'create' && (
            <div className="pol-drawer-body">
              <FieldGroup label="Observation name *" error={formErrors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Missing segregation of duties in payment process"
                />
              </FieldGroup>

              <FieldGroup label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe the observation in detail…"
                  rows={3}
                />
              </FieldGroup>

              <FieldGroup label="Receiving department *" error={formErrors.receivingDepartmentId}>
                <select
                  value={form.receivingDepartmentId}
                  onChange={(e) => setField('receivingDepartmentId', e.target.value)}
                >
                  <option value="">— Select department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Control violation (if any)">
                <textarea
                  value={form.controlViolation}
                  onChange={(e) => setField('controlViolation', e.target.value)}
                  placeholder="Which control was violated?"
                  rows={2}
                />
              </FieldGroup>

              <FieldGroup label="Proposed target date">
                <input
                  type="date"
                  value={form.proposedTargetDate}
                  onChange={(e) => setField('proposedTargetDate', e.target.value)}
                />
              </FieldGroup>

              <div className="pol-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isRegulationRelated}
                    onChange={(e) => {
                      setField('isRegulationRelated', e.target.checked);
                      if (!e.target.checked) {
                        setField('regulationFile', null);
                        setField('linkedCircularId', '');
                        setField('regulationMode', 'upload');
                      }
                    }}
                    style={{ width: 'auto' }}
                  />
                  Is related to a regulation or circular?
                </label>
              </div>

              {form.isRegulationRelated && (
                <>
                  <div className="pol-field">
                    <label style={{ marginBottom: 6 }}>How would you like to reference it?</label>
                    <div className="obs-reg-mode-toggle">
                      <label className={`obs-reg-mode-option${form.regulationMode === 'upload' ? ' obs-reg-mode-option--active' : ''}`}>
                        <input
                          type="radio"
                          name="regulationMode"
                          value="upload"
                          checked={form.regulationMode === 'upload'}
                          onChange={() => {
                            setField('regulationMode', 'upload');
                            setField('linkedCircularId', '');
                          }}
                        />
                        Upload a document
                      </label>
                      <label className={`obs-reg-mode-option${form.regulationMode === 'circular' ? ' obs-reg-mode-option--active' : ''}`}>
                        <input
                          type="radio"
                          name="regulationMode"
                          value="circular"
                          checked={form.regulationMode === 'circular'}
                          onChange={() => {
                            setField('regulationMode', 'circular');
                            setField('regulationFile', null);
                          }}
                        />
                        Link to a circular
                      </label>
                    </div>
                  </div>

                  {form.regulationMode === 'upload' && (
                    <div className="pol-field">
                      <label>Regulation / circular document</label>
                      <div className="obs-file-input-wrapper">
                        <button
                          type="button"
                          className="pol-btn-ghost pol-btn-sm"
                          onClick={() => regulationFileRef.current?.click()}
                        >
                          Choose file
                        </button>
                        {form.regulationFile
                          ? <span className="obs-file-chosen">{form.regulationFile.name}</span>
                          : <span className="obs-file-none">No file chosen</span>}
                      </div>
                      <input
                        ref={regulationFileRef}
                        type="file"
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setField('regulationFile', f);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {form.regulationMode === 'circular' && (
                    <div className="pol-field">
                      <label>Select circular</label>
                      {circulars.length === 0 ? (
                        <p className="obs-reg-no-circulars">No circulars have been recorded yet.</p>
                      ) : (
                        <select
                          value={form.linkedCircularId}
                          onChange={(e) => setField('linkedCircularId', e.target.value)}
                        >
                          <option value="">— Select a circular —</option>
                          {circulars.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.circularNumber} — {c.issuer}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </>
              )}

              {createError && <p className="pol-error">{createError}</p>}

              <div className="pol-form-actions">
                <button className="pol-btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Create observation'}
                </button>
                <button className="pol-btn-ghost" onClick={() => setDrawerMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* ── Detail ── */}
          {drawerMode === 'detail' && (
            <div className="pol-drawer-body">
              {detailLoading && <p className="pol-loading">Loading…</p>}

              {selectedObs && (
                <>
                  {/* Header */}
                  <div className="obs-detail-header">
                    <div className="obs-detail-number">{selectedObs.observationNumber}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className={`pol-badge ${obsStatusClass(selectedObs.status)}`}>
                        {obsStatusLabel(selectedObs.status)}
                      </span>
                      {selectedObs.isRegulationRelated && (
                        <span className="obs-regulation-badge">⚠ Regulation related</span>
                      )}
                    </div>
                    <div className="obs-detail-flow">
                      <span className="obs-dept-name">{selectedObs.creatorDepartmentName}</span>
                      <span className="obs-dept-arrow">→</span>
                      <span className="obs-dept-name">{selectedObs.receivingDepartmentName}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="obs-dates">
                    <div className="obs-date-item">
                      <span className="obs-date-label">Proposed date</span>
                      <span className={`obs-date-value${!selectedObs.proposedTargetDate ? ' obs-date-value--unset' : ''}`}>
                        {formatDate(selectedObs.proposedTargetDate)}
                      </span>
                    </div>
                    <div className="obs-date-item">
                      <span className="obs-date-label">Confirmed date</span>
                      <span className={`obs-date-value${!selectedObs.confirmedTargetDate ? ' obs-date-value--unset' : ''}`}>
                        {formatDate(selectedObs.confirmedTargetDate)}
                      </span>
                    </div>
                    <div className="obs-date-item">
                      <span className="obs-date-label">Raised by</span>
                      <span className="obs-date-value">{selectedObs.createdBy ?? '—'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedObs.description && (
                    <div className="obs-section">
                      <p className="obs-section-title">Description</p>
                      <p className="obs-section-body">{selectedObs.description}</p>
                    </div>
                  )}

                  {/* Control violation */}
                  {selectedObs.controlViolation && (
                    <div className="obs-section">
                      <p className="obs-section-title">Control violation</p>
                      <p className="obs-section-body">{selectedObs.controlViolation}</p>
                    </div>
                  )}

                  {/* Regulation file */}
                  {selectedObs.regulationFileName && (
                    <div className="obs-section">
                      <p className="obs-section-title">Regulation / Circular</p>
                      <button className="obs-file-link" onClick={openRegulationFile}>
                        📄 {selectedObs.regulationFileName}
                      </button>
                    </div>
                  )}

                  {/* Linked circular */}
                  {selectedObs.linkedCircularId && (
                    <div className="obs-section">
                      <p className="obs-section-title">Linked Circular</p>
                      <div className="obs-linked-circular">
                        <span className="obs-linked-circular-number">{selectedObs.linkedCircularNumber}</span>
                        <span className="obs-linked-circular-issuer">{selectedObs.linkedCircularIssuer}</span>
                      </div>
                    </div>
                  )}

                  {/* ── Status-based action panels ── */}

                  {/* OPEN + receiving dept member: confirm date */}
                  {selectedObs.status === 'OPEN' && selectedObs.currentUserIsInReceivingDept && (
                    <div className="obs-action-panel obs-action-panel--confirm">
                      <p className="obs-action-title">Confirm target date</p>
                      <div className="pol-field" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Target date</label>
                        <input
                          type="date"
                          value={confirmDate}
                          onChange={(e) => setConfirmDate(e.target.value)}
                        />
                      </div>
                      {confirmError && <p className="pol-error" style={{ margin: '6px 0 0' }}>{confirmError}</p>}
                      <div className="obs-action-btns">
                        <button className="obs-btn-accept" onClick={handleConfirmDate} disabled={confirmSaving}>
                          {confirmSaving ? 'Saving…' : 'Confirm target date'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* IN_PROGRESS + receiving dept: request closure */}
                  {selectedObs.status === 'IN_PROGRESS' && selectedObs.currentUserIsInReceivingDept && (
                    <div className="obs-action-panel obs-action-panel--closure">
                      <p className="obs-action-title">Request closure</p>
                      <div className="pol-field" style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: '0.8rem' }}>Notes (optional)</label>
                        <textarea
                          value={closureNotes}
                          onChange={(e) => setClosureNotes(e.target.value)}
                          placeholder="Describe remediation actions taken…"
                          rows={2}
                        />
                      </div>
                      <div className="pol-field" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Evidence file (optional)</label>
                        <div className="obs-file-input-wrapper">
                          <button
                            type="button"
                            className="pol-btn-ghost pol-btn-sm"
                            onClick={() => closureFileRef.current?.click()}
                          >
                            Choose file
                          </button>
                          {closureFile
                            ? <span className="obs-file-chosen">{closureFile.name}</span>
                            : <span className="obs-file-none">No file chosen</span>}
                        </div>
                        <input
                          ref={closureFileRef}
                          type="file"
                          style={{ display: 'none' }}
                          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            setClosureFile(e.target.files?.[0] ?? null);
                            e.target.value = '';
                          }}
                        />
                      </div>
                      {closureError && <p className="pol-error" style={{ margin: '6px 0 0' }}>{closureError}</p>}
                      <div className="obs-action-btns">
                        <button className="obs-btn-accept" onClick={handleRequestClosure} disabled={closureSaving}>
                          {closureSaving ? 'Submitting…' : 'Submit closure request'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PENDING_CLOSURE + creator dept: review latest closure request */}
                  {selectedObs.status === 'PENDING_CLOSURE' && selectedObs.currentUserIsInCreatorDept && latestPendingClosure && (
                    <div className="obs-action-panel obs-action-panel--review">
                      <p className="obs-action-title">Review closure request</p>
                      {latestPendingClosure.notes && (
                        <p className="pol-change-reason" style={{ margin: '0 0 6px' }}>
                          {latestPendingClosure.notes}
                        </p>
                      )}
                      {latestPendingClosure.evidenceFileName && (
                        <button
                          className="obs-file-link"
                          style={{ marginBottom: 8, display: 'inline-flex' }}
                          onClick={() => openEvidenceFile(latestPendingClosure.id)}
                        >
                          📎 {latestPendingClosure.evidenceFileName}
                        </button>
                      )}
                      <p className="obs-date-label" style={{ marginBottom: 4 }}>
                        Submitted by {latestPendingClosure.submittedBy} · {formatTs(latestPendingClosure.submittedAt)}
                      </p>
                      {decideError && <p className="pol-error" style={{ margin: '6px 0' }}>{decideError}</p>}
                      {!rejectMode ? (
                        <div className="obs-action-btns">
                          <button className="obs-btn-accept" onClick={handleAcceptClosure} disabled={decideSaving}>
                            {decideSaving ? 'Saving…' : 'Accept closure'}
                          </button>
                          <button className="obs-btn-reject" onClick={() => setRejectMode(true)}>
                            Reject evidence
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="pol-field" style={{ margin: '8px 0 0' }}>
                            <label style={{ fontSize: '0.8rem' }}>Rejection reason (optional)</label>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Explain why the evidence is insufficient…"
                              rows={2}
                            />
                          </div>
                          <div className="obs-action-btns">
                            <button className="obs-btn-reject" onClick={handleRejectClosure} disabled={decideSaving}>
                              {decideSaving ? 'Saving…' : 'Confirm rejection'}
                            </button>
                            <button className="pol-btn-ghost" onClick={() => setRejectMode(false)}>Cancel</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* CLOSED */}
                  {selectedObs.status === 'CLOSED' && (
                    <div className="obs-closed-banner">
                      ✓ This observation has been closed.
                    </div>
                  )}

                  {/* Closure request history */}
                  {selectedObs.closureRequests.length > 0 && (
                    <div className="obs-section">
                      <p className="obs-section-title">Closure request history</p>
                      <div className="obs-closure-history">
                        {selectedObs.closureRequests.map((c) => (
                          <ClosureCard
                            key={c.id}
                            closure={c}
                            onOpenEvidence={openEvidenceFile}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discussion thread */}
                  <div className="obs-section">
                    <p className="obs-section-title obs-thread-title">
                      Discussion ({selectedObs.messages.length})
                    </p>
                    {selectedObs.messages.length === 0 && (
                      <p className="pol-thread-empty">No messages yet.</p>
                    )}
                    {selectedObs.messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        msg={m}
                        currentUsername={user?.username ?? ''}
                      />
                    ))}
                    {msgError && <p className="pol-error">{msgError}</p>}
                    <div className="pol-thread-input">
                      <textarea
                        placeholder="Add a comment…"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        className="pol-btn-primary pol-btn-sm"
                        onClick={handleSendMessage}
                        disabled={sendingMsg || !newMessage.trim()}
                      >
                        {sendingMsg ? '…' : 'Send'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ClosureCard({
  closure,
  onOpenEvidence,
}: {
  closure: ClosureRequestDto;
  onOpenEvidence: (closureId: number) => void;
}) {
  return (
    <div className={`obs-closure-card obs-closure-card--${closure.status.toLowerCase()}`}>
      <div className="obs-closure-card-header">
        <span className="obs-closure-card-meta">
          {closure.submittedBy} · {new Date(closure.submittedAt).toLocaleDateString()}
        </span>
        <span className={`obs-closure-status obs-closure-status--${closure.status}`}>
          {closure.status}
        </span>
      </div>
      {closure.notes && (
        <p className="obs-closure-notes">{closure.notes}</p>
      )}
      {closure.evidenceFileName && (
        <button className="obs-file-link" onClick={() => onOpenEvidence(closure.id)}>
          📎 {closure.evidenceFileName}
        </button>
      )}
      {closure.rejectionReason && (
        <p className="obs-closure-rejection">Rejected: {closure.rejectionReason}</p>
      )}
      {closure.decidedBy && (
        <p className="obs-closure-card-meta" style={{ marginTop: 4 }}>
          Decided by {closure.decidedBy}
          {closure.decidedAt ? ` · ${new Date(closure.decidedAt).toLocaleDateString()}` : ''}
        </p>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  currentUsername,
}: {
  msg: ObservationMessageDto;
  currentUsername: string;
}) {
  return (
    <div className={`pol-msg${msg.authorUsername === currentUsername ? ' pol-msg--own' : ''}`}>
      <div className="pol-msg-header">
        <span className="pol-msg-author">{msg.authorName ?? msg.authorUsername}</span>
        <span className="pol-msg-time">{relativeDate(msg.createdAt)}</span>
      </div>
      <p className="pol-msg-body">{msg.message}</p>
    </div>
  );
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pol-field">
      <label>{label}</label>
      {children}
      {error && <span className="pol-field-error">{error}</span>}
    </div>
  );
}
