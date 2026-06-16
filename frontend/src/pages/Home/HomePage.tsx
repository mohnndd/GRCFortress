import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getDashboard, type DashboardData } from '../../api/homeApi';
import './Home.css';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => {/* non-fatal */})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <p className="home-loading">Loading…</p>;

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

      {/* Stats */}
      <div className="home-stats">
        <div className="home-stat">
          <span className="home-stat-value">{loading ? '—' : (data?.stats.totalPolicies ?? 0)}</span>
          <span className="home-stat-label">Policies & procedures</span>
        </div>
        <div className={`home-stat${(data?.stats.openObservations ?? 0) > 0 ? ' home-stat--alert' : ''}`}>
          <span className="home-stat-value">{loading ? '—' : (data?.stats.openObservations ?? 0)}</span>
          <span className="home-stat-label">Open observations</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{loading ? '—' : (data?.stats.totalRisks ?? 0)}</span>
          <span className="home-stat-label">Registered risks</span>
        </div>
        <div className="home-stat">
          <span className="home-stat-value">{loading ? '—' : (data?.stats.totalCirculars ?? 0)}</span>
          <span className="home-stat-label">Circulars</span>
        </div>
      </div>

      <div className="home-columns">
        {/* Pending approvals */}
        <section className="home-card home-card--actions">
          <div className="home-card-header">
            <h3>Pending Approvals</h3>
            {!loading && (
              <span className={`home-card-badge${(data?.pendingApprovalSteps.length ?? 0) > 0 ? ' home-card-badge--alert' : ''}`}>
                {data?.pendingApprovalSteps.length ?? 0} items
              </span>
            )}
          </div>

          {loading && <p className="home-empty">Loading…</p>}

          {!loading && (data?.pendingApprovalSteps.length ?? 0) === 0 && (
            <p className="home-empty">No pending approvals — you're all caught up.</p>
          )}

          {!loading && (data?.pendingApprovalSteps.length ?? 0) > 0 && (
            <ul className="home-action-list">
              {data!.pendingApprovalSteps.map((step) => (
                <li
                  key={step.stepId}
                  className="home-action-item"
                  onClick={() => navigate(step.documentType === 'POLICY' ? '/policies' : '/procedures')}
                >
                  <div className="home-action-type-row">
                    <span className={`home-action-type home-action-type--${step.documentType.toLowerCase()}`}>
                      {step.documentType === 'POLICY' ? 'Policy' : 'Procedure'}
                    </span>
                    {step.isDelegated && (
                      <span className="home-delegated-badge">On behalf of {step.originalAssignee}</span>
                    )}
                  </div>
                  <span className="home-action-title">{step.documentTitle}</span>
                  <div className="home-action-meta">
                    <span className="home-action-dept">{step.departmentName}</span>
                    <span className="home-action-step">Step {step.stepOrder}/{step.totalSteps}</span>
                    <span className="home-action-since">{relativeDate(step.activatedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent circulars */}
        <section className="home-card home-card--circulars">
          <div className="home-card-header">
            <h3>Recent Circulars</h3>
            <button className="home-card-link" onClick={() => navigate('/circulars')}>View all →</button>
          </div>

          {loading && <p className="home-empty">Loading…</p>}

          {!loading && (data?.recentCirculars.length ?? 0) === 0 && (
            <p className="home-empty">No circulars recorded yet.</p>
          )}

          {!loading && (data?.recentCirculars.length ?? 0) > 0 && (
            <ul className="home-circular-list">
              {data!.recentCirculars.map((c) => (
                <li key={c.id} className="home-circular-item" onClick={() => navigate('/circulars')}>
                  <span className="home-circular-number">{c.circularNumber}</span>
                  <div className="home-circular-body">
                    <span className="home-circular-issuer">{c.issuer}</span>
                    {c.departmentName && (
                      <span className="home-circular-dept">{c.departmentName}</span>
                    )}
                  </div>
                  <span className="home-circular-date">{formatDate(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
