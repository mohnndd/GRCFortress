import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyMfa } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import './Login.css';

type Step = 'credentials' | 'mfa';

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, loadCurrentUser } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCredentialsSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await login(username, password);
      if (response.mfaRequired && response.mfaToken) {
        setMfaToken(response.mfaToken);
        setStep('mfa');
      } else if (response.tokens) {
        await completeLogin(response.tokens);
      }
    } catch {
      setError('Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent) {
    event.preventDefault();
    if (!mfaToken) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const tokens = await verifyMfa(mfaToken, mfaCode);
      await completeLogin(tokens);
    } catch {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeLogin(tokens: { accessToken: string; refreshToken: string; tokenType: string }) {
    setTokens(tokens);
    await loadCurrentUser();
    navigate('/dashboard', { replace: true });
  }

  function handleBack() {
    setStep('credentials');
    setMfaCode('');
    setMfaToken(null);
    setError(null);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">GF</div>
          <h1>GRC Fortress</h1>
          <p>Governance, Risk &amp; Compliance Platform</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {step === 'credentials' && (
          <form className="login-form" onSubmit={handleCredentialsSubmit}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {step === 'mfa' && (
          <form className="login-form" onSubmit={handleMfaSubmit}>
            <button type="button" className="login-back" onClick={handleBack}>
              ← Back
            </button>

            <label htmlFor="mfaCode">Multi-factor authentication code</label>
            <input
              id="mfaCode"
              name="mfaCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              autoFocus
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying…' : 'Verify & sign in'}
            </button>

            <p className="login-helper">
              Enter the code from your authenticator app.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
