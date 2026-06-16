import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import { BrandIcon } from '../../components/BrandIcon';
import './ChangePassword.css';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { loadCurrentUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await loadCurrentUser();
      navigate('/home', { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    void logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <div className="change-password-brand">
          <BrandIcon size={48} />
          <h1>Set a new password</h1>
          <p>For security, you must set a new password before continuing.</p>
        </div>

        {error && <div className="change-password-error">{error}</div>}

        <form className="change-password-form" onSubmit={handleSubmit}>
          <label htmlFor="currentPassword">Current (temporary) password</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Set new password'}
          </button>

          <button type="button" className="change-password-back" onClick={handleLogout}>
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}
