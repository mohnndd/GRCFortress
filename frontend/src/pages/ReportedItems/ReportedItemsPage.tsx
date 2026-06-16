import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addReportedItemMessage,
  fetchReportedItemAttachment,
  getReportedItem,
  listReportedItems,
  updateReportedItemStatus,
  type ReportedItemDetail,
  type ReportedItemStatus,
  type ReportedItemSummary,
} from '../../api/reportedItemApi';
import { useAuth } from '../../auth/AuthContext';
import './ReportedItems.css';

const STATUS_OPTIONS: ReportedItemStatus[] = ['NEW', 'UNDER_REVIEW', 'IN_DEVELOPMENT', 'DEPLOYED'];

const STATUS_LABEL: Record<ReportedItemStatus, string> = {
  NEW: 'New',
  UNDER_REVIEW: 'Under review',
  IN_DEVELOPMENT: 'In development',
  DEPLOYED: 'Deployed',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReportedItemsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;
  const [items, setItems] = useState<ReportedItemSummary[]>([]);
  const [selected, setSelected] = useState<ReportedItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const result = await listReportedItems();
      setItems(result);
      setError(null);
    } catch {
      setError('Failed to load reported issues and suggestions.');
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: number) {
    setDetailLoading(true);
    try {
      const detail = await getReportedItem(id);
      setSelected(detail);
      setError(null);
    } catch {
      setError('Failed to load report thread.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(status: ReportedItemStatus) {
    if (!selected) return;
    try {
      const detail = await updateReportedItemStatus(selected.id, status);
      setSelected(detail);
      setItems((current) => current.map((item) => item.id === detail.id ? { ...item, status: detail.status } : item));
    } catch {
      setError('Failed to update status.');
    }
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (!selected || !message.trim()) return;
    setSendingMessage(true);
    try {
      const saved = await addReportedItemMessage(selected.id, message.trim());
      setSelected({ ...selected, messages: [...selected.messages, saved] });
      setMessage('');
    } catch {
      setError('Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function downloadAttachment(item: ReportedItemDetail) {
    const url = await fetchReportedItemAttachment(item.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.attachmentFileName ?? 'attachment';
    link.click();
    URL.revokeObjectURL(url);
  }

  const summary = useMemo(() => ({
    total: items.length,
    newItems: items.filter((item) => item.status === 'NEW').length,
    inProgress: items.filter((item) => item.status === 'UNDER_REVIEW' || item.status === 'IN_DEVELOPMENT').length,
    deployed: items.filter((item) => item.status === 'DEPLOYED').length,
  }), [items]);

  return (
    <div className="reported-page">
      <div className="reported-page-header">
        <div>
          <h2>Reported issue/suggestion</h2>
          <p className="reported-page-intro">
            Track user-submitted issues, suggestions, evidence, and follow-up conversations.
          </p>
        </div>
        <button className="reported-btn-ghost" onClick={loadItems}>Refresh</button>
      </div>

      <div className="reported-stats">
        <div className="reported-stat">
          <span className="reported-stat-value">{summary.total}</span>
          <span className="reported-stat-label">Total reports</span>
        </div>
        <div className="reported-stat reported-stat--attention">
          <span className="reported-stat-value">{summary.newItems}</span>
          <span className="reported-stat-label">New</span>
        </div>
        <div className="reported-stat">
          <span className="reported-stat-value">{summary.inProgress}</span>
          <span className="reported-stat-label">In progress</span>
        </div>
        <div className="reported-stat">
          <span className="reported-stat-value">{summary.deployed}</span>
          <span className="reported-stat-label">Deployed</span>
        </div>
      </div>

      {error && <p className="reported-error">{error}</p>}

      <div className="reported-layout">
        <section className="reported-grid-panel">
          {loading && <p className="reported-state">Loading reports...</p>}
          {!loading && items.length === 0 && (
            <p className="reported-state">No reported issues or suggestions yet.</p>
          )}
          {!loading && items.length > 0 && (
            <div className="reported-grid">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`reported-card${selected?.id === item.id ? ' reported-card--active' : ''}`}
                  type="button"
                  onClick={() => openDetail(item.id)}
                >
                  <div className="reported-card-top">
                    <span className={`reported-type reported-type--${item.reportType.toLowerCase()}`}>
                      {item.reportType}
                    </span>
                    <span className={`reported-status reported-status--${item.status.toLowerCase().replace('_', '-')}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="reported-card-meta">
                    <span>{item.reporterUsername}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  {item.attachmentFileName && (
                    <span className="reported-attachment-note">{item.attachmentFileName}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="reported-detail-panel">
          {detailLoading && <p className="reported-state">Loading thread...</p>}
          {!detailLoading && !selected && (
            <p className="reported-state">Select a report to view its thread.</p>
          )}
          {!detailLoading && selected && (
            <>
              <div className="reported-detail-header">
                <div>
                  <span className={`reported-type reported-type--${selected.reportType.toLowerCase()}`}>
                    {selected.reportType}
                  </span>
                  <h3>{selected.title}</h3>
                  <p>{selected.description}</p>
                </div>
                {isAdmin && (
                  <label className="reported-status-control">
                    Status
                    <select value={selected.status} onChange={(event) => changeStatus(event.target.value as ReportedItemStatus)}>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="reported-detail-meta">
                <span>Reporter: {selected.reporterUsername}</span>
                <span>Created: {formatDate(selected.createdAt)}</span>
              </div>

              {selected.attachmentFileName && (
                <button className="reported-attachment-button" onClick={() => downloadAttachment(selected)}>
                  Download attachment: {selected.attachmentFileName}
                </button>
              )}

              <div className="reported-thread">
                {selected.messages.map((threadMessage) => (
                  <div
                    className={`reported-message${threadMessage.authorUsername === user?.username ? ' reported-message--own' : ''}`}
                    key={threadMessage.id}
                  >
                    <div className="reported-message-meta">
                      <strong>{threadMessage.authorUsername}</strong>
                      <span>{formatDate(threadMessage.createdAt)}</span>
                    </div>
                    <p>{threadMessage.message}</p>
                  </div>
                ))}
              </div>

              <form className="reported-message-form" onSubmit={submitMessage}>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Add a message or request more information"
                  rows={4}
                  maxLength={4000}
                />
                <button className="reported-btn-primary" disabled={sendingMessage || !message.trim()}>
                  {sendingMessage ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
