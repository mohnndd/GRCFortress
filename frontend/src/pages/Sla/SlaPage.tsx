import './Sla.css';

const POLICY_SLA = [
  {
    role: 'Policy owner',
    process: 'Initial draft submission',
    standardTime: '3 business days',
    escalation: 'Compliance officer',
  },
  {
    role: 'Department stakeholder',
    process: 'Stakeholder review',
    standardTime: '5 business days',
    escalation: 'Department head',
  },
  {
    role: 'Compliance officer',
    process: 'Compliance assessment',
    standardTime: '4 business days',
    escalation: 'Head of compliance',
  },
  {
    role: 'Approver',
    process: 'Final approval',
    standardTime: '2 business days',
    escalation: 'Executive owner',
  },
  {
    role: 'Publisher',
    process: 'Publish approved policy',
    standardTime: '1 business day',
    escalation: 'Policy owner',
  },
];

const INCIDENT_SLA = [
  {
    priority: 'High',
    response: '1 hour',
    containment: '4 hours',
    resolution: '1 business day',
    review: '2 business days',
  },
  {
    priority: 'Medium',
    response: '4 hours',
    containment: '1 business day',
    resolution: '3 business days',
    review: '5 business days',
  },
  {
    priority: 'Low',
    response: '1 business day',
    containment: '2 business days',
    resolution: '7 business days',
    review: '10 business days',
  },
];

const PROCESS_TYPES = [
  'Policy Management',
  'Incident Management',
  'Terms and Conditions',
  'Observations',
];

export function SlaPage() {
  return (
    <div className="sla-page">
      <div className="sla-page-header">
        <div>
          <h2>SLA Configuration</h2>
          <p className="sla-page-intro">
            Define standard timing, escalation paths, and review expectations for GRC processes.
          </p>
        </div>
        <button className="sla-btn-primary">+ New SLA rule</button>
      </div>

      <div className="sla-summary">
        <div className="sla-stat">
          <span className="sla-stat-value">2</span>
          <span className="sla-stat-label">Configured modules</span>
        </div>
        <div className="sla-stat">
          <span className="sla-stat-value">5</span>
          <span className="sla-stat-label">Policy stakeholders</span>
        </div>
        <div className="sla-stat sla-stat--attention">
          <span className="sla-stat-value">3</span>
          <span className="sla-stat-label">Incident priorities</span>
        </div>
        <div className="sla-stat">
          <span className="sla-stat-value">12</span>
          <span className="sla-stat-label">Timing checkpoints</span>
        </div>
      </div>

      <div className="sla-layout">
        <section className="sla-panel">
          <div className="sla-panel-header">
            <div>
              <h3>Policy Management SLA</h3>
              <p>Standard timing for each stakeholder in the policy lifecycle.</p>
            </div>
            <button className="sla-btn-ghost">Edit policy SLA</button>
          </div>

          <div className="sla-table sla-table--policy">
            <div className="sla-table-row sla-table-head">
              <span>Stakeholder</span>
              <span>Process step</span>
              <span>Standard timing</span>
              <span>Escalation owner</span>
            </div>
            {POLICY_SLA.map((item) => (
              <div className="sla-table-row" key={`${item.role}-${item.process}`}>
                <span className="sla-strong">{item.role}</span>
                <span>{item.process}</span>
                <span>
                  <span className="sla-time-pill">{item.standardTime}</span>
                </span>
                <span>{item.escalation}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="sla-panel">
          <div className="sla-panel-header">
            <div>
              <h3>Incident Management SLA</h3>
              <p>Response, containment, resolution, and post-incident review by priority.</p>
            </div>
            <button className="sla-btn-ghost">Edit incident SLA</button>
          </div>

          <div className="sla-table sla-table--incident">
            <div className="sla-table-row sla-table-head">
              <span>Priority</span>
              <span>Response</span>
              <span>Containment</span>
              <span>Resolution</span>
              <span>Review</span>
            </div>
            {INCIDENT_SLA.map((item) => (
              <div className="sla-table-row" key={item.priority}>
                <span>
                  <span className={`sla-priority sla-priority--${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                </span>
                <span>{item.response}</span>
                <span>{item.containment}</span>
                <span>{item.resolution}</span>
                <span>{item.review}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="sla-panel sla-panel--side">
          <div className="sla-panel-header">
            <div>
              <h3>Process Coverage</h3>
              <p>Modules that can receive SLA rules.</p>
            </div>
          </div>
          <ul className="sla-process-list">
            {PROCESS_TYPES.map((process) => (
              <li key={process}>
                <span>{process}</span>
                <em>{process === 'Policy Management' || process === 'Incident Management' ? 'Configured' : 'Planned'}</em>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
