import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectApp, toggleSidebar } from '../../features/app/appSlice';
import { selectCurrentUser, selectIsAuthenticated, logoutUser } from '../../features/auth/authSlice';
import HealthBadge from '../common/HealthBadge';

const ROLE_BADGE_CLASS = {
  admin: 'badge-danger',
  manager: 'badge-warning',
  employee: 'badge-success',
};

export const RootLayout = () => {
  const { appName, sidebarOpen } = useSelector(selectApp);
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-normal)',
        }}
      >
        {/* Brand */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>hub</span>
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '-0.02em' }}>
              {appName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              ENTERPRISE PLATFORM
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '20px 0', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              padding: '0 20px 8px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Navigation
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Architecture Hub</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">home</span>
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* CRM Leads — all authenticated users */}
          {isAuthenticated && (
            <NavLink
              to="/leads"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">leaderboard</span>
              <span>Leads</span>
            </NavLink>
          )}

          {/* CRM Deals & Sales Pipeline — all authenticated users */}
          {isAuthenticated && (
            <NavLink
              to="/deals"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">monetization_on</span>
              <span>Deals &amp; Pipeline</span>
            </NavLink>
          )}

          {/* User management — admin and manager only */}
          {isAuthenticated && (currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">group</span>
              <span>User Management</span>
            </NavLink>
          )}

          <div
            style={{
              marginTop: '24px',
              padding: '0 20px 8px',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Roadmap Pipeline
          </div>

          <div style={{ padding: '0 12px' }}>
            {[
              'Phase 1: Foundation',
              'Phase 2: Database',
              'Phase 3: Authentication',
              'Phase 4: RBAC',
              'Phase 5: Leads & CRM',
              'Phase 6: Deals & Pipeline',
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--status-success)',
                  background: 'var(--status-success-bg)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '4px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                <span>{label}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
              <span>Phases 7–14: Standby</span>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>v1.0.0 (Phase 6)</span>
          <span className="badge badge-info">Dev Mode</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="main-content-wrapper"
        style={{
          marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0,
          transition: 'margin-left var(--transition-normal)',
        }}
      >
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Toggle sidebar"
            >
              <span className="material-symbols-outlined">
                {sidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              DevFlow CRM
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HealthBadge />

            {isAuthenticated && currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Role badge */}
                <span className={`badge ${ROLE_BADGE_CLASS[currentUser.role] || 'badge-info'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                    {currentUser.role === 'admin'
                      ? 'admin_panel_settings'
                      : currentUser.role === 'manager'
                      ? 'manage_accounts'
                      : 'person'}
                  </span>
                  {currentUser.role}
                </span>

                {/* User name */}
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentUser.name}
                </span>

                {/* Logout */}
                <button
                  className="btn btn-secondary"
                  onClick={handleLogout}
                  style={{
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.8rem',
                  }}
                  title="Sign out"
                  id="btn-logout"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to="/login"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn"
                  style={{
                    fontSize: '0.85rem',
                    padding: '6px 14px',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
