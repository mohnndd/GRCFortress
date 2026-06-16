import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listAuditTrail, type AuditLogEntry } from '../../api/auditApi';
import './AuditTrail.css';

const EVENT_OPTIONS = [
  'LOGIN_ATTEMPT',
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'MFA_CHALLENGE_ISSUED',
  'MFA_VERIFICATION_SUCCESS',
  'MFA_VERIFICATION_FAILURE',
  'TOKEN_REFRESH',
  'LOGOUT',
];

function formatEventType(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<10 | 50 | 100>(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actorInput, setActorInput] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listAuditTrail({
      page,
      size,
      actor: actorFilter || undefined,
      event: eventFilter || undefined,
    })
      .then((result) => {
        setEntries(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load audit trail from the server.');
      })
      .finally(() => setLoading(false));
  }, [page, size, actorFilter, eventFilter]);

  const summary = useMemo(() => {
    const failures = entries.filter((entry) => entry.outcome === 'FAILURE').length;
    const success = entries.filter((entry) => entry.outcome === 'SUCCESS').length;
    const actors = new Set(entries.map((entry) => entry.username).filter(Boolean)).size;
    return { failures, success, actors };
  }, [entries]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setActorFilter(actorInput.trim());
  }

  function clearFilters() {
    setActorInput('');
    setActorFilter('');
    setEventFilter('');
    setPage(0);
  }

  function changeSize(nextSize: 10 | 50 | 100) {
    setSize(nextSize);
    setPage(0);
  }

  const firstRow = totalElements === 0 ? 0 : page * size + 1;
  const lastRow = Math.min(totalElements, page * size + entries.length);

  return (
    <div className="audit-page">
      <div className="audit-page-header">
        <div>
          <h2>Audit Trail</h2>
          <p className="audit-page-intro">
            Review security and compliance events recorded by the backend audit log.
          </p>
        </div>
        <button className="audit-btn-ghost" onClick={() => setPage(0)}>
          Refresh
        </button>
      </div>

      <div className="audit-stats">
        <div className="audit-stat">
          <span className="audit-stat-value">{totalElements}</span>
          <span className="audit-stat-label">Matching events</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value">{summary.success}</span>
          <span className="audit-stat-label">Successful events</span>
        </div>
        <div className="audit-stat audit-stat--attention">
          <span className="audit-stat-value">{summary.failures}</span>
          <span className="audit-stat-label">Failed events</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value">{summary.actors}</span>
          <span className="audit-stat-label">Actors</span>
        </div>
      </div>

      <section className="audit-panel">
        <div className="audit-panel-header">
          <div>
            <h3>Latest Audit Events</h3>
            <p>Showing records from the audit_log table.</p>
          </div>
        </div>

        <form className="audit-filters" onSubmit={applyFilters}>
          <label>
            Actor
            <input
              value={actorInput}
              onChange={(event) => setActorInput(event.target.value)}
              placeholder="Username"
            />
          </label>
          <label>
            Event
            <select
              value={eventFilter}
              onChange={(event) => {
                setEventFilter(event.target.value);
                setPage(0);
              }}
            >
              <option value="">All events</option>
              {EVENT_OPTIONS.map((eventName) => (
                <option key={eventName} value={eventName}>
                  {formatEventType(eventName)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rows
            <select
              value={size}
              onChange={(event) => changeSize(Number(event.target.value) as 10 | 50 | 100)}
            >
              <option value={10}>10 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </label>
          <div className="audit-filter-actions">
            <button className="audit-btn-primary" type="submit">Apply</button>
            <button className="audit-btn-ghost" type="button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        {loading && <p className="audit-state">Loading audit trail...</p>}
        {error && <p className="audit-error">{error}</p>}
        {!loading && !error && entries.length === 0 && (
          <p className="audit-state">No audit events have been recorded yet.</p>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="audit-table">
            <div className="audit-table-row audit-table-head">
              <span>Timestamp</span>
              <span>Event</span>
              <span>Actor</span>
              <span>Outcome</span>
              <span>IP address</span>
              <span>Detail</span>
            </div>
            {entries.map((entry) => (
              <div className="audit-table-row" key={entry.id}>
                <span>{formatTimestamp(entry.createdAt)}</span>
                <span className="audit-event">{formatEventType(entry.eventType)}</span>
                <span>{entry.username ?? 'System'}</span>
                <span>
                  <span className={`audit-outcome audit-outcome--${entry.outcome.toLowerCase()}`}>
                    {entry.outcome}
                  </span>
                </span>
                <span>{entry.ipAddress ?? '-'}</span>
                <span className="audit-detail">{entry.detail ?? '-'}</span>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && totalElements > 0 && (
          <div className="audit-pagination">
            <span>
              Showing {firstRow}-{lastRow} of {totalElements}
            </span>
            <div className="audit-pagination-actions">
              <button
                className="audit-btn-ghost"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
              <button
                className="audit-btn-ghost"
                onClick={() => setPage((current) => current + 1)}
                disabled={page + 1 >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
