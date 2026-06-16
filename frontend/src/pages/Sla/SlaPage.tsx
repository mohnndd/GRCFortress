import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getActiveSteps,
  getSlaRules,
  updateSlaRule,
  type ActiveStepStatus,
  type SlaRule,
} from '../../api/slaApi';
import './Sla.css';

// ── Process metadata ───────────────────────────────────────────────────────

interface ProcessMeta {
  processType: SlaRule['processType'];
  label: string;
  description: string;
  isLive: boolean;
}

const PROCESSES: ProcessMeta[] = [
  {
    processType: 'POLICY_APPROVAL',
    label: 'Policy Approval',
    description: 'Multi-department sign-off chain for new or revised policies.',
    isLive: true,
  },
  {
    processType: 'PROCEDURE_APPROVAL',
    label: 'Procedure Approval',
    description: 'Multi-department sign-off chain for new or revised procedures.',
    isLive: true,
  },
  {
    processType: 'TERMS_APPROVAL',
    label: 'Terms & Conditions Approval',
    description: 'Review and approval chain for Terms & Conditions documents.',
    isLive: false,
  },
];

function processLabel(processType: string) {
  return PROCESSES.find((p) => p.processType === processType)?.label ?? processType;
}

function statusClass(s: ActiveStepStatus['slaStatus']) {
  if (s === 'BREACHED') return 'sla-status--breached';
  if (s === 'AT_RISK') return 'sla-status--at-risk';
  return 'sla-status--on-track';
}

function statusLabel(s: ActiveStepStatus['slaStatus']) {
  if (s === 'BREACHED') return 'Breached';
  if (s === 'AT_RISK') return 'At Risk';
  return 'On Track';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main component ─────────────────────────────────────────────────────────

export function SlaPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [rules, setRules] = useState<SlaRule[]>([]);
  const [activeSteps, setActiveSteps] = useState<ActiveStepStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getSlaRules(), getActiveSteps()])
      .then(([r, s]) => { setRules(r); setActiveSteps(s); })
      .catch(() => setError('Failed to load SLA data.'))
      .finally(() => setLoading(false));
  }, []);

  function handleRuleUpdate(updated: SlaRule) {
    setRules((prev) => prev.map((r) => r.processType === updated.processType ? updated : r));
  }

  const breachedCount = activeSteps.filter((s) => s.slaStatus === 'BREACHED').length;
  const atRiskCount = activeSteps.filter((s) => s.slaStatus === 'AT_RISK').length;

  if (loading) return <p className="sla-loading">Loading SLA configuration…</p>;

  return (
    <div className="sla-page">
      <div className="sla-page-header">
        <div>
          <h2>SLA Configuration</h2>
          <p className="sla-page-intro">
            Define how many business days each department has to complete their approval step.
            Use the bottleneck tracker below to spot delays across active approval cycles.
          </p>
        </div>
      </div>

      {error && <p className="sla-error">{error}</p>}

      {/* Summary strip */}
      <div className="sla-summary">
        <div className="sla-stat">
          <span className="sla-stat-value">{PROCESSES.filter((p) => p.isLive).length}</span>
          <span className="sla-stat-label">Live processes</span>
        </div>
        <div className="sla-stat">
          <span className="sla-stat-value">{activeSteps.length}</span>
          <span className="sla-stat-label">Active approval steps</span>
        </div>
        <div className={`sla-stat${atRiskCount > 0 ? ' sla-stat--warning' : ''}`}>
          <span className="sla-stat-value">{atRiskCount}</span>
          <span className="sla-stat-label">At risk</span>
        </div>
        <div className={`sla-stat${breachedCount > 0 ? ' sla-stat--danger' : ''}`}>
          <span className="sla-stat-value">{breachedCount}</span>
          <span className="sla-stat-label">SLA breached</span>
        </div>
      </div>

      {/* SLA rule cards */}
      <div className="sla-rules-grid">
        {PROCESSES.map((meta) => {
          const rule = rules.find((r) => r.processType === meta.processType);
          return (
            <SlaRuleCard
              key={meta.processType}
              meta={meta}
              rule={rule ?? null}
              isAdmin={isAdmin}
              onUpdate={handleRuleUpdate}
            />
          );
        })}
      </div>

      {/* Bottleneck tracker */}
      <section className="sla-panel sla-panel--tracker">
        <div className="sla-panel-header">
          <div>
            <h3>Active Approval Bottleneck Tracker</h3>
            <p>All approval steps currently waiting on a department, ordered by oldest first.</p>
          </div>
        </div>

        {activeSteps.length === 0 ? (
          <p className="sla-empty">No active approval steps at the moment.</p>
        ) : (
          <div className="sla-tracker-table">
            <div className="sla-tracker-row sla-tracker-head">
              <span>Document</span>
              <span>Process</span>
              <span>Waiting on</span>
              <span>Step</span>
              <span>Since</span>
              <span>Days elapsed</span>
              <span>SLA limit</span>
              <span>Status</span>
            </div>
            {activeSteps.map((step) => (
              <div key={step.stepId} className={`sla-tracker-row sla-tracker-row--${step.slaStatus.toLowerCase().replace('_', '-')}`}>
                <span>
                  <span className="sla-doc-number">{step.documentNumber}</span>
                  <span className="sla-doc-title">{step.documentTitle}</span>
                </span>
                <span className="sla-process-tag">{processLabel(step.processType)}</span>
                <span className="sla-dept-name">{step.departmentName}</span>
                <span className="sla-step-order">{step.stepOrder} / {step.totalSteps}</span>
                <span className="sla-since">{formatDate(step.activatedAt)}</span>
                <span className="sla-days-elapsed">{step.businessDaysElapsed} bd</span>
                <span className="sla-days-limit">{step.slaBusinessDays} bd</span>
                <span>
                  <span className={`sla-status-badge ${statusClass(step.slaStatus)}`}>
                    {statusLabel(step.slaStatus)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── SLA Rule Card ──────────────────────────────────────────────────────────

function SlaRuleCard({
  meta,
  rule,
  isAdmin,
  onUpdate,
}: {
  meta: ProcessMeta;
  rule: SlaRule | null;
  isAdmin: boolean;
  onUpdate: (r: SlaRule) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(rule?.businessDaysPerStep ?? 5));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const days = parseInt(value, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      setError('Enter a number between 1 and 365.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSlaRule(meta.processType, days);
      onUpdate(updated);
      setEditing(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setValue(String(rule?.businessDaysPerStep ?? 5));
    setError(null);
    setEditing(false);
  }

  return (
    <div className={`sla-rule-card${!meta.isLive ? ' sla-rule-card--planned' : ''}`}>
      <div className="sla-rule-card-header">
        <div>
          <p className="sla-rule-process-label">{meta.label}</p>
          <p className="sla-rule-description">{meta.description}</p>
        </div>
        {!meta.isLive && <span className="sla-planned-badge">Planned</span>}
      </div>

      <div className="sla-rule-body">
        <p className="sla-rule-field-label">Business days per approval step</p>

        {editing ? (
          <div className="sla-rule-edit-row">
            <input
              type="number"
              min={1}
              max={365}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="sla-rule-input"
              autoFocus
            />
            <span className="sla-rule-unit">business days</span>
            <div className="sla-rule-edit-actions">
              <button className="sla-btn-primary sla-btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="sla-btn-ghost sla-btn-sm" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="sla-rule-display-row">
            <span className="sla-rule-value">{rule?.businessDaysPerStep ?? '—'}</span>
            <span className="sla-rule-unit">business days</span>
            {isAdmin && meta.isLive && (
              <button
                className="sla-btn-ghost sla-btn-sm"
                onClick={() => { setValue(String(rule?.businessDaysPerStep ?? 5)); setEditing(true); }}
              >
                Edit
              </button>
            )}
          </div>
        )}

        {error && <p className="sla-rule-error">{error}</p>}
      </div>
    </div>
  );
}
