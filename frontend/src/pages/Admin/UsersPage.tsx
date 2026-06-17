import { useEffect, useState, type FormEvent } from 'react';
import {
  createUser,
  listUsers,
  resetPassword,
  unlockUser,
  type UserSummary,
} from '../../api/userAdminApi';
import './Admin.css';

const ROLES = ['ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR', 'REVIEWER', 'EMPLOYEE'];

interface CreateFormState {
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  mfaEnabled: boolean;
}

const EMPTY_FORM: CreateFormState = {
  username: '',
  email: '',
  fullName: '',
  roles: [],
  mfaEnabled: true,
};

function roleBadgeLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    COMPLIANCE_OFFICER: 'Compliance',
    AUDITOR: 'Auditor',
    REVIEWER: 'Reviewer',
    EMPLOYEE: 'Employee',
  };
  return map[role] ?? role;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    return listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (form.roles.length === 0) {
      setFormStatus({ ok: false, msg: 'Select at least one role.' });
      return;
    }
    setSubmitting(true);
    setFormStatus(null);
    try {
      await createUser(form);
      setFormStatus({ ok: true, msg: `User "${form.username}" created. A temporary password was emailed to ${form.email}.` });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create user.';
      setFormStatus({ ok: false, msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(user: UserSummary) {
    if (!window.confirm(`Reset the password for ${user.username}? A new temporary password will be emailed to ${user.email}.`)) return;
    setBusyUserId(user.id);
    setActionMsg(null);
    try {
      await resetPassword(user.id);
      setActionMsg(`Temporary password emailed to ${user.email}.`);
      await refresh();
    } catch {
      setActionMsg('Failed to reset password.');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleUnlock(user: UserSummary) {
    setBusyUserId(user.id);
    setActionMsg(null);
    try {
      await unlockUser(user.id);
      setActionMsg(`${user.username} has been unlocked.`);
      await refresh();
    } catch {
      setActionMsg('Failed to unlock user.');
    } finally {
      setBusyUserId(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roles.some((r) => r.toLowerCase().includes(q))
    );
  });

  return (
    <div className="adm-content">
      <div className="adm-page-header">
        <h2>User Management</h2>
        <p className="adm-page-subtitle">
          Create accounts, reset passwords, and unlock users. Generated passwords are emailed
          directly to the user — the user must set a new password on first login.
        </p>
      </div>

      {/* Create user card */}
      <div className="adm-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showForm ? 16 : 0 }}>
          <div>
            <p className="adm-card-title">Create user</p>
            {!showForm && (
              <p className="adm-card-note">Add a new user account and assign their initial roles.</p>
            )}
          </div>
          <button
            className={showForm ? 'adm-btn-ghost' : 'adm-btn-primary'}
            onClick={() => { setShowForm((v) => !v); setFormStatus(null); }}
          >
            {showForm ? 'Cancel' : '+ New user'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate}>
            <div className="adm-field-grid">
              <label>
                Username
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. jsmith"
                  required
                  autoComplete="off"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                Full name
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="First Last"
                  required
                />
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Roles
              </p>
              <div className="adm-user-role-checks">
                {ROLES.map((role) => (
                  <label key={role} className="adm-checkbox-row">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    {roleBadgeLabel(role)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      ({role})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="adm-checkbox-row" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={form.mfaEnabled}
                onChange={(e) => setForm({ ...form, mfaEnabled: e.target.checked })}
              />
              Require MFA on first login
            </label>

            {formStatus && (
              <p style={{ margin: '8px 0 0', fontSize: '0.84rem', color: formStatus.ok ? '#065f46' : '#b42318' }}>
                {formStatus.msg}
              </p>
            )}

            <div className="adm-card-actions">
              <button type="submit" className="adm-btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Users table card */}
      <div className="adm-card">
        <div className="adm-users-toolbar" style={{ marginBottom: 16 }}>
          <input
            className="adm-user-search"
            type="search"
            placeholder="Search by name, username, email or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {actionMsg && (
            <p className="adm-status" style={{ margin: 0, whiteSpace: 'nowrap' }}>{actionMsg}</p>
          )}
        </div>

        {loading && <p className="adm-state">Loading users…</p>}
        {error && <p className="adm-error">{error}</p>}

        {!loading && !error && (
          <table className="adm-user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Status</th>
                <th>MFA</th>
                <th>Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-state" style={{ textAlign: 'center', padding: '28px 0' }}>
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="adm-user-uname">{user.username}</div>
                    <div className="adm-user-email">{user.fullName}</div>
                    <div className="adm-user-email">{user.email}</div>
                  </td>
                  <td>
                    <div className="adm-user-roles">
                      {user.roles.map((r) => (
                        <span key={r} className="adm-badge adm-badge--role">{roleBadgeLabel(r)}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="adm-user-status-flags">
                      {user.enabled && !user.accountLocked && !user.mustChangePassword && (
                        <span className="adm-badge adm-badge--active">Active</span>
                      )}
                      {!user.enabled && (
                        <span className="adm-badge adm-badge--danger">Disabled</span>
                      )}
                      {user.accountLocked && (
                        <span className="adm-badge adm-badge--danger">Locked</span>
                      )}
                      {user.mustChangePassword && (
                        <span className="adm-badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>
                          Pwd change
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {user.mfaEnabled
                      ? <span className="adm-badge adm-badge--mfa">MFA on</span>
                      : <span className="adm-badge" style={{ background: '#f1f5f9', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>Off</span>
                    }
                  </td>
                  <td className="adm-user-login">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                  </td>
                  <td className="adm-user-actions">
                    <button
                      className="adm-btn-ghost-sm"
                      disabled={busyUserId === user.id}
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset pwd
                    </button>
                    {user.accountLocked && (
                      <button
                        className="adm-btn-primary"
                        style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                        disabled={busyUserId === user.id}
                        onClick={() => handleUnlock(user)}
                      >
                        Unlock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
