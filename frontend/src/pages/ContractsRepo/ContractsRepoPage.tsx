import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  listContracts, createContract, updateContract, uploadContractAttachment,
  contractAttachmentUrl, deleteContract, contractsExportUrl,
  type Contract, type ContractRequest,
} from '../../api/contractApi';
import './ContractsRepo.css';

type DrawerMode = 'detail' | 'form' | null;

const CONTRACT_TYPES = ['SERVICE', 'NDA', 'VENDOR', 'MAINTENANCE', 'ADVISORY', 'LEASE', 'OTHER'];
const STATUSES = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'ARCHIVED'];

function statusLabel(s: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Active', EXPIRING_SOON: 'Expiring Soon', EXPIRED: 'Expired', ARCHIVED: 'Archived',
  };
  return map[s] ?? s;
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    ACTIVE: 'contract-badge--active',
    EXPIRING_SOON: 'contract-badge--warning',
    EXPIRED: 'contract-badge--danger',
    ARCHIVED: 'contract-badge--muted',
  };
  return map[s] ?? 'contract-badge--muted';
}

const EMPTY_FORM: ContractRequest = {
  title: '', counterparty: '', contractType: 'SERVICE', departmentOwner: '',
  value: null, currency: 'SAR', startDate: null, endDate: null, renewalDate: null,
  status: 'ACTIVE', description: '',
};

export function ContractsRepoPage() {
  const { user } = useAuth();
  const canWrite = user?.roles.some((r) => r === 'ADMIN' || r === 'COMPLIANCE_OFFICER') ?? false;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selected, setSelected] = useState<Contract | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [form, setForm] = useState<ContractRequest>(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setContracts(await listContracts());
    } catch {
      setError('Failed to load contracts.');
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

  function openEdit(c: Contract) {
    setSelected(c);
    setForm({
      title: c.title, counterparty: c.counterparty, contractType: c.contractType,
      departmentOwner: c.departmentOwner, value: c.value, currency: c.currency,
      startDate: c.startDate, endDate: c.endDate, renewalDate: c.renewalDate,
      status: c.status, description: c.description ?? '',
    });
    setPendingFile(null);
    setFormError(null);
    setDrawerMode('form');
  }

  function openDetail(c: Contract) {
    setSelected(c);
    setDrawerMode('detail');
  }

  function closeDrawer() { setDrawerMode(null); setSelected(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.counterparty.trim() || !form.departmentOwner.trim()) {
      setFormError('Title, counterparty, and department owner are required.');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      let saved: Contract;
      if (selected) {
        saved = await updateContract(selected.id, form);
      } else {
        saved = await createContract(form);
      }
      if (pendingFile) {
        saved = await uploadContractAttachment(saved.id, pendingFile);
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

  async function handleDelete(c: Contract) {
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    try {
      await deleteContract(c.id);
      closeDrawer();
      await load();
    } catch {
      alert('Delete failed.');
    }
  }

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q)
      || c.contractNumber.toLowerCase().includes(q)
      || c.counterparty.toLowerCase().includes(q)
      || c.departmentOwner.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={`contract-page${drawerMode ? ' contract-page--with-drawer' : ''}`}>
      <div className="contract-main">
        <div className="contract-header">
          <div>
            <h2>Contracts Repository</h2>
            <p className="contract-subtitle">
              Store and track organizational contracts with ownership, timelines, and supporting documents.
            </p>
          </div>
          <div className="contract-header-actions">
            <a className="contract-btn-ghost" href={contractsExportUrl()} download>↓ Export CSV</a>
            {canWrite && (
              <button className="contract-btn-primary" onClick={openCreate}>+ New contract</button>
            )}
          </div>
        </div>

        <div className="contract-filters">
          <input
            className="contract-search"
            type="search"
            placeholder="Search contracts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="contract-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>

        {loading && <p className="contract-state">Loading…</p>}
        {error && <p className="contract-error">{error}</p>}

        {!loading && !error && (
          <table className="contract-table">
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Title</th>
                <th>Counterparty</th>
                <th>Type</th>
                <th>Dept. Owner</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="contract-state">No contracts found.</td></tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={`contract-table-row${selected?.id === c.id ? ' contract-table-row--selected' : ''}`}
                  onClick={() => openDetail(c)}
                >
                  <td className="contract-col-number">{c.contractNumber}</td>
                  <td className="contract-col-title">{c.title}</td>
                  <td className="contract-col-muted">{c.counterparty}</td>
                  <td className="contract-col-muted">{c.contractType}</td>
                  <td className="contract-col-muted">{c.departmentOwner}</td>
                  <td className="contract-col-muted">{c.endDate ?? '—'}</td>
                  <td>
                    <span className={`contract-badge ${statusClass(c.status)}`}>{statusLabel(c.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerMode === 'detail' && selected && (
        <div className="contract-drawer">
          <div className="contract-drawer-header">
            <h3>{selected.title}</h3>
            <button className="contract-drawer-close" onClick={closeDrawer}>✕</button>
          </div>
          <div className="contract-drawer-body">
            <div className="contract-detail-top">
              <span className={`contract-badge ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span>
              <span className="contract-col-number">{selected.contractNumber}</span>
            </div>

            {selected.description && (
              <section className="contract-detail-section"><p>{selected.description}</p></section>
            )}

            <section className="contract-detail-grid">
              <div><span>Counterparty</span><strong>{selected.counterparty}</strong></div>
              <div><span>Type</span><strong>{selected.contractType}</strong></div>
              <div><span>Dept. Owner</span><strong>{selected.departmentOwner}</strong></div>
              <div><span>Value</span><strong>{selected.value != null ? `${selected.value.toLocaleString()} ${selected.currency}` : '—'}</strong></div>
              <div><span>Start Date</span><strong>{selected.startDate ?? '—'}</strong></div>
              <div><span>End Date</span><strong>{selected.endDate ?? '—'}</strong></div>
              <div><span>Renewal Date</span><strong>{selected.renewalDate ?? '—'}</strong></div>
              {selected.createdBy && <div><span>Created by</span><strong>{selected.createdBy}</strong></div>}
            </section>

            {selected.attachmentName && (
              <section className="contract-detail-section">
                <h4>Attachment</h4>
                <a className="contract-attachment-link" href={contractAttachmentUrl(selected.id)} target="_blank" rel="noopener noreferrer">
                  ↓ {selected.attachmentName}
                </a>
              </section>
            )}

            {canWrite && (
              <div className="contract-detail-actions">
                <button className="contract-btn-ghost-sm" onClick={() => openEdit(selected)}>Edit</button>
                <button className="contract-btn-danger-sm" onClick={() => handleDelete(selected)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      )}

      {drawerMode === 'form' && (
        <div className="contract-drawer">
          <div className="contract-drawer-header">
            <h3>{selected ? 'Edit Contract' : 'New Contract'}</h3>
            <button className="contract-drawer-close" onClick={closeDrawer}>✕</button>
          </div>
          <div className="contract-drawer-body">
            <form className="contract-form" onSubmit={handleSubmit}>
              {formError && <p className="contract-error">{formError}</p>}

              <label>Title <span className="contract-required">*</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <label>Counterparty <span className="contract-required">*</span>
                <input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} required />
              </label>
              <label>Department Owner <span className="contract-required">*</span>
                <input value={form.departmentOwner} onChange={(e) => setForm({ ...form, departmentOwner: e.target.value })} required />
              </label>

              <div className="contract-form-row">
                <label>Type
                  <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
                    {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>Status
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </label>
              </div>

              <div className="contract-form-row">
                <label>Value
                  <input type="number" min="0" step="0.01" value={form.value ?? ''}
                    onChange={(e) => setForm({ ...form, value: e.target.value ? parseFloat(e.target.value) : null })} />
                </label>
                <label>Currency
                  <input value={form.currency ?? 'SAR'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </label>
              </div>

              <div className="contract-form-row">
                <label>Start Date
                  <input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value || null })} />
                </label>
                <label>End Date
                  <input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || null })} />
                </label>
              </div>

              <label>Renewal Date
                <input type="date" value={form.renewalDate ?? ''} onChange={(e) => setForm({ ...form, renewalDate: e.target.value || null })} />
              </label>

              <label>Description
                <textarea rows={3} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>

              <label>Attachment
                <input type="file" ref={fileRef} onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)} />
                {pendingFile && <span className="contract-attachment-new">New: {pendingFile.name}</span>}
                {!pendingFile && selected?.attachmentName && (
                  <span className="contract-attachment-existing">Current: {selected.attachmentName}</span>
                )}
              </label>

              <div className="contract-form-footer">
                <button type="button" className="contract-btn-ghost-sm" onClick={closeDrawer}>Cancel</button>
                <button type="submit" className="contract-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : selected ? 'Save changes' : 'Create contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
