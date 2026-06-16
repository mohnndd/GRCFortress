import { useAuth } from '../../auth/AuthContext';
import './Home.css';

const PENDING_ACTIONS = [
  { id: 1, type: 'Policy Review', title: 'Information Security Policy — Annual Review', due: '2026-06-30', priority: 'high' },
  { id: 2, type: 'Approval', title: 'Risk Assessment Report Q2 2026', due: '2026-06-20', priority: 'high' },
  { id: 3, type: 'Observation', title: '3 open observations pending closure sign-off', due: '2026-06-25', priority: 'medium' },
  { id: 4, type: 'Attestation', title: 'Code of Conduct acknowledgement — 12 employees pending', due: '2026-07-01', priority: 'medium' },
  { id: 5, type: 'Audit', title: 'Internal audit fieldwork — IT Controls', due: '2026-07-10', priority: 'low' },
];

const RECENT_ACTIVITY = [
  { id: 1, user: 'System Administrator', action: 'Created department', subject: 'Technology', time: 'Just now', icon: '🏛' },
  { id: 2, user: 'System Administrator', action: 'Configured stakeholder', subject: 'Mohammed Al-Ghamdi (CTO)', time: '5 min ago', icon: '👤' },
  { id: 3, user: 'System Administrator', action: 'Updated integration settings', subject: 'Email gateway (SMTP)', time: '1 hr ago', icon: '⚙️' },
  { id: 4, user: 'System Administrator', action: 'Signed in', subject: '', time: '1 hr ago', icon: '🔐' },
];

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function HomePage() {
  const { user } = useAuth();

  if (!user) return <p className="home-loading">Loading…</p>;

  const highCount = PENDING_ACTIONS.filter((a) => a.priority === 'high').length;

  return (
    <div className="home-page">
      {/* Greeting */}
      <div className="home-greeting">
        <div>
          <h2 className="home-greeting-text">
            {greeting()}, {user.fullName.split(' ')[0]}
          </h2>
          <p className="home-greeting-date">{formatToday()}</p>
        </div>
        <div className="home-role-badge">{user.roles[0]?.replace('_', ' ')}</div>
      </div>

      {/* Stats row */}
      <div className="home-stats">
        <div className="home-stat">
          <span className="home-stat-value">{PENDING_ACTIONS.length}</span>
          <span className="home-stat-label">Pending actions</span>
        </div>
        <div className="home-stat home-stat--alert">
          <span className="home-stat-value">{highCount}</span>
          <span className="home-stat-label">High priority</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">1</span>
          <span className="home-stat-label">Departments configured</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">0</span>
          <span className="home-stat-label">Open incidents</span>
        </div>
      </div>

      <div className="home-columns">
        {/* Pending actions */}
        <section className="home-card home-card--actions">
          <div className="home-card-header">
            <h3>Pending Actions</h3>
            <span className="home-card-badge home-card-badge--alert">{PENDING_ACTIONS.length} items</span>
          </div>
          <p className="home-card-note">Placeholder data — will be driven by live module data once modules are built.</p>
          <ul className="action-list">
            {PENDING_ACTIONS.map((action) => (
              <li key={action.id} className={`action-item action-item--${action.priority}`}>
                <div className="action-priority-bar" />
                <div className="action-body">
                  <span className="action-type">{action.type}</span>
                  <span className="action-title">{action.title}</span>
                </div>
                <div className="action-meta">
                  <span className={`action-priority-badge priority--${action.priority}`}>
                    {PRIORITY_LABEL[action.priority]}
                  </span>
                  <span className="action-due">Due {action.due}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent activity */}
        <section className="home-card home-card--activity">
          <div className="home-card-header">
            <h3>Recent Activity</h3>
            <span className="home-card-badge">{RECENT_ACTIVITY.length} events</span>
          </div>
          <ul className="activity-list">
            {RECENT_ACTIVITY.map((event) => (
              <li key={event.id} className="activity-item">
                <div className="activity-icon">{event.icon}</div>
                <div className="activity-body">
                  <span className="activity-action">
                    <strong>{event.user}</strong> {event.action}
                    {event.subject ? <em> {event.subject}</em> : null}
                  </span>
                  <span className="activity-time">{event.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
