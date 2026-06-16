import { useEffect, useState, type FormEvent } from 'react';
import {
  getEmailSettings, getSmsSettings, sendTestEmail, sendTestSms,
  updateEmailSettings, updateSmsSettings, type IntegrationSetting,
} from '../../api/adminApi';
import {
  listRoles, createRole, updateRole, deleteRole,
  listPermissions, addPermission, deletePermission, listEndpoints,
  type Role, type RolePermission, type Endpoint,
} from '../../api/roleApi';
import {
  listAllFaqPages, createFaqPage, updateFaqPage, deleteFaqPage, type FaqPage,
} from '../../api/faqApi';
import './Admin.css';

// ── Types ──────────────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'roles' | 'integrations' | 'faq' | 'diagnostics';

interface SettingFormState {
  provider: string;
  enabled: boolean;
  config: Record<string, string>;
  secrets: Record<string, string>;
  hasSecrets: boolean;
}

function toFormState(s: IntegrationSetting): SettingFormState {
  return { provider: s.provider, enabled: s.enabled, config: s.config ?? {}, secrets: {}, hasSecrets: s.hasSecrets };
}

const EMAIL_PROVIDERS = ['SMTP'];
const SMS_PROVIDERS = ['TWILIO', 'GENERIC_HTTP'];
const HTTP_METHODS = ['ANY', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="adm-section-header">
      <h3>{title}</h3>
      {subtitle && <p className="adm-section-subtitle">{subtitle}</p>}
    </div>
  );
}

// ── Roles & Permissions tab ────────────────────────────────────────────────

function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [endpointsLoaded, setEndpointsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New role form
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // New permission form
  const [permMethod, setPermMethod] = useState('ANY');
  const [permPattern, setPermPattern] = useState('');
  const [permLabel, setPermLabel] = useState('');
  const [endpointFilter, setEndpointFilter] = useState('');
  const [addingPerm, setAddingPerm] = useState(false);

  useEffect(() => { listRoles().then(setRoles).catch(() => setError('Failed to load roles.')).finally(() => setLoading(false)); }, []);

  async function selectRole(role: Role) {
    setSelectedRole(role);
    setPermissions(await listPermissions(role.id));
    if (!endpointsLoaded) {
      listEndpoints().then((eps) => { setEndpoints(eps); setEndpointsLoaded(true); });
    }
  }

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setSavingRole(true);
    try {
      const role = await createRole(newRoleName, newRoleDesc);
      setRoles((p) => [...p, role].sort((a, b) => a.name.localeCompare(b.name)));
      setNewRoleName(''); setNewRoleDesc(''); setShowNewRole(false);
    } catch { setError('Failed to create role.'); }
    finally { setSavingRole(false); }
  }

  async function handleDeleteRole(id: number) {
    if (!window.confirm('Delete this role?')) return;
    try {
      await deleteRole(id);
      setRoles((p) => p.filter((r) => r.id !== id));
      if (selectedRole?.id === id) { setSelectedRole(null); setPermissions([]); }
    } catch { setError('Cannot delete this role.'); }
  }

  async function handleToggleActive(role: Role) {
    try {
      const updated = await updateRole(role.id, role.description ?? '', !role.isActive);
      setRoles((p) => p.map((r) => r.id === updated.id ? updated : r));
      if (selectedRole?.id === updated.id) setSelectedRole(updated);
    } catch { setError('Failed to update role.'); }
  }

  async function handleAddPerm(e: FormEvent) {
    e.preventDefault();
    if (!selectedRole || !permPattern.trim()) return;
    setAddingPerm(true);
    try {
      const perm = await addPermission(selectedRole.id, permMethod, permPattern.trim(), permLabel.trim());
      setPermissions((p) => [...p, perm]);
      setPermPattern(''); setPermLabel('');
    } catch { setError('Failed to add permission (may already exist).'); }
    finally { setAddingPerm(false); }
  }

  async function handleDeletePerm(id: number) {
    await deletePermission(id);
    setPermissions((p) => p.filter((x) => x.id !== id));
  }

  const filteredEndpoints = endpointFilter
    ? endpoints.filter((e) => e.pathPattern.includes(endpointFilter) || e.controller.toLowerCase().includes(endpointFilter.toLowerCase()))
    : endpoints;

  const groupedEndpoints = filteredEndpoints.reduce<Record<string, Endpoint[]>>((acc, e) => {
    const key = e.controller;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  if (loading) return <p className="adm-state">Loading roles…</p>;

  return (
    <div className="adm-roles-layout">
      <div className="adm-roles-list-col">
        <SectionHeader title="Roles" subtitle="Define roles and assign endpoint permissions to control access." />
        {error && <p className="adm-error">{error}</p>}

        <div className="adm-roles-list">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`adm-role-card${selectedRole?.id === role.id ? ' adm-role-card--selected' : ''}${!role.isActive ? ' adm-role-card--inactive' : ''}`}
              onClick={() => selectRole(role)}
            >
              <div className="adm-role-card-top">
                <span className="adm-role-name">{role.name}</span>
                <div className="adm-role-badges">
                  {role.isSystem && <span className="adm-badge adm-badge--system">System</span>}
                  {!role.isActive && <span className="adm-badge adm-badge--inactive">Inactive</span>}
                </div>
              </div>
              {role.description && <p className="adm-role-desc">{role.description}</p>}
              {!role.isSystem && (
                <div className="adm-role-actions">
                  <button className="adm-btn-ghost-sm" onClick={(e) => { e.stopPropagation(); handleToggleActive(role); }}>
                    {role.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="adm-btn-danger-sm" onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showNewRole ? (
          <form className="adm-new-role-form" onSubmit={handleCreateRole}>
            <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="ROLE_NAME (e.g. AUDITOR)" required />
            <input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Description" />
            <div className="adm-form-row">
              <button className="adm-btn-primary" type="submit" disabled={savingRole}>{savingRole ? 'Creating…' : 'Create'}</button>
              <button className="adm-btn-ghost" type="button" onClick={() => setShowNewRole(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className="adm-btn-primary adm-btn-full" onClick={() => setShowNewRole(true)}>+ New role</button>
        )}
      </div>

      <div className="adm-roles-detail-col">
        {!selectedRole ? (
          <div className="adm-roles-placeholder">
            <p>Select a role to view and manage its endpoint permissions.</p>
          </div>
        ) : (
          <>
            <div className="adm-roles-detail-header">
              <h4>{selectedRole.name}</h4>
              {selectedRole.description && <p className="adm-role-detail-desc">{selectedRole.description}</p>}
            </div>

            <div className="adm-perms-section">
              <p className="adm-perms-label">Assigned permissions</p>
              {permissions.length === 0
                ? <p className="adm-state">No permissions assigned yet.</p>
                : (
                  <table className="adm-perm-table">
                    <thead><tr><th>Method</th><th>Path pattern</th><th>Label</th><th></th></tr></thead>
                    <tbody>
                      {permissions.map((p) => (
                        <tr key={p.id}>
                          <td><span className={`adm-method adm-method--${p.httpMethod.toLowerCase()}`}>{p.httpMethod}</span></td>
                          <td className="adm-perm-path">{p.pathPattern}</td>
                          <td className="adm-perm-label-col">{p.label ?? '—'}</td>
                          <td><button className="adm-btn-danger-sm" onClick={() => handleDeletePerm(p.id)}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              {!selectedRole.isSystem && (
                <form className="adm-add-perm-form" onSubmit={handleAddPerm}>
                  <p className="adm-perms-label" style={{ marginTop: 20 }}>Add permission</p>
                  <div className="adm-perm-form-row">
                    <select value={permMethod} onChange={(e) => setPermMethod(e.target.value)}>
                      {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input value={permPattern} onChange={(e) => setPermPattern(e.target.value)}
                      placeholder="/api/v1/..." required />
                    <input value={permLabel} onChange={(e) => setPermLabel(e.target.value)}
                      placeholder="Label (optional)" />
                    <button className="adm-btn-primary" type="submit" disabled={addingPerm}>
                      {addingPerm ? '…' : 'Add'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="adm-endpoints-section">
              <p className="adm-perms-label">Available API endpoints</p>
              <input className="adm-endpoint-search" value={endpointFilter}
                onChange={(e) => setEndpointFilter(e.target.value)}
                placeholder="Filter by path or controller…" />
              <div className="adm-endpoint-list">
                {Object.entries(groupedEndpoints).map(([ctrl, eps]) => (
                  <div key={ctrl} className="adm-endpoint-group">
                    <p className="adm-endpoint-ctrl">{ctrl}</p>
                    {eps.map((ep, i) => (
                      <div key={i} className="adm-endpoint-row"
                        onClick={() => { setPermMethod(ep.httpMethod); setPermPattern(ep.pathPattern); setPermLabel(''); }}>
                        <span className={`adm-method adm-method--${ep.httpMethod.toLowerCase()}`}>{ep.httpMethod}</span>
                        <span className="adm-endpoint-path">{ep.pathPattern}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Integrations tab ────────────────────────────────────────────────────────

function IntegrationsTab() {
  const [emailForm, setEmailForm] = useState<SettingFormState | null>(null);
  const [smsForm, setSmsForm] = useState<SettingFormState | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [emailTestTo, setEmailTestTo] = useState('');
  const [smsTestTo, setSmsTestTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getEmailSettings(), getSmsSettings()])
      .then(([email, sms]) => { setEmailForm(toFormState(email)); setSmsForm(toFormState(sms)); })
      .catch(() => setError('Failed to load integration settings.'))
      .finally(() => setLoading(false));
  }, []);

  function updCfg(form: SettingFormState, set: (f: SettingFormState) => void, k: string, v: string) {
    set({ ...form, config: { ...form.config, [k]: v } });
  }
  function updSecret(form: SettingFormState, set: (f: SettingFormState) => void, k: string, v: string) {
    set({ ...form, secrets: { ...form.secrets, [k]: v } });
  }

  async function saveEmail() {
    if (!emailForm) return;
    try {
      const saved = await updateEmailSettings({ provider: emailForm.provider, enabled: emailForm.enabled, config: emailForm.config, secrets: Object.keys(emailForm.secrets).length > 0 ? emailForm.secrets : null });
      setEmailForm(toFormState(saved)); setEmailStatus('Email settings saved.');
    } catch { setEmailStatus('Failed to save email settings.'); }
  }

  async function saveSms() {
    if (!smsForm) return;
    try {
      const saved = await updateSmsSettings({ provider: smsForm.provider, enabled: smsForm.enabled, config: smsForm.config, secrets: Object.keys(smsForm.secrets).length > 0 ? smsForm.secrets : null });
      setSmsForm(toFormState(saved)); setSmsStatus('SMS settings saved.');
    } catch { setSmsStatus('Failed to save SMS settings.'); }
  }

  if (loading) return <p className="adm-state">Loading…</p>;
  if (error || !emailForm || !smsForm) return <p className="adm-error">{error ?? 'Unable to load.'}</p>;

  return (
    <div className="adm-integrations">
      <SectionHeader title="Email Integration" subtitle="Configure the outbound SMTP gateway for notifications." />
      <div className="adm-card">
        <label className="adm-checkbox-row">
          <input type="checkbox" checked={emailForm.enabled} onChange={(e) => setEmailForm({ ...emailForm, enabled: e.target.checked })} />
          Enable email notifications
        </label>
        <div className="adm-field-grid">
          <label>Provider<select value={emailForm.provider} onChange={(e) => setEmailForm({ ...emailForm, provider: e.target.value })}>{EMAIL_PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>SMTP Host<input value={emailForm.config.host ?? ''} onChange={(e) => updCfg(emailForm, setEmailForm, 'host', e.target.value)} /></label>
          <label>SMTP Port<input value={emailForm.config.port ?? ''} onChange={(e) => updCfg(emailForm, setEmailForm, 'port', e.target.value)} /></label>
          <label>From address<input value={emailForm.config.from ?? ''} onChange={(e) => updCfg(emailForm, setEmailForm, 'from', e.target.value)} /></label>
          <label>Username<input value={emailForm.config.username ?? ''} onChange={(e) => updCfg(emailForm, setEmailForm, 'username', e.target.value)} /></label>
          <label>Password {emailForm.hasSecrets && <span className="adm-configured">(configured)</span>}
            <input type="password" placeholder={emailForm.hasSecrets ? 'Leave blank to keep' : ''} value={emailForm.secrets.password ?? ''} onChange={(e) => updSecret(emailForm, setEmailForm, 'password', e.target.value)} />
          </label>
        </div>
        <div className="adm-card-actions">
          <button className="adm-btn-primary" onClick={saveEmail}>Save email settings</button>
          <div className="adm-test-row">
            <input placeholder="Test recipient email…" value={emailTestTo} onChange={(e) => setEmailTestTo(e.target.value)} />
            <button className="adm-btn-ghost" onClick={async () => { try { await sendTestEmail(emailTestTo); setEmailStatus(`Test sent to ${emailTestTo}.`); } catch { setEmailStatus('Failed.'); } }} disabled={!emailTestTo}>Send test</button>
          </div>
        </div>
        {emailStatus && <p className="adm-status">{emailStatus}</p>}
      </div>

      <SectionHeader title="SMS Integration" subtitle="Configure the SMS gateway for alerts." />
      <div className="adm-card">
        <label className="adm-checkbox-row">
          <input type="checkbox" checked={smsForm.enabled} onChange={(e) => setSmsForm({ ...smsForm, enabled: e.target.checked })} />
          Enable SMS notifications
        </label>
        <div className="adm-field-grid">
          <label>Provider
            <select value={smsForm.provider} onChange={(e) => setSmsForm({ ...smsForm, provider: e.target.value })}>
              {SMS_PROVIDERS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          {smsForm.provider === 'TWILIO' && <>
            <label>Account SID<input value={smsForm.config.accountSid ?? ''} onChange={(e) => updCfg(smsForm, setSmsForm, 'accountSid', e.target.value)} /></label>
            <label>From number<input value={smsForm.config.fromNumber ?? ''} onChange={(e) => updCfg(smsForm, setSmsForm, 'fromNumber', e.target.value)} /></label>
            <label>Auth token {smsForm.hasSecrets && <span className="adm-configured">(configured)</span>}
              <input type="password" placeholder={smsForm.hasSecrets ? 'Leave blank to keep' : ''} value={smsForm.secrets.authToken ?? ''} onChange={(e) => updSecret(smsForm, setSmsForm, 'authToken', e.target.value)} />
            </label>
          </>}
          {smsForm.provider === 'GENERIC_HTTP' && <>
            <label>Endpoint URL<input value={smsForm.config.endpoint ?? ''} onChange={(e) => updCfg(smsForm, setSmsForm, 'endpoint', e.target.value)} /></label>
            <label>API key {smsForm.hasSecrets && <span className="adm-configured">(configured)</span>}
              <input type="password" placeholder={smsForm.hasSecrets ? 'Leave blank to keep' : ''} value={smsForm.secrets.apiKey ?? ''} onChange={(e) => updSecret(smsForm, setSmsForm, 'apiKey', e.target.value)} />
            </label>
          </>}
        </div>
        <div className="adm-card-actions">
          <button className="adm-btn-primary" onClick={saveSms}>Save SMS settings</button>
          <div className="adm-test-row">
            <input placeholder="Test phone number…" value={smsTestTo} onChange={(e) => setSmsTestTo(e.target.value)} />
            <button className="adm-btn-ghost" onClick={async () => { try { await sendTestSms(smsTestTo); setSmsStatus(`SMS sent to ${smsTestTo}.`); } catch { setSmsStatus('Failed.'); } }} disabled={!smsTestTo}>Send test</button>
          </div>
        </div>
        {smsStatus && <p className="adm-status">{smsStatus}</p>}
      </div>
    </div>
  );
}

// ── FAQ Management tab ─────────────────────────────────────────────────────

function FaqTab() {
  const [pages, setPages] = useState<FaqPage[]>([]);
  const [selected, setSelected] = useState<FaqPage | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ slug: '', title: '', content: '', sortOrder: 0, isPublished: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listAllFaqPages().then(setPages).catch(() => setError('Failed to load FAQ pages.')).finally(() => setLoading(false)); }, []);

  function openEdit(page: FaqPage) {
    setSelected(page);
    setForm({ slug: page.slug, title: page.title, content: page.content, sortOrder: page.sortOrder, isPublished: page.isPublished });
    setEditing(true);
  }

  function openNew() {
    setSelected(null);
    setForm({ slug: '', title: '', content: '', sortOrder: pages.length, isPublished: true });
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (selected) {
        const updated = await updateFaqPage(selected.id, form);
        setPages((p) => p.map((x) => x.id === updated.id ? updated : x).sort((a, b) => a.sortOrder - b.sortOrder));
      } else {
        const created = await createFaqPage(form);
        setPages((p) => [...p, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      setEditing(false);
    } catch { setError('Failed to save page.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this FAQ page?')) return;
    await deleteFaqPage(id);
    setPages((p) => p.filter((x) => x.id !== id));
    if (selected?.id === id) { setSelected(null); setEditing(false); }
  }

  if (loading) return <p className="adm-state">Loading…</p>;

  return (
    <div className="adm-faq-layout">
      <div className="adm-faq-list-col">
        <SectionHeader title="FAQ Pages" subtitle="Manage public knowledge base pages visible to all users." />
        {error && <p className="adm-error">{error}</p>}
        <div className="adm-faq-list">
          {pages.map((page) => (
            <div key={page.id} className={`adm-faq-item${selected?.id === page.id ? ' adm-faq-item--selected' : ''}`} onClick={() => { setSelected(page); setEditing(false); }}>
              <div className="adm-faq-item-top">
                <span className="adm-faq-title">{page.title}</span>
                {!page.isPublished && <span className="adm-badge adm-badge--inactive">Draft</span>}
              </div>
              <span className="adm-faq-slug">/{page.slug}</span>
            </div>
          ))}
          {pages.length === 0 && <p className="adm-state">No pages yet.</p>}
        </div>
        <button className="adm-btn-primary adm-btn-full" onClick={openNew}>+ New page</button>
      </div>

      <div className="adm-faq-detail-col">
        {editing ? (
          <form className="adm-faq-form" onSubmit={handleSave}>
            <div className="adm-faq-form-header">
              <h4>{selected ? `Edit: ${selected.title}` : 'New FAQ Page'}</h4>
              <button type="button" className="adm-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
            <div className="adm-field-grid">
              <label>Page title *<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
              <label>URL slug * (e.g. about, getting-started)<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required /></label>
              <label>Sort order<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
              <label className="adm-checkbox-row" style={{ paddingTop: 22 }}>
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                Published (visible to all users)
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
              Content (Markdown supported)
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={18} className="adm-faq-editor" />
            </label>
            <div className="adm-card-actions">
              <button className="adm-btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save page'}</button>
              {selected && <button className="adm-btn-danger" type="button" onClick={() => handleDelete(selected.id)}>Delete</button>}
            </div>
          </form>
        ) : selected ? (
          <div className="adm-faq-preview">
            <div className="adm-faq-preview-header">
              <h4>{selected.title}</h4>
              <button className="adm-btn-primary" onClick={() => openEdit(selected)}>Edit</button>
            </div>
            <p className="adm-faq-preview-meta">/{selected.slug} · Order {selected.sortOrder} · {selected.isPublished ? 'Published' : 'Draft'}</p>
            <pre className="adm-faq-preview-content">{selected.content}</pre>
          </div>
        ) : (
          <div className="adm-roles-placeholder"><p>Select a page to preview or click "New page" to create one.</p></div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'roles', label: 'Roles & Permissions', icon: '⊕' },
  { id: 'faq', label: 'FAQ Pages', icon: '☰' },
  { id: 'integrations', label: 'Integrations', icon: '⇌' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '⚙' },
];

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [showLoginDiag, setShowLoginDiag] = useState(() => localStorage.getItem('grc-show-login-dev-diagnostics') !== 'false');

  return (
    <div className="adm-shell">
      {/* Sidebar */}
      <nav className="adm-sidebar">
        <div className="adm-sidebar-header">
          <span className="adm-sidebar-title">Administration</span>
        </div>
        <ul className="adm-nav-list">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                className={`adm-nav-item${tab === t.id ? ' adm-nav-item--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="adm-nav-icon">{t.icon}</span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="adm-content">
        {tab === 'overview' && (
          <div>
            <div className="adm-page-header">
              <h2>System Overview</h2>
              <p className="adm-page-subtitle">GRC Fortress administration panel. Manage roles, integrations, and system configuration.</p>
            </div>
            <div className="adm-overview-grid">
              {[
                { title: 'Roles & Permissions', desc: 'Create custom roles and assign API endpoint permissions to control access levels.', tab: 'roles' as AdminTab, icon: '⊕' },
                { title: 'FAQ Pages', desc: 'Manage the public knowledge base. Create, edit, and publish help pages for users.', tab: 'faq' as AdminTab, icon: '☰' },
                { title: 'Integrations', desc: 'Configure email (SMTP) and SMS gateways used for notifications and alerts.', tab: 'integrations' as AdminTab, icon: '⇌' },
                { title: 'Diagnostics', desc: 'Developer tools and login screen diagnostics settings.', tab: 'diagnostics' as AdminTab, icon: '⚙' },
              ].map((card) => (
                <div key={card.tab} className="adm-overview-card" onClick={() => setTab(card.tab)}>
                  <span className="adm-overview-icon">{card.icon}</span>
                  <h4>{card.title}</h4>
                  <p>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'roles' && (
          <div>
            <div className="adm-page-header">
              <h2>Roles & Permissions</h2>
              <p className="adm-page-subtitle">Define custom roles and assign endpoint-level access permissions.</p>
            </div>
            <RolesTab />
          </div>
        )}

        {tab === 'faq' && (
          <div>
            <div className="adm-page-header">
              <h2>FAQ Pages</h2>
              <p className="adm-page-subtitle">Create and manage knowledge base pages visible to all users in the FAQ section.</p>
            </div>
            <FaqTab />
          </div>
        )}

        {tab === 'integrations' && (
          <div>
            <div className="adm-page-header">
              <h2>Integrations</h2>
              <p className="adm-page-subtitle">Configure outbound email and SMS gateways for system notifications.</p>
            </div>
            <IntegrationsTab />
          </div>
        )}

        {tab === 'diagnostics' && (
          <div>
            <div className="adm-page-header">
              <h2>Diagnostics</h2>
              <p className="adm-page-subtitle">Developer and system diagnostic settings.</p>
            </div>
            <div className="adm-card">
              <h3 className="adm-card-title">Login Screen Diagnostics</h3>
              <p className="adm-card-note">The backend connection panel on the login screen is intended for local development and initial setup only.</p>
              <label className="adm-checkbox-row">
                <input type="checkbox" checked={showLoginDiag}
                  onChange={(e) => { setShowLoginDiag(e.target.checked); localStorage.setItem('grc-show-login-dev-diagnostics', String(e.target.checked)); }} />
                Show connection diagnostics on the login screen
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
