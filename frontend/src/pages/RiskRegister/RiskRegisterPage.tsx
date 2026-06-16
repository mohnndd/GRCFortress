import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  createRisk,
  deleteRisk,
  listRiskDomains,
  listRisks,
  updateRisk,
  type RiskCreateRequest,
  type RiskDomain,
  type RiskSummary,
} from '../../api/riskApi';
import './RiskRegister.css';

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['OPEN', 'UNDER_REVIEW', 'ACCEPTED', 'MITIGATED', 'CLOSED', 'TRANSFERRED'];
const TREATMENT_OPTIONS = ['ACCEPT', 'MITIGATE', 'TRANSFER', 'AVOID'];
const VELOCITY_OPTIONS = ['IMMEDIATE', 'DAYS', 'WEEKS', 'MONTHS'];
const FREQUENCY_OPTIONS = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'EVENT_DRIVEN'];

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open', UNDER_REVIEW: 'Under Review', ACCEPTED: 'Accepted',
  MITIGATED: 'Mitigated', CLOSED: 'Closed', TRANSFERRED: 'Transferred',
};
const FREQ_LABEL: Record<string, string> = {
  MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', SEMI_ANNUAL: 'Semi-annual',
  ANNUAL: 'Annual', EVENT_DRIVEN: 'Event-driven',
};

function scoreLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 5) return 'low';
  if (score <= 10) return 'medium';
  if (score <= 15) return 'high';
  return 'critical';
}

function scoreLevelLabel(score: number) {
  return { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }[scoreLevel(score)];
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`rr-score rr-score--${scoreLevel(score)}`}>
      {score} <span className="rr-score-label">{scoreLevelLabel(score)}</span>
    </span>
  );
}

function ScaleInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="rr-scale-field">
      <label>{label}</label>
      <div className="rr-scale-buttons">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rr-scale-btn${value === n ? ' rr-scale-btn--active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

const EMPTY_FORM: RiskCreateRequest = {
  title: '', description: '', status: 'OPEN',
  domainId: null, categoryId: null, riskOwnerUsername: '',
  inherentLikelihood: 3,
  inherentImpactFinancial: 3, inherentImpactOperational: 3,
  inherentImpactRegulatory: 3, inherentImpactReputational: 3,
  residualLikelihood: 1,
  residualImpactFinancial: 1, residualImpactOperational: 1,
  residualImpactRegulatory: 1, residualImpactReputational: 1,
  targetRiskScore: null, treatmentOption: '', treatmentPlan: '',
  riskVelocity: '', relatedRegulations: '',
  reviewFrequency: 'QUARTERLY', nextReviewDate: null, lastReviewDate: null,
};

function calcScore(likelihood: number, fi: number, op: number, re: number, rp: number): number {
  return likelihood * Math.max(fi, op, re, rp);
}

// ── Main component ─────────────────────────────────────────────────────────

export function RiskRegisterPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [risks, setRisks] = useState<RiskSummary[]>([]);
  const [domains, setDomains] = useState<RiskDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RiskSummary | null>(null);
  const [drawerMode, setDrawerMode] = useState<'detail' | 'form' | null>(null);
  const [form, setForm] = useState<RiskCreateRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDomain, setFilterDomain] = useState('');

  useEffect(() => {
    Promise.all([listRisks(), listRiskDomains()])
      .then(([r, d]) => { setRisks(r); setDomains(d); })
      .catch(() => setError('Failed to load risk register.'))
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof RiskCreateRequest>(k: K, v: RiskCreateRequest[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const categoriesForDomain = domains.find((d) => d.id === form.domainId)?.categories ?? [];

  function openNew() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setFormError(null);
    setDrawerMode('form');
  }

  function openEdit(r: RiskSummary) {
    setForm({
      title: r.title, description: r.description ?? '', status: r.status,
      domainId: r.domainId, categoryId: r.categoryId,
      riskOwnerUsername: r.riskOwnerUsername ?? '',
      inherentLikelihood: r.inherentLikelihood,
      inherentImpactFinancial: r.inherentImpactFinancial,
      inherentImpactOperational: r.inherentImpactOperational,
      inherentImpactRegulatory: r.inherentImpactRegulatory,
      inherentImpactReputational: r.inherentImpactReputational,
      residualLikelihood: r.residualLikelihood,
      residualImpactFinancial: r.residualImpactFinancial,
      residualImpactOperational: r.residualImpactOperational,
      residualImpactRegulatory: r.residualImpactRegulatory,
      residualImpactReputational: r.residualImpactReputational,
      targetRiskScore: r.targetRiskScore,
      treatmentOption: r.treatmentOption ?? '',
      treatmentPlan: r.treatmentPlan ?? '',
      riskVelocity: r.riskVelocity ?? '',
      relatedRegulations: r.relatedRegulations ?? '',
      reviewFrequency: r.reviewFrequency,
      nextReviewDate: r.nextReviewDate,
      lastReviewDate: r.lastReviewDate,
    });
    setSelected(r);
    setFormError(null);
    setDrawerMode('form');
  }

  function openDetail(r: RiskSummary) {
    setSelected(r);
    setDrawerMode('detail');
  }

  function closeDrawer() {
    setDrawerMode(null);
    setSelected(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (selected && drawerMode === 'form') {
        const updated = await updateRisk(selected.id, form);
        setRisks((p) => p.map((r) => r.id === updated.id ? updated : r));
        setSelected(updated);
        setDrawerMode('detail');
      } else {
        const created = await createRisk(form);
        setRisks((p) => [created, ...p]);
        setSelected(created);
        setDrawerMode('detail');
      }
    } catch {
      setFormError('Failed to save risk record.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected || !window.confirm(`Delete ${selected.riskNumber}?`)) return;
    setDeleting(true);
    try {
      await deleteRisk(selected.id);
      setRisks((p) => p.filter((r) => r.id !== selected.id));
      closeDrawer();
    } catch {
      setError('Failed to delete risk.');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = risks.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterDomain && String(r.domainId) !== filterDomain) return false;
    return true;
  });

  const previewInherent = calcScore(
    form.inherentLikelihood,
    form.inherentImpactFinancial, form.inherentImpactOperational,
    form.inherentImpactRegulatory, form.inherentImpactReputational
  );
  const previewResidual = calcScore(
    form.residualLikelihood,
    form.residualImpactFinancial, form.residualImpactOperational,
    form.residualImpactRegulatory, form.residualImpactReputational
  );

  return (
    <div className={`rr-page${drawerMode ? ' rr-page--with-drawer' : ''}`}>
      <div className="rr-main">
        <div className="rr-header">
          <div>
            <h2>Risk Register</h2>
            <p className="rr-subtitle">
              ISO 31000 / COSO ERM aligned register with 5×5 scoring, multi-dimensional impact, and treatment tracking.
            </p>
          </div>
          <div className="rr-header-actions">
            <select className="rr-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select className="rr-filter-select" value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}>
              <option value="">All domains</option>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {isAdmin && <button className="rr-btn-primary" onClick={openNew}>+ New risk</button>}
          </div>
        </div>

        {error && <p className="rr-error">{error}</p>}
        {loading && <p className="rr-state">Loading risk register…</p>}

        {!loading && filtered.length === 0 && (
          <p className="rr-state">{risks.length === 0 ? 'No risks recorded yet.' : 'No risks match the current filters.'}</p>
        )}

        {!loading && filtered.length > 0 && (
          <table className="rr-table">
            <thead>
              <tr>
                <th>Risk #</th>
                <th>Title</th>
                <th>Domain / Category</th>
                <th>Owner</th>
                <th>Inherent</th>
                <th>Residual</th>
                <th>Treatment</th>
                <th>Status</th>
                <th>Next review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`rr-table-row${selected?.id === r.id ? ' rr-table-row--selected' : ''}`}
                  onClick={() => openDetail(r)}
                >
                  <td className="rr-col-number">{r.riskNumber}</td>
                  <td className="rr-col-title">{r.title}</td>
                  <td className="rr-col-domain">
                    {r.domainName && <span className="rr-domain-tag">{r.domainName}</span>}
                    {r.categoryName && <span className="rr-category-text">{r.categoryName}</span>}
                  </td>
                  <td className="rr-col-owner">{r.riskOwnerUsername ?? '—'}</td>
                  <td><ScoreBadge score={r.inherentScore} /></td>
                  <td><ScoreBadge score={r.residualScore} /></td>
                  <td className="rr-col-treatment">{r.treatmentOption ?? '—'}</td>
                  <td>
                    <span className={`rr-status rr-status--${r.status.toLowerCase().replace('_', '-')}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="rr-col-date">{r.nextReviewDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerMode && (
        <aside className="rr-drawer">
          <div className="rr-drawer-header">
            <h3>
              {drawerMode === 'form' && !selected ? 'New Risk'
                : drawerMode === 'form' ? `Edit ${selected?.riskNumber}`
                : selected?.riskNumber ?? 'Risk'}
            </h3>
            <button className="rr-drawer-close" onClick={closeDrawer}>✕</button>
          </div>

          {drawerMode === 'form' && (
            <form className="rr-drawer-body rr-form" onSubmit={handleSubmit}>
              <div className="rr-form-section">
                <p className="rr-form-section-label">Basic information</p>
                <label>Title *
                  <input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={150} required />
                </label>
                <label>Description (Cause → Event → Consequence)
                  <textarea value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} rows={3} />
                </label>
                <label>Status
                  <select value={form.status ?? 'OPEN'} onChange={(e) => setField('status', e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </label>
                <div className="rr-form-row">
                  <label>Risk domain
                    <select value={form.domainId ?? ''} onChange={(e) => {
                      setField('domainId', e.target.value ? Number(e.target.value) : null);
                      setField('categoryId', null);
                    }}>
                      <option value="">— Select —</option>
                      {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  <label>Category
                    <select value={form.categoryId ?? ''} onChange={(e) => setField('categoryId', e.target.value ? Number(e.target.value) : null)} disabled={!form.domainId}>
                      <option value="">— Select —</option>
                      {categoriesForDomain.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                </div>
                <label>Risk owner (username)
                  <input value={form.riskOwnerUsername ?? ''} onChange={(e) => setField('riskOwnerUsername', e.target.value)} />
                </label>
              </div>

              <div className="rr-form-section">
                <p className="rr-form-section-label">Inherent risk scoring (before controls)</p>
                <ScaleInput label="Likelihood" value={form.inherentLikelihood} onChange={(v) => setField('inherentLikelihood', v)} />
                <ScaleInput label="Impact — Financial" value={form.inherentImpactFinancial} onChange={(v) => setField('inherentImpactFinancial', v)} />
                <ScaleInput label="Impact — Operational" value={form.inherentImpactOperational} onChange={(v) => setField('inherentImpactOperational', v)} />
                <ScaleInput label="Impact — Regulatory" value={form.inherentImpactRegulatory} onChange={(v) => setField('inherentImpactRegulatory', v)} />
                <ScaleInput label="Impact — Reputational" value={form.inherentImpactReputational} onChange={(v) => setField('inherentImpactReputational', v)} />
                <div className="rr-score-preview">
                  Inherent score: <ScoreBadge score={previewInherent} />
                </div>
              </div>

              <div className="rr-form-section">
                <p className="rr-form-section-label">Residual risk scoring (after controls)</p>
                <ScaleInput label="Likelihood" value={form.residualLikelihood} onChange={(v) => setField('residualLikelihood', v)} />
                <ScaleInput label="Impact — Financial" value={form.residualImpactFinancial} onChange={(v) => setField('residualImpactFinancial', v)} />
                <ScaleInput label="Impact — Operational" value={form.residualImpactOperational} onChange={(v) => setField('residualImpactOperational', v)} />
                <ScaleInput label="Impact — Regulatory" value={form.residualImpactRegulatory} onChange={(v) => setField('residualImpactRegulatory', v)} />
                <ScaleInput label="Impact — Reputational" value={form.residualImpactReputational} onChange={(v) => setField('residualImpactReputational', v)} />
                <div className="rr-score-preview">
                  Residual score: <ScoreBadge score={previewResidual} />
                </div>
              </div>

              <div className="rr-form-section">
                <p className="rr-form-section-label">Treatment</p>
                <label>Treatment option
                  <select value={form.treatmentOption ?? ''} onChange={(e) => setField('treatmentOption', e.target.value)}>
                    <option value="">— Select —</option>
                    {TREATMENT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                {form.treatmentOption === 'MITIGATE' && (
                  <label>Treatment plan *
                    <textarea value={form.treatmentPlan ?? ''} onChange={(e) => setField('treatmentPlan', e.target.value)} rows={3} required />
                  </label>
                )}
                <label>Target risk score (1–25)
                  <input type="number" min={1} max={25} value={form.targetRiskScore ?? ''} onChange={(e) => setField('targetRiskScore', e.target.value ? Number(e.target.value) : null)} />
                </label>
                <label>Risk velocity
                  <select value={form.riskVelocity ?? ''} onChange={(e) => setField('riskVelocity', e.target.value)}>
                    <option value="">— Select —</option>
                    {VELOCITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
              </div>

              <div className="rr-form-section">
                <p className="rr-form-section-label">Review</p>
                <label>Review frequency
                  <select value={form.reviewFrequency} onChange={(e) => setField('reviewFrequency', e.target.value)}>
                    {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
                  </select>
                </label>
                <div className="rr-form-row">
                  <label>Next review date
                    <input type="date" value={form.nextReviewDate ?? ''} onChange={(e) => setField('nextReviewDate', e.target.value || null)} />
                  </label>
                  <label>Last review date
                    <input type="date" value={form.lastReviewDate ?? ''} onChange={(e) => setField('lastReviewDate', e.target.value || null)} />
                  </label>
                </div>
                <label>Related regulations / frameworks
                  <textarea value={form.relatedRegulations ?? ''} onChange={(e) => setField('relatedRegulations', e.target.value)} rows={2} placeholder="e.g. SAMA CSF 3.3.6, ISO 27001 A.12" />
                </label>
              </div>

              {formError && <p className="rr-error">{formError}</p>}

              <div className="rr-form-actions">
                <button className="rr-btn-secondary" type="button" onClick={closeDrawer}>Cancel</button>
                <button className="rr-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : selected ? 'Save changes' : 'Create risk'}
                </button>
              </div>
            </form>
          )}

          {drawerMode === 'detail' && selected && (
            <div className="rr-drawer-body">
              <div className="rr-detail-header">
                <span className={`rr-status rr-status--${selected.status.toLowerCase().replace('_', '-')}`}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </span>
                <h4>{selected.title}</h4>
                {selected.description && <p className="rr-detail-description">{selected.description}</p>}
              </div>

              <div className="rr-detail-grid">
                <div>
                  <span>Domain</span>
                  <strong>{selected.domainName ?? '—'}</strong>
                </div>
                <div>
                  <span>Category</span>
                  <strong>{selected.categoryName ?? '—'}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{selected.riskOwnerUsername ?? '—'}</strong>
                </div>
                <div>
                  <span>Velocity</span>
                  <strong>{selected.riskVelocity ?? '—'}</strong>
                </div>
              </div>

              <div className="rr-scores-panel">
                <div className="rr-score-col">
                  <p className="rr-score-col-label">Inherent Risk</p>
                  <ScoreBadge score={selected.inherentScore} />
                  <p className="rr-score-breakdown">
                    L:{selected.inherentLikelihood} × I:{selected.inherentCompositeImpact}
                    <br/>
                    Fin:{selected.inherentImpactFinancial} Op:{selected.inherentImpactOperational} Reg:{selected.inherentImpactRegulatory} Rep:{selected.inherentImpactReputational}
                  </p>
                </div>
                <div className="rr-score-arrow">→</div>
                <div className="rr-score-col">
                  <p className="rr-score-col-label">Residual Risk</p>
                  <ScoreBadge score={selected.residualScore} />
                  <p className="rr-score-breakdown">
                    L:{selected.residualLikelihood} × I:{selected.residualCompositeImpact}
                    <br/>
                    Fin:{selected.residualImpactFinancial} Op:{selected.residualImpactOperational} Reg:{selected.residualImpactRegulatory} Rep:{selected.residualImpactReputational}
                  </p>
                </div>
                <div className="rr-score-arrow">→</div>
                <div className="rr-score-col">
                  <p className="rr-score-col-label">Target</p>
                  <span className="rr-target-score">{selected.targetRiskScore ?? '—'}</span>
                </div>
              </div>

              {selected.treatmentOption && (
                <div className="rr-detail-section">
                  <p className="rr-detail-section-title">Treatment</p>
                  <p className="rr-detail-treatment-option">{selected.treatmentOption}</p>
                  {selected.treatmentPlan && <p className="rr-detail-treatment-plan">{selected.treatmentPlan}</p>}
                </div>
              )}

              <div className="rr-detail-grid">
                <div>
                  <span>Review frequency</span>
                  <strong>{FREQ_LABEL[selected.reviewFrequency] ?? selected.reviewFrequency}</strong>
                </div>
                <div>
                  <span>Next review</span>
                  <strong>{selected.nextReviewDate ?? '—'}</strong>
                </div>
                <div>
                  <span>Last review</span>
                  <strong>{selected.lastReviewDate ?? '—'}</strong>
                </div>
                <div>
                  <span>Recorded by</span>
                  <strong>{selected.createdBy ?? '—'}</strong>
                </div>
              </div>

              {selected.relatedRegulations && (
                <div className="rr-detail-section">
                  <p className="rr-detail-section-title">Related regulations</p>
                  <p className="rr-detail-regs">{selected.relatedRegulations}</p>
                </div>
              )}

              {isAdmin && (
                <div className="rr-detail-actions">
                  <button className="rr-btn-secondary" onClick={() => openEdit(selected)}>Edit</button>
                  <button className="rr-btn-danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
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
