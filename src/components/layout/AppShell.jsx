import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="eyebrow">PDF Chatbot Console</p>
          <h1 className="app-shell__title">Welcome back, {user?.full_name?.split(' ')[0] || 'there'}.</h1>
        </div>
        <div className="app-shell__actions">
          <nav className="app-shell__nav" aria-label="Primary">
            <NavLink to="/app" end>
              Dashboard
            </NavLink>
            <NavLink to="/app/sessions">Sessions</NavLink>
          </nav>
          <button type="button" className="button button--ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

