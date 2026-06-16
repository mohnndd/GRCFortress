import { useState } from 'react';
import './RiskRegister.css';

type RiskStatus = 'ACTIVE' | 'MONITORING' | 'ACCEPTED' | 'ACTION_REQUIRED';

interface RiskItem {
  id: string;
  title: string;
  category: string;
  owner: string;
  inherent: number;
  residual: number;
  treatment: string;
  status: RiskStatus;
  controls: number;
  nextReview: string;
  description: string;
}

const RISKS: RiskItem[] = [
  {
    id: 'RISK-001',
    title: 'Customer data exposure through misconfigured access',
    category: 'Information Security',
    owner: 'Technology',
    inherent: 20,
    residual: 9,
    treatment: 'Mitigate',
    status: 'ACTIVE',
    controls: 4,
    nextReview: '2026-06-30',
    description: 'Risk of unauthorized access to customer records through incorrectly assigned privileges.',
  },
  {
    id: 'RISK-002',
    title: 'Delayed policy attestation across critical departments',
    category: 'Compliance',
    owner: 'Compliance Office',
    inherent: 16,
    residual: 8,
    treatment: 'Reduce',
    status: 'MONITORING',
    controls: 3,
    nextReview: '2026-07-05',
    description: 'Risk that employees do not acknowledge new or updated policies within required timelines.',
  },
  {
    id: 'RISK-003',
    title: 'Third-party SMS gateway outage impacts notifications',
    category: 'Operational Resilience',
    owner: 'Operations',
    inherent: 12,
    residual: 6,
    treatment: 'Transfer',
    status: 'ACCEPTED',
    controls: 2,
    nextReview: '2026-08-01',
    description: 'Risk that external notification dependency prevents timely user or stakeholder alerts.',
  },
  {
    id: 'RISK-004',
    title: 'Incident response breach notification exceeds SLA',
    category: 'Incident Management',
    owner: 'Risk Management',
    inherent: 15,
    residual: 10,
    treatment: 'Mitigate',
    status: 'ACTION_REQUIRED',
    controls: 5,
    nextReview: '2026-06-20',
    description: 'Risk that incident escalation and external notification activities miss required deadlines.',
  },
];

const RISK_APPETITE = [
  { level: 'Low', range: '1-5', posture: 'Acceptable' },
  { level: 'Medium', range: '6-10', posture: 'Monitor' },
  { level: 'High', range: '11-15', posture: 'Treatment required' },
  { level: 'Critical', range: '16-25', posture: 'Executive attention' },
];

function scoreLevel(score: number) {
  if (score >= 16) return 'critical';
  if (score >= 11) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

function statusLabel(status: RiskStatus) {
  const map: Record<RiskStatus, string> = {
    ACTIVE: 'Active',
    MONITORING: 'Monitoring',
    ACCEPTED: 'Accepted',
    ACTION_REQUIRED: 'Action Required',
  };
  return map[status];
}

function statusClass(status: RiskStatus) {
  const map: Record<RiskStatus, string> = {
    ACTIVE: 'badge-review',
    MONITORING: 'badge-pre-approval',
    ACCEPTED: 'badge-approved',
    ACTION_REQUIRED: 'badge-rejected',
  };
  return map[status];
}

function relativeDate(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export function RiskRegisterPage() {
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [drawerMode, setDrawerMode] = useState<'new' | 'detail' | null>(null);

  function openNew() {
    setSelectedRisk(null);
    setDrawerMode('new');
  }

  function openDetail(risk: RiskItem) {
    setSelectedRisk(risk);
    setDrawerMode('detail');
  }

  return (
    <div className={`risk-page${drawerMode ? ' risk-page--with-drawer' : ''}`}>
      <div className="risk-main">
        <div className="risk-header">
          <div>
            <h2>Risk Register</h2>
            <p className="risk-subtitle">
              Record enterprise risks, assign ownership, track controls, and monitor residual exposure.
            </p>
          </div>
          <button className="risk-btn-primary" onClick={openNew}>+ New risk</button>
        </div>

        <table className="risk-table">
          <thead>
            <tr>
              <th>Risk #</th>
              <th>Title</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Residual</th>
              <th>Treatment</th>
              <th>Status</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {RISKS.map((risk) => (
              <tr
                key={risk.id}
                className={`risk-table-row${selectedRisk?.id === risk.id ? ' risk-table-row--selected' : ''}`}
                onClick={() => openDetail(risk)}
              >
                <td className="risk-col-number">{risk.id}</td>
                <td className="risk-col-title">{risk.title}</td>
                <td className="risk-col-category">{risk.category}</td>
                <td className="risk-col-owner">{risk.owner}</td>
                <td className="risk-col-score">
                  <span className={`risk-score risk-score--${scoreLevel(risk.residual)}`}>
                    {risk.residual}
                  </span>
                </td>
                <td className="risk-col-treatment">{risk.treatment}</td>
                <td className="risk-col-status">
                  <span className={`risk-badge ${statusClass(risk.status)}`}>{statusLabel(risk.status)}</span>
                </td>
                <td className="risk-col-review">{relativeDate(risk.nextReview)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerMode && (
        <div className="risk-drawer">
          <div className="risk-drawer-header">
            <h3>{drawerMode === 'new' ? 'New Risk' : (selectedRisk?.title ?? 'Risk')}</h3>
            <button className="risk-drawer-close" onClick={() => setDrawerMode(null)}>X</button>
          </div>

          {drawerMode === 'new' && (
            <div className="risk-drawer-body">
              <div className="risk-empty-form">
                <h4>Risk setup</h4>
                <p>This screen is ready for risk capture, scoring, ownership, controls, and treatment workflow.</p>
                <button className="risk-btn-primary">Create draft</button>
              </div>
            </div>
          )}

          {drawerMode === 'detail' && selectedRisk && (
            <div className="risk-drawer-body">
              <section className="risk-detail-section">
                <span className={`risk-badge ${statusClass(selectedRisk.status)}`}>
                  {statusLabel(selectedRisk.status)}
                </span>
                <h4>{selectedRisk.id}</h4>
                <p>{selectedRisk.description}</p>
              </section>

              <section className="risk-detail-grid">
                <div>
                  <span>Category</span>
                  <strong>{selectedRisk.category}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{selectedRisk.owner}</strong>
                </div>
                <div>
                  <span>Inherent score</span>
                  <strong>{selectedRisk.inherent}</strong>
                </div>
                <div>
                  <span>Residual score</span>
                  <strong>{selectedRisk.residual}</strong>
                </div>
                <div>
                  <span>Treatment</span>
                  <strong>{selectedRisk.treatment}</strong>
                </div>
                <div>
                  <span>Linked controls</span>
                  <strong>{selectedRisk.controls}</strong>
                </div>
              </section>

              <section className="risk-detail-section">
                <h4>Risk appetite</h4>
                <ul className="risk-appetite-list">
                  {RISK_APPETITE.map((item) => (
                    <li key={item.level}>
                      <span>
                        <strong>{item.level}</strong>
                        <em>{item.range}</em>
                      </span>
                      <small>{item.posture}</small>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
