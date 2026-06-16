import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, verifyMfa } from '../../api/authApi';
import { useAuth } from '../../auth/AuthContext';
import { BrandIcon } from '../../components/BrandIcon';
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
    navigate('/home', { replace: true });
  }

  function handleBack() {
    setStep('credentials');
    setMfaCode('');
    setMfaToken(null);
    setError(null);
  }

  return (
    <div className="login-page">
      <div className="login-panel-form">
      <div className="login-card">
        <div className="login-brand">
          <BrandIcon size={52} />
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

            <p className="login-seed-hint">
              Default admin: <code>admin</code> / <code>admin@123</code>
              <br />
              MFA bypass code (dev only): <code>123456</code>
            </p>
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

        <p className="login-terms">
          By signing in you agree to our{' '}
          <Link to="/terms" target="_blank" rel="noopener noreferrer">
            Terms &amp; Conditions
          </Link>
        </p>
      </div>
      </div>

      <div className="login-panel-visual">
        <div className="visual-overlay">
          <div className="visual-content">
            <BrandIcon size={48} className="visual-crest-icon" />
            <h2>Governance, Risk &amp; Compliance — Elevated</h2>
            <p>
              A unified command center for policy, controls, decisions, and assurance —
              built for organizations that hold themselves to the highest standard.
            </p>
            <ul className="visual-points">
              <li>Enterprise-grade security &amp; encryption</li>
              <li>Role-based governance workflows</li>
              <li>Audit-ready, end-to-end traceability</li>
            </ul>
          </div>

          <svg
            className="visual-skyline"
            viewBox="0 0 800 400"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(201, 162, 39, 0.18)" />
                <stop offset="100%" stopColor="rgba(201, 162, 39, 0.02)" />
              </linearGradient>
            </defs>
            <g fill="url(#skylineFade)">
              <rect x="20" y="180" width="60" height="220" />
              <rect x="95" y="120" width="50" height="280" />
              <rect x="160" y="200" width="70" height="200" />
              <rect x="245" y="80" width="55" height="320" />
              <rect x="315" y="150" width="65" height="250" />
              <rect x="395" y="60" width="60" height="340" />
              <rect x="470" y="170" width="50" height="230" />
              <rect x="535" y="110" width="70" height="290" />
              <rect x="620" y="190" width="55" height="210" />
              <rect x="690" y="140" width="60" height="260" />
            </g>
            <g stroke="rgba(201, 162, 39, 0.35)" strokeWidth="1">
              <line x1="0" y1="80" x2="800" y2="80" />
              <line x1="0" y1="160" x2="800" y2="160" />
              <line x1="0" y1="240" x2="800" y2="240" />
              <line x1="0" y1="320" x2="800" y2="320" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
