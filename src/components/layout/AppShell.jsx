import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const navigationItems = [
  {
    to: '/app/dashboard',
    label: 'Overview',
    eyebrow: '01',
  },
  {
    to: '/app/documents',
    label: 'Documents',
    eyebrow: '02',
  },
  {
    to: '/app/chats',
    label: 'Chats',
    eyebrow: '03',
  },
  {
    to: '/app/sessions',
    label: 'Sessions',
    eyebrow: '04',
  },
];

const routeMeta = [
  {
    pattern: '/app/dashboard',
    eyebrow: 'Workspace overview',
    title: 'Your authenticated workspace foundation.',
    description: 'Protected shell, session restore, and navigation are ready for product feature work.',
  },
  {
    pattern: '/app/documents',
    eyebrow: 'Documents',
    title: 'Manage your PDF library and readiness states.',
    description: 'Upload files, monitor processing outcomes, and move only ready documents into chat workflows.',
  },
  {
    pattern: '/app/documents/:documentId',
    eyebrow: 'Document detail',
    title: 'Inspect one document before taking the next action.',
    description: 'Review metadata, processing health, and readiness before starting a chat session.',
  },
  {
    pattern: '/app/chats',
    eyebrow: 'Chats',
    title: 'Create and organize document-grounded chat sessions.',
    description: 'Choose a processed PDF, open a dedicated conversation route, and prepare the workspace for the full AI panel.',
  },
  {
    pattern: '/app/chats/:chatId',
    eyebrow: 'Chat detail',
    title: 'Inspect one conversation route and its linked source document.',
    description: 'This shell keeps the session timeline, source context, and message history together before the Phase 5 chat experience lands.',
  },
  {
    pattern: '/app/sessions',
    eyebrow: 'Sessions',
    title: 'Track the authenticated devices tied to your account.',
    description: 'Review active sessions, validate refresh behavior, and monitor the current device context.',
  },
  {
    pattern: '/app/profile',
    eyebrow: 'Profile',
    title: 'Account context and session posture.',
    description: 'This area shows the current authenticated user and the active device session.',
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
  const firstName = user?.full_name?.split(' ')[0] || 'there';
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
      <aside className="app-shell__sidebar">
        <div className="app-shell__sidebar-brand">
          <span className="app-shell__sidebar-logo">P</span>
          <div>
            <p className="eyebrow">PDF workspace</p>
            <h2>Console Shell</h2>
          </div>
        </div>

        <nav className="app-shell__sidebar-nav" aria-label="Primary">
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="app-shell__sidebar-link">
              <span className="app-shell__sidebar-link-index">{item.eyebrow}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__sidebar-footer">
          <p className="eyebrow">Authenticated as</p>
          <strong>{user?.full_name || 'Unknown user'}</strong>
          <p>{user?.email || 'No email available'}</p>
        </div>
      </aside>

      <section className="app-shell__workspace">
        <header className="app-shell__topbar">
          <div className="app-shell__topbar-copy">
            <p className="eyebrow">{currentMeta.eyebrow}</p>
            <h1 className="app-shell__title">{currentMeta.title}</h1>
            <p className="app-shell__description">{currentMeta.description}</p>
          </div>

          <div className="app-shell__actions">
            <span className="status-chip">Session restored</span>

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
                <span className={`app-shell__profile-chevron ${isMenuOpen ? 'app-shell__profile-chevron--open' : ''}`}>
                  v
                </span>
              </button>

              {isMenuOpen ? (
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
                      <small>Account context and current session posture</small>
                    </button>
                    <button type="button" role="menuitem" onClick={() => navigate('/app/sessions')}>
                      <span className="app-shell__menu-action-title">Sessions</span>
                      <small>Review active devices and refresh lifecycle</small>
                    </button>
                    <button type="button" role="menuitem" onClick={() => navigate('/app/dashboard')}>
                      <span className="app-shell__menu-action-title">Overview</span>
                      <small>Return to the protected workspace summary</small>
                    </button>
                    <button type="button" role="menuitem" onClick={handleLogout} className="app-shell__menu-action--danger">
                      <span className="app-shell__menu-action-title">Logout</span>
                      <small>End this browser session and return to login</small>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="app-shell__content">
          <div className="app-shell__content-intro panel">
            <p className="eyebrow">Welcome back</p>
            <div className="app-shell__content-intro-row">
              <div>
                <h2>Hi, {firstName}.</h2>
                <p>
                  Your authenticated workspace now keeps navigation, uploads, profile context,
                  and status-driven product flows in one production-style shell.
                </p>
              </div>
              <div className="app-shell__content-intro-pills">
                <span className="pill">Protected routes</span>
                <span className="pill">Shared shell</span>
                <span className="pill pill--highlight">Status-aware workflows</span>
              </div>
            </div>
          </div>

          <Outlet />
        </div>
      </section>
    </div>
  );
}
