import { useEffect, useState } from 'react';
import {
  getEmailSettings,
  getSmsSettings,
  sendTestEmail,
  sendTestSms,
  updateEmailSettings,
  updateSmsSettings,
  type IntegrationSetting,
} from '../../api/adminApi';
import './Admin.css';

const EMAIL_PROVIDERS = ['SMTP'];
const SMS_PROVIDERS = ['TWILIO', 'GENERIC_HTTP'];
const LOGIN_DIAGNOSTICS_KEY = 'grc-show-login-dev-diagnostics';

interface SettingFormState {
  provider: string;
  enabled: boolean;
  config: Record<string, string>;
  secrets: Record<string, string>;
  hasSecrets: boolean;
}

function toFormState(setting: IntegrationSetting): SettingFormState {
  return {
    provider: setting.provider,
    enabled: setting.enabled,
    config: setting.config ?? {},
    secrets: {},
    hasSecrets: setting.hasSecrets,
  };
}

export function AdminPage() {
  const [emailForm, setEmailForm] = useState<SettingFormState | null>(null);
  const [smsForm, setSmsForm] = useState<SettingFormState | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [emailTestTo, setEmailTestTo] = useState('');
  const [smsTestTo, setSmsTestTo] = useState('');
  const [showLoginDiagnostics, setShowLoginDiagnostics] = useState(
    () => localStorage.getItem(LOGIN_DIAGNOSTICS_KEY) !== 'false',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getEmailSettings(), getSmsSettings()])
      .then(([email, sms]) => {
        setEmailForm(toFormState(email));
        setSmsForm(toFormState(sms));
      })
      .catch(() => setError('Failed to load integration settings.'))
      .finally(() => setLoading(false));
  }, []);

  function updateConfigField(
    form: SettingFormState,
    setForm: (f: SettingFormState) => void,
    key: string,
    value: string,
  ) {
    setForm({ ...form, config: { ...form.config, [key]: value } });
  }

  function updateSecretField(
    form: SettingFormState,
    setForm: (f: SettingFormState) => void,
    key: string,
    value: string,
  ) {
    setForm({ ...form, secrets: { ...form.secrets, [key]: value } });
  }

  async function handleEmailSave() {
    if (!emailForm) return;
    setEmailStatus(null);
    try {
      const saved = await updateEmailSettings({
        provider: emailForm.provider,
        enabled: emailForm.enabled,
        config: emailForm.config,
        secrets: Object.keys(emailForm.secrets).length > 0 ? emailForm.secrets : null,
      });
      setEmailForm(toFormState(saved));
      setEmailStatus('Email settings saved.');
    } catch {
      setEmailStatus('Failed to save email settings.');
    }
  }

  async function handleSmsSave() {
    if (!smsForm) return;
    setSmsStatus(null);
    try {
      const saved = await updateSmsSettings({
        provider: smsForm.provider,
        enabled: smsForm.enabled,
        config: smsForm.config,
        secrets: Object.keys(smsForm.secrets).length > 0 ? smsForm.secrets : null,
      });
      setSmsForm(toFormState(saved));
      setSmsStatus('SMS settings saved.');
    } catch {
      setSmsStatus('Failed to save SMS settings.');
    }
  }

  async function handleEmailTest() {
    setEmailStatus(null);
    try {
      await sendTestEmail(emailTestTo);
      setEmailStatus(`Test email sent to ${emailTestTo}.`);
    } catch {
      setEmailStatus('Failed to send test email.');
    }
  }

  async function handleSmsTest() {
    setSmsStatus(null);
    try {
      await sendTestSms(smsTestTo);
      setSmsStatus(`Test SMS sent to ${smsTestTo}.`);
    } catch {
      setSmsStatus('Failed to send test SMS.');
    }
  }

  function toggleLoginDiagnostics(enabled: boolean) {
    setShowLoginDiagnostics(enabled);
    localStorage.setItem(LOGIN_DIAGNOSTICS_KEY, String(enabled));
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error || !emailForm || !smsForm) {
    return <p className="admin-error">{error ?? 'Unable to load settings.'}</p>;
  }

  return (
    <div className="admin-page">
      <h2>Admin Settings</h2>
      <p className="admin-intro">
        Configure the outbound email and SMS gateways used for notifications. Secret fields are
        encrypted at rest and left blank means &quot;keep existing value&quot;.
      </p>

      <section className="admin-card admin-card--diagnostics">
        <h3>Developer Diagnostics</h3>
        <p className="admin-card-note">
          The backend and database connection box on the login screen is for development and local setup only.
        </p>
        <label className="admin-toggle-row">
          <input
            type="checkbox"
            checked={showLoginDiagnostics}
            onChange={(event) => toggleLoginDiagnostics(event.target.checked)}
          />
          <span>
            Show login connection diagnostics
            <em>{showLoginDiagnostics ? 'Visible on login screen' : 'Hidden from login screen'}</em>
          </span>
        </label>
      </section>

      <section className="admin-card">
        <h3>Email Integration</h3>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={emailForm.enabled}
            onChange={(e) => setEmailForm({ ...emailForm, enabled: e.target.checked })}
          />
          Enabled
        </label>

        <label htmlFor="email-provider">Provider</label>
        <select
          id="email-provider"
          value={emailForm.provider}
          onChange={(e) => setEmailForm({ ...emailForm, provider: e.target.value })}
        >
          {EMAIL_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>

        <label htmlFor="email-host">SMTP Host</label>
        <input
          id="email-host"
          value={emailForm.config.host ?? ''}
          onChange={(e) => updateConfigField(emailForm, setEmailForm, 'host', e.target.value)}
        />

        <label htmlFor="email-port">SMTP Port</label>
        <input
          id="email-port"
          value={emailForm.config.port ?? ''}
          onChange={(e) => updateConfigField(emailForm, setEmailForm, 'port', e.target.value)}
        />

        <label htmlFor="email-from">From Address</label>
        <input
          id="email-from"
          value={emailForm.config.from ?? ''}
          onChange={(e) => updateConfigField(emailForm, setEmailForm, 'from', e.target.value)}
        />

        <label htmlFor="email-username">SMTP Username</label>
        <input
          id="email-username"
          value={emailForm.config.username ?? ''}
          onChange={(e) => updateConfigField(emailForm, setEmailForm, 'username', e.target.value)}
        />

        <label htmlFor="email-password">
          SMTP Password {emailForm.hasSecrets && <span className="admin-hint">(configured)</span>}
        </label>
        <input
          id="email-password"
          type="password"
          placeholder={emailForm.hasSecrets ? 'Leave blank to keep existing' : ''}
          value={emailForm.secrets.password ?? ''}
          onChange={(e) => updateSecretField(emailForm, setEmailForm, 'password', e.target.value)}
        />

        <div className="admin-actions">
          <button type="button" onClick={handleEmailSave}>
            Save email settings
          </button>
        </div>

        <div className="admin-test-row">
          <input
            placeholder="Send test email to..."
            value={emailTestTo}
            onChange={(e) => setEmailTestTo(e.target.value)}
          />
          <button type="button" onClick={handleEmailTest} disabled={!emailTestTo}>
            Send test email
          </button>
        </div>

        {emailStatus && <p className="admin-status">{emailStatus}</p>}
      </section>

      <section className="admin-card">
        <h3>SMS Integration</h3>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={smsForm.enabled}
            onChange={(e) => setSmsForm({ ...smsForm, enabled: e.target.checked })}
          />
          Enabled
        </label>

        <label htmlFor="sms-provider">Provider</label>
        <select
          id="sms-provider"
          value={smsForm.provider}
          onChange={(e) => setSmsForm({ ...smsForm, provider: e.target.value })}
        >
          {SMS_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>

        {smsForm.provider === 'TWILIO' && (
          <>
            <label htmlFor="sms-account-sid">Account SID</label>
            <input
              id="sms-account-sid"
              value={smsForm.config.accountSid ?? ''}
              onChange={(e) => updateConfigField(smsForm, setSmsForm, 'accountSid', e.target.value)}
            />

            <label htmlFor="sms-from-number">From Number</label>
            <input
              id="sms-from-number"
              value={smsForm.config.fromNumber ?? ''}
              onChange={(e) => updateConfigField(smsForm, setSmsForm, 'fromNumber', e.target.value)}
            />

            <label htmlFor="sms-auth-token">
              Auth Token {smsForm.hasSecrets && <span className="admin-hint">(configured)</span>}
            </label>
            <input
              id="sms-auth-token"
              type="password"
              placeholder={smsForm.hasSecrets ? 'Leave blank to keep existing' : ''}
              value={smsForm.secrets.authToken ?? ''}
              onChange={(e) => updateSecretField(smsForm, setSmsForm, 'authToken', e.target.value)}
            />
          </>
        )}

        {smsForm.provider === 'GENERIC_HTTP' && (
          <>
            <label htmlFor="sms-endpoint">Endpoint URL</label>
            <input
              id="sms-endpoint"
              value={smsForm.config.endpoint ?? ''}
              onChange={(e) => updateConfigField(smsForm, setSmsForm, 'endpoint', e.target.value)}
            />

            <label htmlFor="sms-api-key">
              API Key {smsForm.hasSecrets && <span className="admin-hint">(configured)</span>}
            </label>
            <input
              id="sms-api-key"
              type="password"
              placeholder={smsForm.hasSecrets ? 'Leave blank to keep existing' : ''}
              value={smsForm.secrets.apiKey ?? ''}
              onChange={(e) => updateSecretField(smsForm, setSmsForm, 'apiKey', e.target.value)}
            />
          </>
        )}

        <div className="admin-actions">
          <button type="button" onClick={handleSmsSave}>
            Save SMS settings
          </button>
        </div>

        <div className="admin-test-row">
          <input
            placeholder="Send test SMS to..."
            value={smsTestTo}
            onChange={(e) => setSmsTestTo(e.target.value)}
          />
          <button type="button" onClick={handleSmsTest} disabled={!smsTestTo}>
            Send test SMS
          </button>
        </div>

        {smsStatus && <p className="admin-status">{smsStatus}</p>}
      </section>
    </div>
  );
}
