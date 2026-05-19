import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { AppLogo } from '../common/AppLogo';

const navigationItems = [
  { to: '/app/dashboard', label: 'Overview', eyebrow: '01' },
  { to: '/app/documents', label: 'Documents', eyebrow: '02' },
  { to: '/app/chats', label: 'Chats', eyebrow: '03' },
  { to: '/app/sessions', label: 'Sessions', eyebrow: '04' },
];

const routeMeta = [
  {
    pattern: '/app/dashboard',
    eyebrow: 'Overview',
    title: 'Workspace summary',
    description: 'Your account, session posture, and product state in one compact view.',
  },
  {
    pattern: '/app/documents',
    eyebrow: 'Documents',
    title: 'Document library',
    description: 'Upload, filter, and inspect PDFs without losing source context.',
  },
  {
    pattern: '/app/documents/:documentId',
    eyebrow: 'Document detail',
    title: 'Document inspection',
    description: 'Check readiness, metadata, and next actions before opening chat.',
  },
  {
    pattern: '/app/chats',
    eyebrow: 'Chats',
    title: 'Chat sessions',
    description: 'Create sessions from ready PDFs and keep every chat source-bound.',
  },
  {
    pattern: '/app/chats/:chatId',
    eyebrow: 'Chat detail',
    title: 'Conversation workspace',
    description: 'Read messages, source context, and session state side by side.',
  },
  {
    pattern: '/app/sessions',
    eyebrow: 'Sessions',
    title: 'Device sessions',
    description: 'Review active devices and current refresh lifecycle.',
  },
  {
    pattern: '/app/profile',
    eyebrow: 'Profile',
    title: 'Account profile',
    description: 'See your current identity, role, and device posture.',
  },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const { pushToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentMeta =
    routeMeta.find((entry) => matchPath({ path: entry.pattern, end: true }, location.pathname)) ??
    routeMeta[0];
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const initials = useMemo(() => {
    const parts = user?.full_name?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (parts.length === 0) {
      return 'U';
    }
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  }, [user?.full_name]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      pushToast({
        tone: 'success',
        title: 'Signed out',
        message: 'Your current workspace session was closed successfully.',
      });
    } catch {
      pushToast({
        tone: 'warning',
        title: 'Signed out locally',
        message: 'Local auth was cleared, but the server session could not be confirmed.',
      });
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="app-shell">
      <header className="panel app-shell__topbar">
        <div className="app-shell__topbar-row">
          <div className="app-shell__brand-block">
            <AppLogo className="app-shell__brand-logo" />
            <div className="app-shell__brand-meta">
              <p className="eyebrow">PDF workspace</p>
              <strong>PDF Atlas</strong>
            </div>
          </div>

          <div className="app-shell__topbar-actions">
            <span className="status-chip">Restored</span>
            <div className="app-shell__profile" ref={menuRef}>
              <button
                type="button"
                className="app-shell__profile-trigger"
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
              >
                <span className="app-shell__profile-avatar">{initials}</span>
                <span className="app-shell__profile-copy">
                  <strong>{firstName}</strong>
                  <small>{user?.role || 'user'}</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="app-shell__menu-stage">
            <div className="app-shell__menu">
              <div className="app-shell__menu-header">
                <span className="app-shell__menu-avatar">{initials}</span>
                <div className="app-shell__menu-copy">
                  <strong>{user?.full_name || 'Unknown user'}</strong>
                  <p>{user?.email || 'No email available'}</p>
                  <span>{user?.role || 'user'} account</span>
                </div>
              </div>

              <div className="app-shell__menu-actions" role="menu">
                <button type="button" role="menuitem" onClick={() => navigate('/app/profile')}>
                  <span className="app-shell__menu-action-title">Profile</span>
                  <small>Account identity and device context</small>
                </button>
                <button type="button" role="menuitem" onClick={() => navigate('/app/sessions')}>
                  <span className="app-shell__menu-action-title">Sessions</span>
                  <small>Active devices and refresh lifecycle</small>
                </button>
                <button type="button" role="menuitem" onClick={() => navigate('/app/dashboard')}>
                  <span className="app-shell__menu-action-title">Overview</span>
                  <small>Return to workspace summary</small>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="app-shell__menu-action--danger"
                >
                  <span className="app-shell__menu-action-title">Logout</span>
                  <small>End this browser session</small>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <div className="app-shell__layout">
        <aside className="panel app-shell__sidebar">
          <nav className="app-shell__nav" aria-label="Primary">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `app-shell__nav-link${isActive ? ' active' : ''}`}
              >
                <span className="app-shell__nav-index">{item.eyebrow}</span>
                <span className="app-shell__nav-meta">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="app-shell__side-note">
            <p className="eyebrow">Current operator</p>
            <strong>{user?.full_name || 'Unknown user'}</strong>
            <p>{user?.email || 'No email available'}</p>
          </div>

          <div className="app-shell__side-note">
            <p className="eyebrow">Workspace state</p>
            <strong>Document-first</strong>
            <p>Small surfaces, tighter rhythm, and less full-page scrolling.</p>
          </div>
        </aside>

        <main className="app-shell__main">
          <article className="panel app-shell__content-head">
            <div className="app-shell__content-copy">
              <p className="eyebrow">{currentMeta.eyebrow}</p>
              <h1 className="app-shell__title">{currentMeta.title}</h1>
              <p className="app-shell__description">{currentMeta.description}</p>
            </div>
            <div className="app-shell__content-meta">
              <span className="pill">Compact UI</span>
              <span className="pill pill--highlight">Source-aware</span>
            </div>
          </article>

          <section className="app-shell__content-scroll">
            <div className="app-shell__page-stage" key={location.pathname}>
              <Outlet />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
