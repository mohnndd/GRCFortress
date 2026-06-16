import { useState } from 'react';
import './DecisionRegister.css';

type DecisionStatus = 'ACTIVE' | 'SUPERSEDED' | 'CLOSED' | 'REVOKED';

interface DecisionRecord {
  id: number;
  decisionId: string;
  title: string;
  decisionDate: string;
  decisionMaker: string;
  relatedRisk: string;
  relatedPolicyControl: string;
  backgroundContext: string;
  alternativesConsidered: string;
  decisionOutcome: string;
  justification: string;
  impactAssessment: string;
  actionsRequired: string;
  owner: string;
  dueDates: string;
  reviewDate: string;
  status: DecisionStatus;
  documents: string[];
}

interface DecisionForm {
  decisionId: string;
  title: string;
  decisionDate: string;
  decisionMaker: string;
  relatedRisk: string;
  relatedPolicyControl: string;
  backgroundContext: string;
  alternativesConsidered: string;
  decisionOutcome: string;
  justification: string;
  impactAssessment: string;
  actionsRequired: string;
  owner: string;
  dueDates: string;
  reviewDate: string;
  status: DecisionStatus;
  documents: File[];
}

const EMPTY_FORM: DecisionForm = {
  decisionId: '',
  title: '',
  decisionDate: '',
  decisionMaker: '',
  relatedRisk: '',
  relatedPolicyControl: '',
  backgroundContext: '',
  alternativesConsidered: '',
  decisionOutcome: '',
  justification: '',
  impactAssessment: '',
  actionsRequired: '',
  owner: '',
  dueDates: '',
  reviewDate: '',
  status: 'ACTIVE',
  documents: [],
};

const INITIAL_DECISIONS: DecisionRecord[] = [
  {
    id: 1,
    decisionId: 'DEC-2026-001',
    title: 'Approve revised incident notification timeline',
    decisionDate: '2026-06-10',
    decisionMaker: 'Risk Committee',
    relatedRisk: 'RISK-004',
    relatedPolicyControl: 'Incident Management Policy / IR-CTRL-02',
    backgroundContext: 'Regulatory expectations require clearer escalation timing for critical incidents.',
    alternativesConsidered: 'Maintain existing SLA; create separate breach notification workflow.',
    decisionOutcome: 'Approved revised timeline and escalation rules.',
    justification: 'Improves regulatory readiness and reduces breach notification delay risk.',
    impactAssessment: 'Operational process update with moderate training impact.',
    actionsRequired: 'Update SLA configuration and train incident owners.',
    owner: 'Head of Risk Management',
    dueDates: '2026-06-30',
    reviewDate: '2026-09-30',
    status: 'ACTIVE',
    documents: ['Risk Committee Minutes.pdf', 'Incident SLA Assessment.docx'],
  },
  {
    id: 2,
    decisionId: 'DEC-2026-002',
    title: 'Adopt new customer terms review cadence',
    decisionDate: '2026-05-26',
    decisionMaker: 'Executive Compliance Committee',
    relatedRisk: 'RISK-002',
    relatedPolicyControl: 'Terms and Conditions Governance Standard',
    backgroundContext: 'Product terms were not consistently reviewed before product changes.',
    alternativesConsidered: 'Annual review only; product-triggered review only.',
    decisionOutcome: 'Approved semiannual review and product-change trigger.',
    justification: 'Balances governance overhead with regulatory and customer impact.',
    impactAssessment: 'Legal and compliance workload increases during product releases.',
    actionsRequired: 'Create review calendar and assign product owners.',
    owner: 'Compliance Office',
    dueDates: '2026-07-15',
    reviewDate: '2026-11-26',
    status: 'ACTIVE',
    documents: ['Terms Governance Memo.pdf'],
  },
];

const STATUS_LABEL: Record<DecisionStatus, string> = {
  ACTIVE: 'Active',
  SUPERSEDED: 'Superseded',
  CLOSED: 'Closed',
  REVOKED: 'Revoked',
};

function statusClass(status: DecisionStatus) {
  const map: Record<DecisionStatus, string> = {
    ACTIVE: 'badge-approved',
    SUPERSEDED: 'badge-superseded',
    CLOSED: 'badge-archived',
    REVOKED: 'badge-rejected',
  };
  return map[status];
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function DecisionRegisterPage() {
  const [decisions, setDecisions] = useState(INITIAL_DECISIONS);
  const [selectedDecision, setSelectedDecision] = useState<DecisionRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<'new' | 'detail' | null>(null);
  const [form, setForm] = useState<DecisionForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      decisionId: `DEC-2026-${String(decisions.length + 1).padStart(3, '0')}`,
    });
    setFormError(null);
    setSelectedDecision(null);
    setDrawerMode('new');
  }

  function openDetail(decision: DecisionRecord) {
    setSelectedDecision(decision);
    setDrawerMode('detail');
  }

  function setField<K extends keyof DecisionForm>(key: K, value: DecisionForm[K]) {
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

  function saveDecision() {
    if (!form.decisionId.trim() || !form.title.trim() || !form.decisionDate || !form.decisionMaker.trim()) {
      setFormError('Decision ID, title, decision date, and decision maker are required.');
      return;
    }

    const record: DecisionRecord = {
      id: Date.now(),
      decisionId: form.decisionId.trim(),
      title: form.title.trim(),
      decisionDate: form.decisionDate,
      decisionMaker: form.decisionMaker.trim(),
      relatedRisk: form.relatedRisk.trim(),
      relatedPolicyControl: form.relatedPolicyControl.trim(),
      backgroundContext: form.backgroundContext.trim(),
      alternativesConsidered: form.alternativesConsidered.trim(),
      decisionOutcome: form.decisionOutcome.trim(),
      justification: form.justification.trim(),
      impactAssessment: form.impactAssessment.trim(),
      actionsRequired: form.actionsRequired.trim(),
      owner: form.owner.trim(),
      dueDates: form.dueDates.trim(),
      reviewDate: form.reviewDate,
      status: form.status,
      documents: form.documents.map((file) => file.name),
    };

    setDecisions((prev) => [record, ...prev]);
    setSelectedDecision(record);
    setDrawerMode('detail');
  }

  return (
    <div className={`dec-page${drawerMode ? ' dec-page--with-drawer' : ''}`}>
      <div className="dec-main">
        <div className="dec-header">
          <div>
            <h2>Decision Registers</h2>
            <p className="dec-subtitle">
              Store approved organizational decisions, rationale, impacts, actions, and supporting evidence.
            </p>
          </div>
          <button className="dec-btn-primary" onClick={openNew}>+ New decision</button>
        </div>

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
            {decisions.map((decision) => (
              <tr
                key={decision.id}
                className={`dec-table-row${selectedDecision?.id === decision.id ? ' dec-table-row--selected' : ''}`}
                onClick={() => openDetail(decision)}
              >
                <td className="dec-col-number">{decision.decisionId}</td>
                <td className="dec-col-title">{decision.title}</td>
                <td className="dec-col-muted">{decision.decisionMaker}</td>
                <td className="dec-col-muted">{decision.relatedRisk || '-'}</td>
                <td className="dec-col-muted">{decision.owner || '-'}</td>
                <td className="dec-col-status">
                  <span className={`dec-badge ${statusClass(decision.status)}`}>{STATUS_LABEL[decision.status]}</span>
                </td>
                <td className="dec-col-updated">{relativeDate(decision.decisionDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerMode && (
        <div className="dec-drawer">
          <div className="dec-drawer-header">
            <h3>{drawerMode === 'new' ? 'New Decision' : (selectedDecision?.title ?? 'Decision')}</h3>
            <button className="dec-drawer-close" onClick={() => setDrawerMode(null)}>X</button>
          </div>

          {drawerMode === 'new' && (
            <div className="dec-drawer-body">
              <div className="dec-form-grid">
                <Field label="Decision ID *">
                  <input value={form.decisionId} onChange={(event) => setField('decisionId', event.target.value)} />
                </Field>
                <Field label="Decision Date *">
                  <input type="date" value={form.decisionDate} onChange={(event) => setField('decisionDate', event.target.value)} />
                </Field>
                <Field label="Title *">
                  <input value={form.title} onChange={(event) => setField('title', event.target.value)} />
                </Field>
                <Field label="Decision Maker *">
                  <input value={form.decisionMaker} onChange={(event) => setField('decisionMaker', event.target.value)} placeholder="Committee, board, executive, or authority" />
                </Field>
                <Field label="Related Risk">
                  <input value={form.relatedRisk} onChange={(event) => setField('relatedRisk', event.target.value)} />
                </Field>
                <Field label="Related Policy/Control">
                  <input value={form.relatedPolicyControl} onChange={(event) => setField('relatedPolicyControl', event.target.value)} />
                </Field>
                <Field label="Owner">
                  <input value={form.owner} onChange={(event) => setField('owner', event.target.value)} />
                </Field>
                <Field label="Due Dates">
                  <input value={form.dueDates} onChange={(event) => setField('dueDates', event.target.value)} placeholder="Implementation timeline" />
                </Field>
                <Field label="Review Date">
                  <input type="date" value={form.reviewDate} onChange={(event) => setField('reviewDate', event.target.value)} />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(event) => setField('status', event.target.value as DecisionStatus)}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUPERSEDED">Superseded</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REVOKED">Revoked</option>
                  </select>
                </Field>
              </div>

              <Field label="Background / Context">
                <textarea rows={4} value={form.backgroundContext} onChange={(event) => setField('backgroundContext', event.target.value)} />
              </Field>
              <Field label="Alternatives Considered">
                <textarea rows={3} value={form.alternativesConsidered} onChange={(event) => setField('alternativesConsidered', event.target.value)} />
              </Field>
              <Field label="Decision Outcome">
                <textarea rows={3} value={form.decisionOutcome} onChange={(event) => setField('decisionOutcome', event.target.value)} />
              </Field>
              <Field label="Justification">
                <textarea rows={3} value={form.justification} onChange={(event) => setField('justification', event.target.value)} />
              </Field>
              <Field label="Impact Assessment">
                <textarea rows={3} value={form.impactAssessment} onChange={(event) => setField('impactAssessment', event.target.value)} />
              </Field>
              <Field label="Actions Required">
                <textarea rows={3} value={form.actionsRequired} onChange={(event) => setField('actionsRequired', event.target.value)} />
              </Field>

              <div className="dec-field">
                <label>Supporting Documents</label>
                <input type="file" multiple onChange={(event) => addFiles(event.target.files)} />
                {form.documents.length > 0 && (
                  <ul className="dec-file-list">
                    {form.documents.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        <span>{file.name}</span>
                        <button onClick={() => removeFile(index)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {formError && <p className="dec-error">{formError}</p>}

              <div className="dec-form-actions">
                <button className="dec-btn-primary" onClick={saveDecision}>Save decision</button>
                <button className="dec-btn-ghost" onClick={() => setDrawerMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {drawerMode === 'detail' && selectedDecision && (
            <div className="dec-drawer-body">
              <section className="dec-detail-section">
                <span className={`dec-badge ${statusClass(selectedDecision.status)}`}>{STATUS_LABEL[selectedDecision.status]}</span>
                <h4>{selectedDecision.decisionId}</h4>
                <p>{selectedDecision.title}</p>
              </section>

              <section className="dec-detail-grid">
                <Detail label="Decision Date" value={selectedDecision.decisionDate} />
                <Detail label="Decision Maker" value={selectedDecision.decisionMaker} />
                <Detail label="Related Risk" value={selectedDecision.relatedRisk || '-'} />
                <Detail label="Policy / Control" value={selectedDecision.relatedPolicyControl || '-'} />
                <Detail label="Owner" value={selectedDecision.owner || '-'} />
                <Detail label="Due Dates" value={selectedDecision.dueDates || '-'} />
                <Detail label="Review Date" value={selectedDecision.reviewDate || '-'} />
              </section>

              <LongDetail label="Background / Context" value={selectedDecision.backgroundContext} />
              <LongDetail label="Alternatives Considered" value={selectedDecision.alternativesConsidered} />
              <LongDetail label="Decision Outcome" value={selectedDecision.decisionOutcome} />
              <LongDetail label="Justification" value={selectedDecision.justification} />
              <LongDetail label="Impact Assessment" value={selectedDecision.impactAssessment} />
              <LongDetail label="Actions Required" value={selectedDecision.actionsRequired} />

              <section className="dec-detail-section">
                <h4>Supporting Documents</h4>
                {selectedDecision.documents.length > 0 ? (
                  <ul className="dec-doc-list">
                    {selectedDecision.documents.map((document) => (
                      <li key={document}>{document}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No supporting documents attached.</p>
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
    <div className="dec-field">
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

function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <section className="dec-detail-section">
      <h4>{label}</h4>
      <p>{value || '-'}</p>
    </section>
  );
}
