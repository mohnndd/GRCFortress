import { useEffect, useRef, useState } from 'react';
import {
  addStakeholder,
  createDepartment,
  deleteDepartment,
  deleteStakeholder,
  designateHead,
  listDepartments,
  listStakeholders,
  updateDepartment,
  updateStakeholder,
  type Department,
  type Stakeholder,
  type StakeholderRequest,
} from '../../api/departmentApi';
import { useAuth } from '../../auth/AuthContext';
import './Departments.css';

const EMPTY_STAKEHOLDER: StakeholderRequest = {
  positionTitle: '',
  firstName: '',
  lastName: '',
  employeeNumber: '',
  phoneNumber: '',
  emailUsername: '',
};

const SAUDI_PHONE_RE = /^(?:\+966|0)5\d{8}$/;
const USERNAME_RE = /^[a-zA-Z0-9._%+\-]+$/;

function validateStakeholder(f: StakeholderRequest): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!f.positionTitle.trim()) errs.positionTitle = 'Required';
  if (!f.firstName.trim()) errs.firstName = 'Required';
  if (!f.lastName.trim()) errs.lastName = 'Required';
  if (!f.employeeNumber.trim()) errs.employeeNumber = 'Required';
  if (!f.phoneNumber.trim()) errs.phoneNumber = 'Required';
  else if (!SAUDI_PHONE_RE.test(f.phoneNumber.trim()))
    errs.phoneNumber = 'Use +9665XXXXXXXX or 05XXXXXXXX';
  if (!f.emailUsername.trim()) errs.emailUsername = 'Required';
  else if (!USERNAME_RE.test(f.emailUsername.trim()))
    errs.emailUsername = 'Letters, digits, . _ - + only (no @)';
  return errs;
}

function canWrite(roles: string[]) {
  return roles.includes('ADMIN') || roles.includes('COMPLIANCE_OFFICER');
}

export function DepartmentsPage() {
  const { user } = useAuth();
  const writable = canWrite(user?.roles ?? []);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Department form
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptSortOrder, setDeptSortOrder] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptSaving, setDeptSaving] = useState(false);

  // Expanded departments (stakeholders)
  const [expanded, setExpanded] = useState<Record<number, Stakeholder[]>>({});
  const [loadingStakeholders, setLoadingStakeholders] = useState<Record<number, boolean>>({});

  // Stakeholder form
  const [stakeholderForm, setStakeholderForm] = useState<{
    departmentId: number;
    editing: Stakeholder | null;
    fields: StakeholderRequest;
  } | null>(null);
  const [stakeholderErrors, setStakeholderErrors] = useState<Record<string, string>>({});
  const [stakeholderSaving, setStakeholderSaving] = useState(false);
  const [stakeholderError, setStakeholderError] = useState<string | null>(null);

  const stakeholderFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      const list = await listDepartments();
      setDepartments(list);
    } catch {
      setPageError('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpand(dept: Department) {
    if (expanded[dept.id]) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[dept.id];
        return next;
      });
      return;
    }
    setLoadingStakeholders((prev) => ({ ...prev, [dept.id]: true }));
    try {
      const list = await listStakeholders(dept.id);
      setExpanded((prev) => ({ ...prev, [dept.id]: list }));
    } finally {
      setLoadingStakeholders((prev) => ({ ...prev, [dept.id]: false }));
    }
  }

  function openNewDept() {
    setEditingDept(null);
    setDeptName('');
    setDeptDesc('');
    setDeptSortOrder('');
    setDeptError(null);
    setDeptFormOpen(true);
  }

  function openEditDept(dept: Department) {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDesc(dept.description ?? '');
    setDeptSortOrder(String(dept.sortOrder));
    setDeptError(null);
    setDeptFormOpen(true);
  }

  async function saveDept() {
    if (!deptName.trim()) { setDeptError('Department name is required.'); return; }
    setDeptSaving(true);
    setDeptError(null);
    const sortOrder = deptSortOrder.trim() ? Number(deptSortOrder.trim()) : undefined;
    try {
      if (editingDept) {
        const updated = await updateDepartment(editingDept.id, { name: deptName.trim(), description: deptDesc.trim() || undefined, sortOrder });
        setDepartments((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      } else {
        const created = await createDepartment({ name: deptName.trim(), description: deptDesc.trim() || undefined, sortOrder });
        setDepartments((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      setDeptFormOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeptError(msg ?? 'Failed to save department.');
    } finally {
      setDeptSaving(false);
    }
  }

  async function handleDeleteDept(dept: Department) {
    if (!confirm(`Delete department "${dept.name}"? All stakeholders will be removed.`)) return;
    try {
      await deleteDepartment(dept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
      setExpanded((prev) => { const next = { ...prev }; delete next[dept.id]; return next; });
    } catch {
      setPageError('Failed to delete department.');
    }
  }

  function openAddStakeholder(departmentId: number) {
    setStakeholderForm({ departmentId, editing: null, fields: { ...EMPTY_STAKEHOLDER } });
    setStakeholderErrors({});
    setStakeholderError(null);
    setTimeout(() => stakeholderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  function openEditStakeholder(departmentId: number, s: Stakeholder) {
    setStakeholderForm({
      departmentId,
      editing: s,
      fields: {
        positionTitle: s.positionTitle,
        firstName: s.firstName,
        lastName: s.lastName,
        employeeNumber: s.employeeNumber,
        phoneNumber: s.phoneNumber,
        emailUsername: s.emailUsername,
      },
    });
    setStakeholderErrors({});
    setStakeholderError(null);
  }

  function closeStakeholderForm() {
    setStakeholderForm(null);
    setStakeholderErrors({});
    setStakeholderError(null);
  }

  function setField(key: keyof StakeholderRequest, value: string) {
    setStakeholderForm((prev) => prev ? { ...prev, fields: { ...prev.fields, [key]: value } } : null);
    setStakeholderErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function saveStakeholder() {
    if (!stakeholderForm) return;
    const errs = validateStakeholder(stakeholderForm.fields);
    if (Object.keys(errs).length > 0) { setStakeholderErrors(errs); return; }
    setStakeholderSaving(true);
    setStakeholderError(null);
    try {
      const { departmentId, editing, fields } = stakeholderForm;
      let saved: Stakeholder;
      if (editing) {
        saved = await updateStakeholder(departmentId, editing.id, fields);
        setExpanded((prev) => ({
          ...prev,
          [departmentId]: prev[departmentId]?.map((s) => s.id === saved.id ? saved : s) ?? [],
        }));
      } else {
        saved = await addStakeholder(departmentId, fields);
        setExpanded((prev) => ({ ...prev, [departmentId]: [...(prev[departmentId] ?? []), saved] }));
        setDepartments((prev) => prev.map((d) => d.id === departmentId ? { ...d, stakeholderCount: d.stakeholderCount + 1 } : d));
      }
      closeStakeholderForm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setStakeholderError(msg ?? 'Failed to save stakeholder.');
    } finally {
      setStakeholderSaving(false);
    }
  }

  async function handleDesignateHead(departmentId: number, s: Stakeholder) {
    try {
      const updated = await designateHead(departmentId, s.id);
      setExpanded((prev) => ({
        ...prev,
        [departmentId]: prev[departmentId]?.map((x) =>
          x.id === updated.id ? updated : { ...x, isHead: false }
        ) ?? [],
      }));
    } catch {
      setPageError('Failed to designate department head.');
    }
  }

  async function handleDeleteStakeholder(departmentId: number, s: Stakeholder) {
    if (!confirm(`Remove ${s.firstName} ${s.lastName} (${s.positionTitle})?`)) return;
    try {
      await deleteStakeholder(departmentId, s.id);
      setExpanded((prev) => ({ ...prev, [departmentId]: prev[departmentId]?.filter((x) => x.id !== s.id) ?? [] }));
      setDepartments((prev) => prev.map((d) => d.id === departmentId ? { ...d, stakeholderCount: Math.max(0, d.stakeholderCount - 1) } : d));
    } catch {
      setPageError('Failed to remove stakeholder.');
    }
  }

  if (loading) return <p className="dept-loading">Loading departments…</p>;

  return (
    <div className="dept-page">
      <div className="dept-page-header">
        <div>
          <h2>Department Configuration</h2>
          <p className="dept-page-intro">
            Define your organizational departments and the stakeholder positions within each one.
            Each stakeholder's email is automatically routed to your company domain.
          </p>
        </div>
        {writable && (
          <button className="dept-btn-primary" onClick={openNewDept}>
            + Add department
          </button>
        )}
      </div>

      <div className="dept-summary-row">
        <div>
          <span className="dept-summary-value">{departments.length}</span>
          <span className="dept-summary-label">Departments</span>
        </div>
        <div>
          <span className="dept-summary-value">
            {departments.reduce((sum, dept) => sum + dept.stakeholderCount, 0)}
          </span>
          <span className="dept-summary-label">Stakeholder positions</span>
        </div>
        <div>
          <span className="dept-summary-value">
            {departments.length > 0 ? Math.min(...departments.map((dept) => dept.sortOrder)) : '-'}
          </span>
          <span className="dept-summary-label">First approval order</span>
        </div>
      </div>

      {pageError && <p className="dept-error">{pageError}</p>}

      {deptFormOpen && (
        <div className="dept-card dept-form-card">
          <h3>{editingDept ? 'Edit department' : 'New department'}</h3>
          <label>Department name</label>
          <input
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="e.g. Technology"
            autoFocus
          />
          <label>Description <span className="dept-optional">(optional)</span></label>
          <input
            value={deptDesc}
            onChange={(e) => setDeptDesc(e.target.value)}
            placeholder="Brief description of this department's scope"
          />
          <label>Approval order <span className="dept-optional">(lower = reviewed first in policy approval cycle)</span></label>
          <input
            type="number"
            value={deptSortOrder}
            onChange={(e) => setDeptSortOrder(e.target.value)}
            placeholder="e.g. 10, 20, 30 …"
            min={0}
          />
          {deptError && <p className="dept-error">{deptError}</p>}
          <div className="dept-form-actions">
            <button className="dept-btn-primary" onClick={saveDept} disabled={deptSaving}>
              {deptSaving ? 'Saving…' : 'Save'}
            </button>
            <button className="dept-btn-ghost" onClick={() => setDeptFormOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {departments.length === 0 && !deptFormOpen && (
        <div className="dept-empty">
          <p>No departments defined yet.</p>
          {writable && <button className="dept-btn-primary" onClick={openNewDept}>Add your first department</button>}
        </div>
      )}

      <div className="dept-list">
        {departments.length > 0 && (
          <div className="dept-list-header">
            <span>Department</span>
            <span>Description</span>
            <span>Approval order</span>
            <span>Positions</span>
            <span>Actions</span>
          </div>
        )}
        {departments.map((dept) => {
          const isExpanded = !!expanded[dept.id];
          const isLoadingS = !!loadingStakeholders[dept.id];
          const stakeholders = expanded[dept.id] ?? [];
          const showStakeholderForm =
            stakeholderForm?.departmentId === dept.id;

          return (
            <div key={dept.id} className="dept-card">
              <div className="dept-card-header">
                <div className="dept-card-title-block">
                  <h3 className="dept-name">{dept.name}</h3>
                </div>
                <p className="dept-desc">{dept.description || 'No description provided'}</p>
                <span className="dept-badge dept-badge--order" title="Approval cycle order">{dept.sortOrder}</span>
                <span className="dept-badge">{dept.stakeholderCount} position{dept.stakeholderCount !== 1 ? 's' : ''}</span>
                <div className="dept-card-actions">
                  <button
                    className="dept-btn-ghost dept-expand-btn"
                    onClick={() => toggleExpand(dept)}
                  >
                    {isExpanded ? 'Hide positions' : 'View positions'}
                  </button>
                  {writable && (
                    <>
                      <button className="dept-btn-ghost" onClick={() => openEditDept(dept)}>Edit</button>
                      <button className="dept-btn-danger" onClick={() => handleDeleteDept(dept)}>Delete</button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="dept-stakeholders">
                  {stakeholders.length > 0 && (
                    <div className="stakeholder-header-row">
                      <span>Position</span>
                      <span>Stakeholder</span>
                      <span>Employee #</span>
                      <span>Contact</span>
                      <span>Actions</span>
                    </div>
                  )}
                  {isLoadingS && <p className="dept-loading-s">Loading…</p>}

                  {!isLoadingS && stakeholders.length === 0 && !showStakeholderForm && (
                    <p className="dept-no-stakeholders">No positions defined yet.</p>
                  )}

                  {stakeholders.map((s) => {
                    const isEditing = stakeholderForm?.editing?.id === s.id;
                    return (
                      <div key={s.id} className={`stakeholder-row${isEditing ? ' stakeholder-row--editing' : ''}`}>
                        {isEditing ? (
                          <StakeholderFormFields
                            ref={stakeholderFormRef}
                            form={stakeholderForm!.fields}
                            errors={stakeholderErrors}
                            saving={stakeholderSaving}
                            serverError={stakeholderError}
                            setField={setField}
                            onSave={saveStakeholder}
                            onCancel={closeStakeholderForm}
                          />
                        ) : (
                          <>
                            <div className="stakeholder-position">
                              {s.positionTitle}
                              {s.isHead && <span className="stakeholder-head-badge" title="Department Head">Head</span>}
                            </div>
                            <div className="stakeholder-info">
                              <span className="stakeholder-name">{s.firstName} {s.lastName}</span>
                            </div>
                            <span className="stakeholder-meta">{s.employeeNumber}</span>
                            <div className="stakeholder-contact">
                              <span className="stakeholder-meta">{s.phoneNumber}</span>
                              <a href={`mailto:${s.email}`} className="stakeholder-email">{s.email}</a>
                            </div>
                            {writable && (
                              <div className="stakeholder-actions">
                                {!s.isHead && (
                                  <button
                                    className="dept-btn-ghost dept-btn-sm stakeholder-set-head-btn"
                                    title="Designate as department head"
                                    onClick={() => handleDesignateHead(dept.id, s)}
                                  >
                                    Set as head
                                  </button>
                                )}
                                <button className="dept-btn-ghost dept-btn-sm" onClick={() => openEditStakeholder(dept.id, s)}>Edit</button>
                                <button className="dept-btn-danger dept-btn-sm" onClick={() => handleDeleteStakeholder(dept.id, s)}>Remove</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {showStakeholderForm && !stakeholderForm?.editing && (
                    <div ref={stakeholderFormRef} className="stakeholder-new-form">
                      <StakeholderFormFields
                        form={stakeholderForm!.fields}
                        errors={stakeholderErrors}
                        saving={stakeholderSaving}
                        serverError={stakeholderError}
                        setField={setField}
                        onSave={saveStakeholder}
                        onCancel={closeStakeholderForm}
                      />
                    </div>
                  )}

                  {writable && !showStakeholderForm && (
                    <button className="dept-btn-ghost dept-add-position-btn" onClick={() => openAddStakeholder(dept.id)}>
                      + Add position
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StakeholderFormFieldsProps {
  ref?: React.Ref<HTMLDivElement>;
  form: StakeholderRequest;
  errors: Record<string, string>;
  saving: boolean;
  serverError: string | null;
  setField: (key: keyof StakeholderRequest, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function StakeholderFormFields({
  ref,
  form,
  errors,
  saving,
  serverError,
  setField,
  onSave,
  onCancel,
}: StakeholderFormFieldsProps) {
  return (
    <div ref={ref} className="stakeholder-form">
      <div className="stakeholder-form-grid">
        <Field label="Position title" error={errors.positionTitle}>
          <input
            value={form.positionTitle}
            onChange={(e) => setField('positionTitle', e.target.value)}
            placeholder="e.g. CTO"
            autoFocus
          />
        </Field>
        <Field label="First name" error={errors.firstName}>
          <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Khalid" />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Al-Rashidi" />
        </Field>
        <Field label="Employee number" error={errors.employeeNumber}>
          <input value={form.employeeNumber} onChange={(e) => setField('employeeNumber', e.target.value)} placeholder="EMP-0042" />
        </Field>
        <Field label="Phone number (Saudi)" error={errors.phoneNumber}>
          <input
            value={form.phoneNumber}
            onChange={(e) => setField('phoneNumber', e.target.value)}
            placeholder="+9665XXXXXXXX or 05XXXXXXXX"
          />
        </Field>
        <Field label="Email username" error={errors.emailUsername}>
          <div className="email-username-row">
            <input
              value={form.emailUsername}
              onChange={(e) => setField('emailUsername', e.target.value)}
              placeholder="khalid.alrashidi"
            />
            <span className="email-domain-suffix">@<em>company domain</em></span>
          </div>
        </Field>
      </div>
      {serverError && <p className="dept-error">{serverError}</p>}
      <div className="stakeholder-form-actions">
        <button className="dept-btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save position'}
        </button>
        <button className="dept-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
