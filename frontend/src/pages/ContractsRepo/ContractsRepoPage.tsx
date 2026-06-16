import { useState } from 'react';
import './ContractsRepo.css';

type ContractStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'ARCHIVED';

interface ContractRecord {
  id: number;
  contractId: string;
  title: string;
  departmentOwner: string;
  duration: string;
  startDate: string;
  endDate: string;
  description: string;
  status: ContractStatus;
  documents: string[];
}

interface ContractForm {
  contractId: string;
  title: string;
  departmentOwner: string;
  duration: string;
  startDate: string;
  endDate: string;
  description: string;
  status: ContractStatus;
  documents: File[];
}

const EMPTY_FORM: ContractForm = {
  contractId: '',
  title: '',
  departmentOwner: '',
  duration: '',
  startDate: '',
  endDate: '',
  description: '',
  status: 'ACTIVE',
  documents: [],
};

const INITIAL_CONTRACTS: ContractRecord[] = [
  {
    id: 1,
    contractId: 'CON-2026-001',
    title: 'Core Banking Support Agreement',
    departmentOwner: 'Technology',
    duration: '24 months',
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    description: 'Support and maintenance agreement for core banking platform operations.',
    status: 'ACTIVE',
    documents: ['Core Banking Support Agreement.pdf', 'SLA Addendum.pdf'],
  },
  {
    id: 2,
    contractId: 'CON-2026-002',
    title: 'Compliance Advisory Retainer',
    departmentOwner: 'Compliance Office',
    duration: '12 months',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    description: 'External advisory support for regulatory reviews and compliance assessments.',
    status: 'ACTIVE',
    documents: ['Compliance Retainer.pdf'],
  },
  {
    id: 3,
    contractId: 'CON-2025-014',
    title: 'SMS Gateway Services',
    departmentOwner: 'Operations',
    duration: '',
    startDate: '2025-08-15',
    endDate: '',
    description: 'Messaging gateway service contract for operational and compliance notifications.',
    status: 'EXPIRING_SOON',
    documents: ['SMS Gateway Contract.pdf'],
  },
];

const STATUS_LABEL: Record<ContractStatus, string> = {
  ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

function statusClass(status: ContractStatus) {
  const map: Record<ContractStatus, string> = {
    ACTIVE: 'badge-approved',
    EXPIRING_SOON: 'badge-pre-approval',
    EXPIRED: 'badge-rejected',
    ARCHIVED: 'badge-archived',
  };
  return map[status];
}

function formatDate(value: string) {
  return value || '-';
}

export function ContractsRepoPage() {
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<'new' | 'detail' | null>(null);
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      contractId: `CON-2026-${String(contracts.length + 1).padStart(3, '0')}`,
    });
    setSelectedContract(null);
    setFormError(null);
    setDrawerMode('new');
  }

  function openDetail(contract: ContractRecord) {
    setSelectedContract(contract);
    setDrawerMode('detail');
  }

  function setField<K extends keyof ContractForm>(key: K, value: ContractForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    setField('documents', [...form.documents, ...Array.from(files)]);
  }

  function removeFile(index: number) {
    setField('documents', form.documents.filter((_, i) => i !== index));
  }

  function saveContract() {
    if (!form.contractId.trim() || !form.title.trim() || !form.departmentOwner.trim()) {
      setFormError('Contract ID, title, and department owner are required.');
      return;
    }

    const record: ContractRecord = {
      id: Date.now(),
      contractId: form.contractId.trim(),
      title: form.title.trim(),
      departmentOwner: form.departmentOwner.trim(),
      duration: form.duration.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      status: form.status,
      documents: form.documents.map((file) => file.name),
    };

    setContracts((prev) => [record, ...prev]);
    setSelectedContract(record);
    setDrawerMode('detail');
  }

  function addDocumentsToSelected(files: FileList | null) {
    if (!files || !selectedContract) return;
    const newDocuments = Array.from(files).map((file) => file.name);
    const updated = {
      ...selectedContract,
      documents: [...selectedContract.documents, ...newDocuments],
    };
    setSelectedContract(updated);
    setContracts((prev) => prev.map((contract) => contract.id === updated.id ? updated : contract));
  }

  return (
    <div className={`contract-page${drawerMode ? ' contract-page--with-drawer' : ''}`}>
      <div className="contract-main">
        <div className="contract-header">
          <div>
            <h2>Contracts Repo</h2>
            <p className="contract-subtitle">
              Store organizational contracts with ownership, optional timing, descriptions, and supporting documents.
            </p>
          </div>
          <button className="contract-btn-primary" onClick={openNew}>+ New contract</button>
        </div>

        <table className="contract-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Title</th>
              <th>Department owner</th>
              <th>Duration</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className={`contract-table-row${selectedContract?.id === contract.id ? ' contract-table-row--selected' : ''}`}
                onClick={() => openDetail(contract)}
              >
                <td className="contract-col-number">{contract.contractId}</td>
                <td className="contract-col-title">{contract.title}</td>
                <td className="contract-col-muted">{contract.departmentOwner}</td>
                <td className="contract-col-muted">{contract.duration || '-'}</td>
                <td className="contract-col-muted">{formatDate(contract.startDate)}</td>
                <td className="contract-col-muted">{formatDate(contract.endDate)}</td>
                <td className="contract-col-status">
                  <span className={`contract-badge ${statusClass(contract.status)}`}>
                    {STATUS_LABEL[contract.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerMode && (
        <div className="contract-drawer">
          <div className="contract-drawer-header">
            <h3>{drawerMode === 'new' ? 'New Contract' : (selectedContract?.title ?? 'Contract')}</h3>
            <button className="contract-drawer-close" onClick={() => setDrawerMode(null)}>X</button>
          </div>

          {drawerMode === 'new' && (
            <div className="contract-drawer-body">
              <div className="contract-form-grid">
                <Field label="Contract ID *">
                  <input value={form.contractId} onChange={(event) => setField('contractId', event.target.value)} />
                </Field>
                <Field label="Department Owner *">
                  <input value={form.departmentOwner} onChange={(event) => setField('departmentOwner', event.target.value)} />
                </Field>
                <Field label="Title *">
                  <input value={form.title} onChange={(event) => setField('title', event.target.value)} />
                </Field>
                <Field label="Duration">
                  <input value={form.duration} onChange={(event) => setField('duration', event.target.value)} placeholder="Optional, e.g. 24 months" />
                </Field>
                <Field label="Start Date">
                  <input type="date" value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} />
                </Field>
                <Field label="End Date">
                  <input type="date" value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(event) => setField('status', event.target.value as ContractStatus)}>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRING_SOON">Expiring Soon</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea rows={5} value={form.description} onChange={(event) => setField('description', event.target.value)} />
              </Field>

              <div className="contract-field">
                <label>Uploaded Documents</label>
                <input type="file" multiple onChange={(event) => addFiles(event.target.files)} />
                {form.documents.length > 0 && (
                  <ul className="contract-file-list">
                    {form.documents.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        <span>{file.name}</span>
                        <button onClick={() => removeFile(index)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {formError && <p className="contract-error">{formError}</p>}

              <div className="contract-form-actions">
                <button className="contract-btn-primary" onClick={saveContract}>Save contract</button>
                <button className="contract-btn-ghost" onClick={() => setDrawerMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {drawerMode === 'detail' && selectedContract && (
            <div className="contract-drawer-body">
              <section className="contract-detail-section">
                <span className={`contract-badge ${statusClass(selectedContract.status)}`}>
                  {STATUS_LABEL[selectedContract.status]}
                </span>
                <h4>{selectedContract.contractId}</h4>
                <p>{selectedContract.description || 'No description provided.'}</p>
              </section>

              <section className="contract-detail-grid">
                <Detail label="Department Owner" value={selectedContract.departmentOwner} />
                <Detail label="Duration" value={selectedContract.duration || '-'} />
                <Detail label="Start Date" value={formatDate(selectedContract.startDate)} />
                <Detail label="End Date" value={formatDate(selectedContract.endDate)} />
              </section>

              <section className="contract-detail-section">
                <h4>Uploaded Documents</h4>
                <label className="contract-add-documents">
                  Add PO, invoices, amendments, or other contract records
                  <input type="file" multiple onChange={(event) => addDocumentsToSelected(event.target.files)} />
                </label>
                {selectedContract.documents.length > 0 ? (
                  <ul className="contract-doc-list">
                    {selectedContract.documents.map((document) => (
                      <li key={document}>{document}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No documents uploaded.</p>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contract-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
