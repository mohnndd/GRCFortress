import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandIcon } from '../components/BrandIcon';
import { FloatingReportButton } from '../components/FloatingReportButton';
import { useAuth } from '../auth/AuthContext';
import './AppLayout.css';

type NavLayout = 'sidebar' | 'topbar';

const NAV_ITEMS = [
  { to: '/home', label: 'Home' },
  { to: '/policies', label: 'Policy management' },
  { to: '/procedures', label: 'Procedures & standards' },
  { to: '/circulars', label: 'Circulars' },
  { to: '/departments', label: 'Department configuration' },
  { to: '/delegation-of-authority', label: 'Delegation of authority' },
  { to: '/decision-registers', label: 'Decision registers' },
  { to: '/contracts-repo', label: 'Contracts repo' },
  { to: '/risk-register', label: 'Risk register' },
  { to: '/incidents', label: 'Incident management' },
  { to: '/observations', label: 'Observations' },
  { to: '/whistleblowing', label: 'Whistleblowing' },
  { to: '/terms-and-conditions', label: 'Terms and conditions' },
  { to: '/sla', label: 'SLA configuration' },
  { to: '/audit-trail', label: 'Audit trail' },
  { to: '/reported-issues-suggestions', label: 'Reported issue/suggestion' },
  { to: '/faq', label: 'Help & FAQ' },
];

function getStoredLayout(): NavLayout {
  return (localStorage.getItem('grc-nav-layout') as NavLayout) ?? 'sidebar';
}

// ── Overflow nav (priority navigation) ────────────────────────────────────

function OverflowNav({ items }: { items: { to: string; label: string }[] }) {
  const navRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    measure();
    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  function measure() {
    const nav = navRef.current;
    if (!nav) return;

    // Temporarily show all spans to get real widths
    const spans = spanRefs.current.filter(Boolean) as HTMLSpanElement[];
    spans.forEach((s) => { s.style.display = 'inline-flex'; });

    const available = nav.offsetWidth - 84; // reserve for "More" button
    let used = 0;
    let count = 0;
    for (const span of spans) {
      used += span.offsetWidth + 2;
      if (used > available) break;
      count++;
    }

    // Hide overflow spans immediately (before React re-renders)
    spans.forEach((s, i) => { s.style.display = i < count ? '' : 'none'; });
    setVisibleCount(count);
  }

  const overflowItems = items.slice(visibleCount);

  return (
    <div className="app-topbar-nav" ref={navRef}>
      {items.map((item, i) => (
        <span
          key={item.to}
          ref={(el) => { spanRefs.current[i] = el; }}
          style={i >= visibleCount ? { display: 'none' } : undefined}
        >
          <NavLink
            to={item.to}
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        </span>
      ))}

      {overflowItems.length > 0 && (
        <div className="app-nav-more" ref={moreRef}>
          <button
            className="app-nav-more-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            More ▾
          </button>
          {menuOpen && (
            <div className="app-nav-more-menu">
              {overflowItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `app-nav-more-item${isActive ? ' active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const { user, loadCurrentUser, logout } = useAuth();
  const [navLayout, setNavLayout] = useState<NavLayout>(getStoredLayout);

  useEffect(() => {
    if (!user) {
      loadCurrentUser().catch(() => {
        void logout();
        navigate('/login', { replace: true });
      });
    }
  }, []);

  // AppLayout is only mounted for routes other than /change-password, so any
  // user who still needs to set a password gets redirected there immediately.
  useEffect(() => {
    if (user?.mustChangePassword) {
      navigate('/change-password', { replace: true });
    }
  }, [user, navigate]);

  function handleLogout() {
    void logout();
    navigate('/login', { replace: true });
  }

  function toggleLayout() {
    setNavLayout((prev) => {
      const next: NavLayout = prev === 'sidebar' ? 'topbar' : 'sidebar';
      localStorage.setItem('grc-nav-layout', next);
      return next;
    });
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(user?.roles.includes('ADMIN')
      ? [
          { to: '/admin', label: 'Admin' },
          { to: '/admin/users', label: 'User management' },
        ]
      : []),
  ];

  const navLinks = (
    <>
      {allNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );

  const layoutToggleBtn = (
    <button
      className="layout-toggle-btn"
      onClick={toggleLayout}
      title={navLayout === 'sidebar' ? 'Switch to top navigation' : 'Switch to sidebar navigation'}
      aria-label="Toggle navigation layout"
    >
      {navLayout === 'sidebar' ? (
        /* horizontal bars icon */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="0" y="2" width="16" height="2" rx="1" />
          <rect x="0" y="7" width="16" height="2" rx="1" />
          <rect x="0" y="12" width="16" height="2" rx="1" />
        </svg>
      ) : (
        /* vertical bars icon */
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="0" y="0" width="2" height="16" rx="1" />
          <rect x="5" y="0" width="2" height="16" rx="1" />
          <rect x="10" y="0" width="2" height="16" rx="1" />
          <rect x="15" y="0" width="1" height="16" rx="0.5" />
        </svg>
      )}
    </button>
  );

  const userInfo = user && (
    <div className="app-header-user">
      <span className="app-header-name">{user.fullName}</span>
      <span className="app-header-roles">{user.roles.join(', ')}</span>
    </div>
  );

  if (navLayout === 'topbar') {
    return (
      <div className="app-shell app-shell--topbar">
        <header className="app-topbar">
          <div className="app-topbar-brand">
            <BrandIcon size={34} />
            <span className="app-topbar-name">GRC Fortress</span>
          </div>
          <OverflowNav items={allNavItems} />
          <div className="app-topbar-end">
            {userInfo}
            {layoutToggleBtn}
            <button className="logout-button" onClick={handleLogout}>Sign out</button>
          </div>
        </header>
        <main className="app-content app-content--topbar">
          <Outlet />
        </main>
        <FloatingReportButton />
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--sidebar">
      <aside className="app-sidebar">
        <div className="app-brand">
          <BrandIcon size={40} />
          <div>
            <h1>GRC Fortress</h1>
            <p>Governance, Risk &amp; Compliance</p>
          </div>
        </div>

        <nav className="app-nav">
          {navLinks}
        </nav>

        <div className="app-sidebar-footer">
          <a href="/terms" className="app-footer-link" target="_blank" rel="noopener noreferrer">
            Terms &amp; Conditions
          </a>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          {userInfo}
          <div className="app-header-actions">
            {layoutToggleBtn}
            <button className="logout-button" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <FloatingReportButton />
    </div>
  );
}
