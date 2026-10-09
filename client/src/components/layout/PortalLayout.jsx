import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logoutUser } from '../../features/auth/authSlice';

export const PortalLayout = () => {
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Client Portal Header */}
      <header
        style={{
          height: 'var(--header-height)',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              domain
            </span>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              DevFlow Client Portal
            </div>
            <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: '600', letterSpacing: '0.04em' }}>
              CLIENT ACCESS PLATFORM
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLink to="/portal/dashboard" className={navLinkClass} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>space_dashboard</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/portal/projects" className={navLinkClass} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>task_alt</span>
            <span>Projects</span>
          </NavLink>

          <NavLink to="/portal/requirements" className={navLinkClass} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
            <span>Specifications</span>
          </NavLink>

          <NavLink to="/portal/profile" className={navLinkClass} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* User Identity & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {currentUser?.name || 'Client Contact'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {currentUser?.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.8rem' }}
            title="Log out from Client Portal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
            Logout
          </button>
        </div>
      </header>

      {/* Main Portal View */}
      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>

      {/* Portal Footer */}
      <footer
        style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-secondary)',
        }}
      >
        DevFlow CRM Client Portal &bull; Secure Encrypted Client Gateway &bull; Protected by Tenant Isolation
      </footer>
    </div>
  );
};

export default PortalLayout;
