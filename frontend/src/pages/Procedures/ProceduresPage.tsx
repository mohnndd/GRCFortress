import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  approveStep,
  delegateStep,
  fetchProcedureFileBlob,
  fetchProcedureAttachment,
  getProcedureCycle,
  getProcedure,
  listProcedures,
  postMessage,
  procedurePreApprove,
  procedurePreReject,
  rejectStep,
  uploadProcedure,
  type ApprovalCycleDetail,
  type ApprovalStepDetail,
  type ProcedureDetail,
  type ProcedureListItem,
} from '../../api/procedureApi';
import type { ProcedureVersionFile, StepStatus, ProcedureStatus } from '../../api/procedureApi';
import { listDepartments, type Department } from '../../api/departmentApi';
import { FilePreviewModal } from '../Policies/FilePreviewModal';
import './Procedures.css';

// ── Status helpers ─────────────────────────────────────────────────────────

function statusLabel(s: ProcedureStatus | string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_PRE_APPROVAL: 'Pending Pre-Approval',
    IN_APPROVAL_CYCLE: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SUPERSEDED: 'Superseded',
    ARCHIVED: 'Archived',
  };
  return map[s] ?? s;
}

function statusClass(s: ProcedureStatus | string): string {
  const map: Record<string, string> = {
    DRAFT: 'badge-draft',
    PENDING_PRE_APPROVAL: 'badge-pre-approval',
    IN_APPROVAL_CYCLE: 'badge-review',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    SUPERSEDED: 'badge-superseded',
    ARCHIVED: 'badge-archived',
  };
  return map[s] ?? 'badge-draft';
}

function stepStatusClass(s: StepStatus): string {
  const map: Record<string, string> = {
    PENDING: 'step-pending',
    ACTIVE: 'step-active',
    APPROVED: 'step-approved',
    REJECTED: 'step-rejected',
  };
  return map[s] ?? '';
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : '?';
}

const PREVIEWABLE = new Set(['PDF', 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'DOCX', 'DOC']);
function isPreviewable(fileType: string): boolean {
  return PREVIEWABLE.has(fileType.toUpperCase());
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

// ── Upload form state ──────────────────────────────────────────────────────

interface UploadForm {
  files: File[];
  title: string;
  description: string;
  category: string;
  changeReason: string;
  changeSummary: string;
  previousVersionId: string;
  departmentId: string;
  product: string;
  workflowFile: File | null;
  slaFile: File | null;
}

const EMPTY_FORM: UploadForm = {
  files: [],
  title: '',
  description: '',
  category: '',
  changeReason: '',
  changeSummary: '',
  previousVersionId: '',
  departmentId: '',
  product: '',
  workflowFile: null,
  slaFile: null,
};

// ── Main component ─────────────────────────────────────────────────────────

export function ProceduresPage() {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState<ProcedureListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Drawer: upload form
  const [drawerMode, setDrawerMode] = useState<'upload' | 'detail' | null>(null);
  const [form, setForm] = useState<UploadForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal
  const [previewFile, setPreviewFile] = useState<ProcedureVersionFile | null>(null);
  const [previewLocalFile, setPreviewLocalFile] = useState<File | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Drawer: detail
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureDetail | null>(null);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [cycle, setCycle] = useState<ApprovalCycleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Step actions
  const [actionStep, setActionStep] = useState<ApprovalStepDetail | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delegate' | null>(null);
  const [actionComments, setActionComments] = useState('');
  const [delegateTarget, setDelegateTarget] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Message thread
  const [newMessage, setNewMessage] = useState<Record<number, string>>({});
  const [sendingMsg, setSendingMsg] = useState<Record<number, boolean>>({});

  // Pre-approval actions
  const [preActionVersionId, setPreActionVersionId] = useState<number | null>(null);
  const [preActionType, setPreActionType] = useState<'approve' | 'reject' | null>(null);
  const [preComments, setPreComments] = useState('');
  const [preSaving, setPreSaving] = useState(false);
  const [preError, setPreError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listProcedures(), listDepartments()])
      .then(([p, d]) => { setProcedures(p); setDepartments(d); })
      .catch(() => setPageError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Upload form ──────────────────────────────────────────────────────────

  function openPreviewLocal(f: File) {
    setPreviewLocalFile(f);
    setPreviewFile(null);
    setPreviewOpen(true);
  }

  function openPreviewRemote(f: ProcedureVersionFile) {
    setPreviewFile(f);
    setPreviewLocalFile(undefined);
    setPreviewOpen(true);
  }

  function openUpload() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setUploadError(null);
    setDrawerMode('upload');
  }

  function setField<K extends keyof UploadForm>(key: K, value: UploadForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setFormErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    setForm((p) => ({ ...p, files: [...p.files, ...arr] }));
    setFormErrors((p) => { const n = { ...p }; delete n.files; return n; });
  }

  function removeFile(index: number) {
    setForm((p) => ({ ...p, files: p.files.filter((_, i) => i !== index) }));
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (form.files.length === 0) errs.files = 'Please attach at least one file';
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.changeReason.trim()) errs.changeReason = 'Reason / update notes are required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleUpload() {
    if (!validateForm()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const created = await uploadProcedure({
        files: form.files,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        changeReason: form.changeReason.trim(),
        changeSummary: form.changeSummary.trim() || undefined,
        previousVersionId: form.previousVersionId ? Number(form.previousVersionId) : undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        product: form.product.trim() || undefined,
        workflowFile: form.workflowFile ?? undefined,
        slaFile: form.slaFile ?? undefined,
      });
      setProcedures((p) => {
        const idx = p.findIndex((x) => x.id === created.id);
        return idx >= 0 ? p.map((x) => x.id === created.id ? created : x) : [created, ...p];
      });
      setDrawerMode(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUploadError(msg ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  // ── Procedure detail ─────────────────────────────────────────────────────

  async function openDetail(procedure: ProcedureListItem) {
    setDrawerMode('detail');
    setSelectedProcedure(null);
    setCycle(null);
    setSelectedVersionIdx(0);
    setActionStep(null);
    setActionType(null);
    setPreActionVersionId(null);
    setDetailLoading(true);
    try {
      const detail = await getProcedure(procedure.id);
      setSelectedProcedure(detail);
      if (detail.versions.length > 0) {
        await loadCycle(detail.id, detail.versions[0].id);
      }
    } catch {
      setPageError('Failed to load procedure details.');
      setDrawerMode(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadCycle(procedureId: number, versionId: number) {
    setCycle(null);
    const c = await getProcedureCycle(procedureId, versionId);
    setCycle(c);
  }

  async function switchVersion(idx: number) {
    setSelectedVersionIdx(idx);
    setActionStep(null);
    setActionType(null);
    setCycle(null);
    if (selectedProcedure) {
      const v = selectedProcedure.versions[idx];
      await loadCycle(selectedProcedure.id, v.id);
    }
  }

  // ── Step actions ─────────────────────────────────────────────────────────

  function openAction(step: ApprovalStepDetail, type: 'approve' | 'reject' | 'delegate') {
    setActionStep(step);
    setActionType(type);
    setActionComments('');
    setDelegateTarget(step.departmentTeamMembers[0]?.id.toString() ?? '');
    setActionError(null);
  }

  async function submitAction() {
    if (!actionStep || !actionType) return;
    if (actionType === 'delegate' && !delegateTarget) {
      setActionError('Select a team member to delegate to.');
      return;
    }
    setActionSaving(true);
    setActionError(null);
    try {
      if (actionType === 'approve') {
        await approveStep(actionStep.id, actionComments || undefined);
      } else if (actionType === 'reject') {
        await rejectStep(actionStep.id, actionComments || undefined);
      } else {
        await delegateStep(actionStep.id, Number(delegateTarget));
      }
      setActionStep(null);
      setActionType(null);
      // Refresh detail
      if (selectedProcedure) {
        const detail = await getProcedure(selectedProcedure.id);
        setSelectedProcedure(detail);
        const v = detail.versions[selectedVersionIdx];
        if (v) await loadCycle(detail.id, v.id);
        const updated = await listProcedures();
        setProcedures(updated);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(msg ?? 'Action failed.');
    } finally {
      setActionSaving(false);
    }
  }

  // ── Pre-approval ─────────────────────────────────────────────────────────

  function openPreAction(versionId: number, type: 'approve' | 'reject') {
    setPreActionVersionId(versionId);
    setPreActionType(type);
    setPreComments('');
    setPreError(null);
  }

  async function submitPreAction() {
    if (!preActionVersionId || !preActionType || !selectedProcedure) return;
    setPreSaving(true);
    setPreError(null);
    try {
      if (preActionType === 'approve') {
        await procedurePreApprove(selectedProcedure.id, preActionVersionId, preComments || undefined);
      } else {
        await procedurePreReject(selectedProcedure.id, preActionVersionId, preComments || undefined);
      }
      setPreActionVersionId(null);
      const detail = await getProcedure(selectedProcedure.id);
      setSelectedProcedure(detail);
      const v = detail.versions[selectedVersionIdx];
      if (v) await loadCycle(detail.id, v.id);
      const updated = await listProcedures();
      setProcedures(updated);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPreError(msg ?? 'Action failed.');
    } finally {
      setPreSaving(false);
    }
  }

  // ── Discussion thread ────────────────────────────────────────────────────

  async function sendMessage(stepId: number) {
    const text = (newMessage[stepId] ?? '').trim();
    if (!text) return;
    setSendingMsg((p) => ({ ...p, [stepId]: true }));
    try {
      await postMessage(stepId, text);
      setNewMessage((p) => ({ ...p, [stepId]: '' }));
      // Refresh cycle to get updated messages
      if (selectedProcedure) {
        const v = selectedProcedure.versions[selectedVersionIdx];
        if (v) await loadCycle(selectedProcedure.id, v.id);
      }
    } finally {
      setSendingMsg((p) => ({ ...p, [stepId]: false }));
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) return <p className="pol-loading">Loading procedures…</p>;

  const currentVersion = selectedProcedure?.versions[selectedVersionIdx];

  return (
    <div className={`pol-page${drawerMode ? ' pol-page--with-drawer' : ''}`}>
      {previewOpen && (
        <FilePreviewModal
          file={previewFile}
          localFile={previewLocalFile}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {/* Main area */}
      <div className="pol-main">
        <div className="pol-header">
          <div>
            <h2>Procedures &amp; Standards</h2>
            <p className="pol-subtitle">
              Upload, version, and manage approval workflows for organizational procedures.
            </p>
          </div>
          <button className="pol-btn-primary" onClick={openUpload}>+ New procedure</button>
        </div>

        {pageError && <p className="pol-error">{pageError}</p>}

        {procedures.length === 0 ? (
          <div className="pol-empty">
            <p>No procedures yet.</p>
            <button className="pol-btn-primary" onClick={openUpload}>Upload your first procedure</button>
          </div>
        ) : (
          <table className="pol-table">
            <thead>
              <tr>
                <th>Procedure #</th>
                <th>Title</th>
                <th>Category</th>
                <th>Assigned to</th>
                <th>Version</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map((p) => (
                <tr
                  key={p.id}
                  className={`pol-table-row${selectedProcedure?.id === p.id ? ' pol-table-row--selected' : ''}`}
                  onClick={() => openDetail(p)}
                >
                  <td className="pol-col-number">{p.policyNumber}</td>
                  <td className="pol-col-title">{p.title}</td>
                  <td className="pol-col-category">{p.category ?? '—'}</td>
                  <td className="pol-col-scope">
                    {p.departmentName
                      ? <span className="pol-scope-tag pol-scope-tag--dept">{p.departmentName}</span>
                      : p.product
                      ? <span className="pol-scope-tag pol-scope-tag--product">{p.product}</span>
                      : <span className="pol-col-category">—</span>}
                  </td>
                  <td className="pol-col-version">
                    {p.latestVersionNumber ? `v${p.latestVersionNumber}` : '—'}
                    {p.versionCount > 1 && (
                      <span className="pol-version-count"> ({p.versionCount})</span>
                    )}
                  </td>
                  <td className="pol-col-status">
                    <span className={`pol-badge ${statusClass(p.status)}`}>{statusLabel(p.status)}</span>
                  </td>
                  <td className="pol-col-updated">{relativeDate(p.updatedAt)}</td>
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
            <h3>{drawerMode === 'upload' ? 'New Procedure' : (selectedProcedure?.title ?? '…')}</h3>
            <button className="pol-drawer-close" onClick={() => setDrawerMode(null)}>✕</button>
          </div>

          {/* ── Upload form ── */}
          {drawerMode === 'upload' && (
            <div className="pol-drawer-body">
              <FieldGroup label="Documents *" error={formErrors.files}>
                <div
                  className="pol-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
                >
                  <span className="pol-dropzone-hint">
                    Click or drag files here — PDF, DOCX, or images (multiple allowed)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
                />
                {form.files.length > 0 && (
                  <ul className="pol-file-list">
                    {form.files.map((f, i) => (
                      <li key={i} className="pol-file-list-item">
                        <span className="pol-file-type-badge">{fileExt(f.name)}</span>
                        <span className="pol-file-list-name" title={f.name}>{f.name}</span>
                        <span className="pol-file-size">{formatBytes(f.size)}</span>
                        <button
                          type="button"
                          className="pol-file-preview-btn"
                          onClick={(e) => { e.stopPropagation(); openPreviewLocal(f); }}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="pol-file-remove-btn"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </FieldGroup>

              <FieldGroup label="Procedure title *" error={formErrors.title}>
                <input value={form.title} onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Incident Response Procedure" />
              </FieldGroup>

              <div className="pol-form-row">
                <FieldGroup label="Category" error={formErrors.category}>
                  <input value={form.category} onChange={(e) => setField('category', e.target.value)}
                    placeholder="e.g. IT Security" />
                </FieldGroup>
                <FieldGroup label="New version of existing procedure">
                  <select
                    value={form.previousVersionId}
                    onChange={(e) => setField('previousVersionId', e.target.value)}
                  >
                    <option value="">— New procedure —</option>
                    {procedures
                      .filter((p) => p.latestVersionId != null)
                      .map((p) => (
                        <option key={p.latestVersionId} value={p.latestVersionId!}>
                          {p.policyNumber} — {p.title} (v{p.latestVersionNumber})
                        </option>
                      ))}
                  </select>
                </FieldGroup>
              </div>

              <div className="pol-form-row">
                <FieldGroup label="Department">
                  <select
                    value={form.departmentId}
                    onChange={(e) => setField('departmentId', e.target.value)}
                  >
                    <option value="">— None —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </FieldGroup>
                <FieldGroup label="Product / service">
                  <input
                    value={form.product}
                    onChange={(e) => setField('product', e.target.value)}
                    placeholder="e.g. Mobile Banking App"
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Workflow document">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setField('workflowFile', f);
                  }}
                />
                {form.workflowFile && (
                  <span className="pol-file-size">{form.workflowFile.name} ({formatBytes(form.workflowFile.size)})</span>
                )}
              </FieldGroup>

              <FieldGroup label="SLA document">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setField('slaFile', f);
                  }}
                />
                {form.slaFile && (
                  <span className="pol-file-size">{form.slaFile.name} ({formatBytes(form.slaFile.size)})</span>
                )}
              </FieldGroup>

              <FieldGroup label="Reason / update notes *" error={formErrors.changeReason}>
                <textarea
                  value={form.changeReason}
                  onChange={(e) => setField('changeReason', e.target.value)}
                  placeholder="Why is this procedure being uploaded or revised?"
                  rows={3}
                />
              </FieldGroup>

              <FieldGroup label="Change summary">
                <textarea
                  value={form.changeSummary}
                  onChange={(e) => setField('changeSummary', e.target.value)}
                  placeholder="Optional brief summary of what changed in this version"
                  rows={2}
                />
              </FieldGroup>

              <FieldGroup label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Optional extended description of this procedure"
                  rows={2}
                />
              </FieldGroup>

              {uploadError && <p className="pol-error">{uploadError}</p>}

              <div className="pol-form-actions">
                <button className="pol-btn-primary" onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Upload & submit'}
                </button>
                <button className="pol-btn-ghost" onClick={() => setDrawerMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* ── Procedure detail ── */}
          {drawerMode === 'detail' && (
            <div className="pol-drawer-body">
              {detailLoading && <p className="pol-loading">Loading…</p>}

              {selectedProcedure && (
                <>
                  {/* Meta */}
                  <div className="pol-detail-meta">
                    <span className="pol-card-number">{selectedProcedure.policyNumber}</span>
                    <span className={`pol-badge ${statusClass(selectedProcedure.status)}`}>
                      {statusLabel(selectedProcedure.status)}
                    </span>
                  </div>
                  {selectedProcedure.category && (
                    <p className="pol-detail-category">{selectedProcedure.category}</p>
                  )}
                  {(selectedProcedure.departmentName || selectedProcedure.product) && (
                    <p className="pol-detail-scope">
                      {selectedProcedure.departmentName
                        ? <><span className="pol-scope-label">Department:</span> <span className="pol-scope-tag pol-scope-tag--dept">{selectedProcedure.departmentName}</span></>
                        : <><span className="pol-scope-label">Product:</span> <span className="pol-scope-tag pol-scope-tag--product">{selectedProcedure.product}</span></>}
                    </p>
                  )}

                  {/* Workflow and SLA attachments */}
                  {selectedProcedure.workflowFileName && (
                    <p className="pol-detail-scope">
                      <span className="pol-scope-label">Workflow:</span>{' '}
                      <span>{selectedProcedure.workflowFileName}</span>{' '}
                      <button
                        type="button"
                        className="pol-btn-ghost pol-btn-sm"
                        onClick={() => {
                          fetchProcedureAttachment(selectedProcedure.id, 'workflow').then((url) => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = selectedProcedure.workflowFileName!;
                            a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          });
                        }}
                      >
                        Download
                      </button>
                    </p>
                  )}
                  {selectedProcedure.slaFileName && (
                    <p className="pol-detail-scope">
                      <span className="pol-scope-label">SLA:</span>{' '}
                      <span>{selectedProcedure.slaFileName}</span>{' '}
                      <button
                        type="button"
                        className="pol-btn-ghost pol-btn-sm"
                        onClick={() => {
                          fetchProcedureAttachment(selectedProcedure.id, 'sla').then((url) => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = selectedProcedure.slaFileName!;
                            a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          });
                        }}
                      >
                        Download
                      </button>
                    </p>
                  )}

                  {selectedProcedure.description && (
                    <p className="pol-detail-desc">{selectedProcedure.description}</p>
                  )}

                  {/* Version tabs */}
                  <div className="pol-version-tabs">
                    {selectedProcedure.versions.map((v, i) => (
                      <button
                        key={v.id}
                        className={`pol-version-tab${i === selectedVersionIdx ? ' pol-version-tab--active' : ''}`}
                        onClick={() => switchVersion(i)}
                      >
                        v{v.versionNumber}
                        <span className={`pol-badge-sm ${statusClass(v.status)}`}>
                          {statusLabel(v.status)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {currentVersion && (
                    <div className="pol-version-detail">
                      {/* Files */}
                      {currentVersion.files.length > 0 && (
                        <ul className="pol-file-list pol-file-list--detail">
                          {currentVersion.files.map((f) => (
                            <li key={f.id} className="pol-file-list-item">
                              <span className="pol-file-type-badge">{f.fileType}</span>
                              <span className="pol-file-list-name" title={f.fileName}>{f.fileName}</span>
                              {f.fileSizeBytes && (
                                <span className="pol-file-size">{formatBytes(f.fileSizeBytes)}</span>
                              )}
                              {isPreviewable(f.fileType) && (
                                <button
                                  type="button"
                                  className="pol-file-preview-btn"
                                  onClick={() => openPreviewRemote(f)}
                                >
                                  Preview
                                </button>
                              )}
                              <a
                                className="pol-btn-ghost pol-btn-sm"
                                href={`/api/v1/procedures/files/${f.id}`}
                                download={f.fileName}
                                onClick={(e) => {
                                  e.preventDefault();
                                  fetchProcedureFileBlob(f.id).then((url) => {
                                    const a = document.createElement('a');
                                    a.href = url; a.download = f.fileName; a.click();
                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                  });
                                }}
                              >
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Change notes */}
                      <div className="pol-change-notes">
                        <p className="pol-change-reason">{currentVersion.changeReason}</p>
                        {currentVersion.changeSummary && (
                          <p className="pol-change-summary">{currentVersion.changeSummary}</p>
                        )}
                      </div>

                      {/* Pre-approval banner */}
                      {currentVersion.status === 'PENDING_PRE_APPROVAL' && (
                        <div className="pol-pre-approval-banner">
                          <span>
                            ⏳ Awaiting pre-approval from{' '}
                            <strong>{currentVersion.preApprovalAssigneeName ?? 'department head'}</strong>
                          </span>
                          {currentVersion.isCurrentUserPreApprover && !preActionVersionId && (
                            <div className="pol-pre-approval-actions">
                              <button
                                className="pol-btn-approve"
                                onClick={() => openPreAction(currentVersion.id, 'approve')}
                              >
                                Pre-approve
                              </button>
                              <button
                                className="pol-btn-reject"
                                onClick={() => openPreAction(currentVersion.id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {preActionVersionId === currentVersion.id && (
                            <div className="pol-inline-action">
                              <textarea
                                placeholder={preActionType === 'approve' ? 'Optional comments…' : 'Reason for rejection…'}
                                value={preComments}
                                onChange={(e) => setPreComments(e.target.value)}
                                rows={2}
                              />
                              {preError && <p className="pol-error">{preError}</p>}
                              <div className="pol-action-btns">
                                <button
                                  className={preActionType === 'approve' ? 'pol-btn-approve' : 'pol-btn-reject'}
                                  onClick={submitPreAction}
                                  disabled={preSaving}
                                >
                                  {preSaving ? 'Saving…' : preActionType === 'approve' ? 'Confirm pre-approval' : 'Confirm rejection'}
                                </button>
                                <button className="pol-btn-ghost" onClick={() => setPreActionVersionId(null)}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Approval cycle */}
                      {cycle && (
                        <div className="pol-cycle">
                          <div className="pol-cycle-header">
                            <h4>Approval cycle</h4>
                            <span className={`pol-badge ${
                              cycle.status === 'COMPLETED_APPROVED' ? 'badge-approved' :
                              cycle.status === 'COMPLETED_REJECTED' ? 'badge-rejected' : 'badge-review'
                            }`}>
                              {cycle.status === 'COMPLETED_APPROVED' ? 'Approved'
                                : cycle.status === 'COMPLETED_REJECTED' ? 'Rejected'
                                : 'In Progress'}
                            </span>
                          </div>

                          <div className="pol-cycle-steps">
                            {cycle.steps.map((step) => (
                              <StepCard
                                key={step.id}
                                step={step}
                                actionStep={actionStep}
                                actionType={actionType}
                                actionComments={actionComments}
                                delegateTarget={delegateTarget}
                                actionSaving={actionSaving}
                                actionError={actionError}
                                newMessage={newMessage[step.id] ?? ''}
                                sendingMsg={sendingMsg[step.id] ?? false}
                                currentUsername={user?.username ?? ''}
                                onOpenAction={openAction}
                                onCancelAction={() => { setActionStep(null); setActionType(null); }}
                                onSubmitAction={submitAction}
                                onCommentsChange={setActionComments}
                                onDelegateChange={setDelegateTarget}
                                onMessageChange={(v) => setNewMessage((p) => ({ ...p, [step.id]: v }))}
                                onSendMessage={() => sendMessage(step.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────

interface StepCardProps {
  step: ApprovalStepDetail;
  actionStep: ApprovalStepDetail | null;
  actionType: 'approve' | 'reject' | 'delegate' | null;
  actionComments: string;
  delegateTarget: string;
  actionSaving: boolean;
  actionError: string | null;
  newMessage: string;
  sendingMsg: boolean;
  currentUsername: string;
  onOpenAction: (step: ApprovalStepDetail, type: 'approve' | 'reject' | 'delegate') => void;
  onCancelAction: () => void;
  onSubmitAction: () => void;
  onCommentsChange: (v: string) => void;
  onDelegateChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onSendMessage: () => void;
}

function StepCard({
  step, actionStep, actionType, actionComments, delegateTarget,
  actionSaving, actionError, newMessage, sendingMsg, currentUsername,
  onOpenAction, onCancelAction, onSubmitAction, onCommentsChange, onDelegateChange,
  onMessageChange, onSendMessage,
}: StepCardProps) {
  const isThisActionStep = actionStep?.id === step.id;
  const [threadOpen, setThreadOpen] = useState(false);

  return (
    <div className={`pol-step ${stepStatusClass(step.status)}`}>
      <div className="pol-step-header">
        <div className="pol-step-order">{step.stepOrder}</div>
        <div className="pol-step-info">
          <span className="pol-step-dept">{step.departmentName}</span>
          <span className="pol-step-assignee">
            {step.delegatedToName ? (
              <>
                <span className="pol-delegated-tag">Delegated to</span> {step.delegatedToName}
                <span className="pol-step-meta"> (originally: {step.assignedToName})</span>
              </>
            ) : (
              step.assignedToName ?? 'Unassigned'
            )}
          </span>
        </div>
        <span className={`pol-step-status-badge ${stepStatusClass(step.status)}`}>
          {step.status === 'ACTIVE' ? '● Active'
            : step.status === 'APPROVED' ? '✓ Approved'
            : step.status === 'REJECTED' ? '✕ Rejected'
            : '○ Pending'}
        </span>
      </div>

      {step.comments && (
        <p className="pol-step-comments">{step.comments}</p>
      )}
      {step.decidedAt && (
        <p className="pol-step-decided">Decided {relativeDate(step.decidedAt)}</p>
      )}

      {/* Action buttons */}
      {step.isCurrentUserActiveActor && !isThisActionStep && (
        <div className="pol-step-actions">
          <button className="pol-btn-approve" onClick={() => onOpenAction(step, 'approve')}>Approve</button>
          <button className="pol-btn-reject" onClick={() => onOpenAction(step, 'reject')}>Reject</button>
          {/* Delegate only visible to the original head (not to a delegated person) */}
          {step.delegatedToId === null && step.departmentTeamMembers.length > 0 && (
            <button className="pol-btn-delegate" onClick={() => onOpenAction(step, 'delegate')}>
              Delegate
            </button>
          )}
        </div>
      )}

      {/* Inline action form */}
      {isThisActionStep && actionType && (
        <div className="pol-inline-action">
          {actionType === 'delegate' ? (
            <div className="pol-delegate-form">
              <label>Delegate to:</label>
              <select value={delegateTarget} onChange={(e) => onDelegateChange(e.target.value)}>
                {step.departmentTeamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} — {m.positionTitle}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <textarea
              placeholder={actionType === 'approve' ? 'Optional approval comments…' : 'Reason for rejection…'}
              value={actionComments}
              onChange={(e) => onCommentsChange(e.target.value)}
              rows={2}
            />
          )}
          {actionError && <p className="pol-error">{actionError}</p>}
          <div className="pol-action-btns">
            <button
              className={actionType === 'approve' ? 'pol-btn-approve' : actionType === 'reject' ? 'pol-btn-reject' : 'pol-btn-delegate'}
              onClick={onSubmitAction}
              disabled={actionSaving}
            >
              {actionSaving ? 'Saving…' : actionType === 'approve' ? 'Confirm approval' : actionType === 'reject' ? 'Confirm rejection' : 'Confirm delegation'}
            </button>
            <button className="pol-btn-ghost" onClick={onCancelAction}>Cancel</button>
          </div>
        </div>
      )}

      {/* Discussion thread toggle */}
      <button
        className="pol-thread-toggle"
        onClick={() => setThreadOpen((v) => !v)}
      >
        💬 Discussion ({step.messages.length}){threadOpen ? ' ▲' : ' ▼'}
      </button>

      {threadOpen && (
        <div className="pol-thread">
          {step.messages.length === 0 && (
            <p className="pol-thread-empty">No messages yet.</p>
          )}
          {step.messages.map((m) => (
            <div key={m.id} className={`pol-msg${m.authorUsername === currentUsername ? ' pol-msg--own' : ''}`}>
              <div className="pol-msg-header">
                <span className="pol-msg-author">{m.authorName ?? m.authorUsername}</span>
                <span className="pol-msg-time">{relativeDate(m.createdAt)}</span>
              </div>
              <p className="pol-msg-body">{m.message}</p>
            </div>
          ))}
          <div className="pol-thread-input">
            <textarea
              placeholder="Add a comment…"
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <button
              className="pol-btn-primary pol-btn-sm"
              onClick={onSendMessage}
              disabled={sendingMsg || !newMessage.trim()}
            >
              {sendingMsg ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

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
