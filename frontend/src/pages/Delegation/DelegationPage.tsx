import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  createDelegation,
  getDelegationsGiven,
  getDelegationsReceived,
  revokeDelegation,
  type Delegation,
} from '../../api/delegationApi';
import './Delegation.css';

function formatDate(s: string | null): string {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DelegationPage() {
  const { user } = useAuth();
  const [given, setGiven] = useState<Delegation[]>([]);
  const [received, setReceived] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [delegateUsername, setDelegateUsername] = useState('');
  const [reason, setReason] = useState('');
  const [validFrom, setValidFrom] = useState(today());
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [g, r] = await Promise.all([getDelegationsGiven(), getDelegationsReceived()]);
      setGiven(g);
      setReceived(r);
    } catch {
      setError('Failed to load delegations.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!delegateUsername.trim()) { setFormError('Delegate username is required.'); return; }
    if (delegateUsername.trim().toLowerCase() === user?.username?.toLowerCase()) {
      setFormError("You cannot delegate to yourself."); return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createDelegation({
        delegateUsername: delegateUsername.trim(),
        reason: reason.trim() || undefined,
        validFrom,
        validUntil: validUntil || null,
      });
      setGiven((prev) => [created, ...prev]);
      setShowForm(false);
      setDelegateUsername('');
      setReason('');
      setValidFrom(today());
      setValidUntil('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Failed to create delegation.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: number) {
    if (!window.confirm('Revoke this delegation?')) return;
    try {
      await revokeDelegation(id);
      setGiven((prev) => prev.map((d) => d.id === id ? { ...d, isActive: false } : d));
    } catch {
      setError('Failed to revoke delegation.');
    }
  }

  return (
    <div className="deleg-page">
      <div className="deleg-header">
        <div>
          <h2>Delegation of Authority</h2>
          <p className="deleg-subtitle">
            Grant another user the ability to act on your behalf for all approval actions in the system.
            Delegation applies to policy, procedure, and workflow approvals only.
          </p>
        </div>
        <button className="deleg-btn-primary" onClick={() => { setShowForm(true); setFormError(null); }}>
          + New delegation
        </button>
      </div>

      {error && <p className="deleg-error">{error}</p>}

      {/* Create form */}
      {showForm && (
        <div className="deleg-form-card">
          <h3>Delegate your approval authority</h3>
          <p className="deleg-form-note">
            The person you delegate will be able to approve or reject items on your behalf.
            This does not transfer your role — it only grants approval authority for the period specified.
          </p>
          <form onSubmit={handleCreate} className="deleg-form">
            <div className="deleg-field">
              <label>Delegate's username *</label>
              <input
                value={delegateUsername}
                onChange={(e) => setDelegateUsername(e.target.value)}
                placeholder="Enter their login username"
                autoFocus
              />
            </div>
            <div className="deleg-field">
              <label>Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual leave, medical absence…"
                rows={2}
              />
            </div>
            <div className="deleg-field-row">
              <div className="deleg-field">
                <label>Valid from *</label>
                <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </div>
              <div className="deleg-field">
                <label>Valid until (leave blank for open-ended)</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>
            {formError && <p className="deleg-error">{formError}</p>}
            <div className="deleg-form-actions">
              <button className="deleg-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create delegation'}
              </button>
              <button className="deleg-btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="deleg-state">Loading delegations…</p>}

      {!loading && (
        <div className="deleg-columns">
          {/* Delegations I gave */}
          <section className="deleg-section">
            <h3>Delegations I've given</h3>
            <p className="deleg-section-note">Users who can act on your behalf.</p>
            {given.length === 0 ? (
              <p className="deleg-state">No active delegations.</p>
            ) : (
              <div className="deleg-table-wrap">
                <table className="deleg-table">
                  <thead>
                    <tr>
                      <th>Delegate</th>
                      <th>Reason</th>
                      <th>Valid from</th>
                      <th>Valid until</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {given.map((d) => (
                      <tr key={d.id} className={!d.isActive ? 'deleg-row--revoked' : ''}>
                        <td className="deleg-col-user">{d.delegateUsername}</td>
                        <td className="deleg-col-reason">{d.reason ?? '—'}</td>
                        <td className="deleg-col-date">{formatDate(d.validFrom)}</td>
                        <td className="deleg-col-date">{d.validUntil ? formatDate(d.validUntil) : 'Open-ended'}</td>
                        <td>
                          <span className={`deleg-status ${d.isActive ? 'deleg-status--active' : 'deleg-status--revoked'}`}>
                            {d.isActive ? 'Active' : 'Revoked'}
                          </span>
                        </td>
                        <td>
                          {d.isActive && (
                            <button className="deleg-btn-revoke" onClick={() => handleRevoke(d.id)}>
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Delegations I received */}
          <section className="deleg-section">
            <h3>Delegations granted to me</h3>
            <p className="deleg-section-note">You can act on behalf of these users for approval actions.</p>
            {received.length === 0 ? (
              <p className="deleg-state">No one has delegated to you.</p>
            ) : (
              <div className="deleg-table-wrap">
                <table className="deleg-table">
                  <thead>
                    <tr>
                      <th>Delegated by</th>
                      <th>Reason</th>
                      <th>Valid from</th>
                      <th>Valid until</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {received.map((d) => (
                      <tr key={d.id} className={!d.isActive ? 'deleg-row--revoked' : ''}>
                        <td className="deleg-col-user">{d.delegatorUsername}</td>
                        <td className="deleg-col-reason">{d.reason ?? '—'}</td>
                        <td className="deleg-col-date">{formatDate(d.validFrom)}</td>
                        <td className="deleg-col-date">{d.validUntil ? formatDate(d.validUntil) : 'Open-ended'}</td>
                        <td>
                          <span className={`deleg-status ${d.isActive ? 'deleg-status--active' : 'deleg-status--revoked'}`}>
                            {d.isActive ? 'Active' : 'Revoked'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
