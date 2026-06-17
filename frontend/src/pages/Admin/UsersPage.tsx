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

export function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  function refresh() {
    setLoading(true);
    return listUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (form.roles.length === 0) {
      setStatus('Select at least one role.');
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      await createUser(form);
      setStatus(`User created. A temporary password was emailed to ${form.email}.`);
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create user.';
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(user: UserSummary) {
    if (!window.confirm(`Reset the password for ${user.username}? A new temporary password will be emailed to ${user.email}.`)) {
      return;
    }
    setBusyUserId(user.id);
    setStatus(null);
    try {
      await resetPassword(user.id);
      setStatus(`Temporary password emailed to ${user.email}.`);
      await refresh();
    } catch {
      setStatus('Failed to reset password.');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleUnlock(user: UserSummary) {
    setBusyUserId(user.id);
    setStatus(null);
    try {
      await unlockUser(user.id);
      setStatus(`${user.username} has been unlocked.`);
      await refresh();
    } catch {
      setStatus('Failed to unlock user.');
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="admin-page">
      <h2>User Management</h2>
      <p className="admin-intro">
        Create users and reset passwords here. Generated passwords are emailed directly to the
        user and are never shown in this UI — the user must set a new password on first login.
      </p>

      <section className="admin-card admin-card--wide">
        <h3>Create user</h3>
        <form onSubmit={handleCreate}>
          <label htmlFor="new-username">Username</label>
          <input
            id="new-username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />

          <label htmlFor="new-email">Email</label>
          <input
            id="new-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label htmlFor="new-fullname">Full name</label>
          <input
            id="new-fullname"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />

          <label>Roles</label>
          <div className="admin-role-checkboxes">
            {ROLES.map((role) => (
              <label key={role} className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.mfaEnabled}
              onChange={(e) => setForm({ ...form, mfaEnabled: e.target.checked })}
            />
            Require MFA
          </label>

          <div className="admin-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>

        {status && <p className="admin-status">{status}</p>}
      </section>

      <section className="admin-card admin-card--wide">
        <h3>Users</h3>
        {loading && <p>Loading...</p>}
        {error && <p className="admin-error">{error}</p>}
        {!loading && !error && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.roles.join(', ')}</td>
                  <td>
                    {!user.enabled && <span className="admin-badge admin-badge--muted">Disabled</span>}
                    {user.accountLocked && <span className="admin-badge admin-badge--danger">Locked</span>}
                    {user.mustChangePassword && (
                      <span className="admin-badge admin-badge--warning">Password change pending</span>
                    )}
                    {user.enabled && !user.accountLocked && !user.mustChangePassword && (
                      <span className="admin-badge admin-badge--success">Active</span>
                    )}
                  </td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      disabled={busyUserId === user.id}
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset password
                    </button>
                    {user.accountLocked && (
                      <button
                        type="button"
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
      </section>
    </div>
  );
}
