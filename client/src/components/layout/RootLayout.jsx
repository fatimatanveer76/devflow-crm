import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectApp, toggleSidebar } from '../../features/app/appSlice';
import HealthBadge from '../common/HealthBadge';

export const RootLayout = () => {
  const { appName, sidebarOpen } = useSelector(selectApp);
  const dispatch = useDispatch();

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
            Architecture & Setup
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Architecture Hub</span>
          </NavLink>

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--status-success)',
                background: 'var(--status-success-bg)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
              <span>Phase 1: Foundation</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
              <span>Phases 2–14: Standby</span>
            </div>
          </div>
        </nav>

        {/* Footer / Version */}
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
          <span>v1.0.0 (Phase 1)</span>
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
              System Architecture Status
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <HealthBadge />
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
