import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import RoleGuard from '../components/auth/RoleGuard';

/**
 * DashboardPage — authenticated landing page.
 * Shows a personalized welcome and role-aware navigation cards for Phase 4+.
 */
const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);

  const roleLabel = {
    admin: 'Administrator',
    manager: 'Manager',
    employee: 'Employee',
  }[user?.role] || user?.role;

  const roleBadgeClass = {
    admin: 'badge-danger',
    manager: 'badge-warning',
    employee: 'badge-success',
  }[user?.role] || 'badge-info';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className={`badge ${roleBadgeClass}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              {user?.role === 'admin' ? 'admin_panel_settings' : user?.role === 'manager' ? 'manage_accounts' : 'person'}
            </span>
            <span>{roleLabel}</span>
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          You are signed in as <strong>{user?.email}</strong> with{' '}
          <strong>{roleLabel}</strong> privileges.
        </p>
      </div>

      {/* Phase 4 RBAC Status Card */}
      <div className="glass-card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-success-bg)',
              color: 'var(--status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              Phase 4 — RBAC &amp; Authorization Active
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Role-based access control is enforced on all protected API endpoints
            </div>
          </div>
          <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
            <span className="status-dot pulse" />
            Live
          </span>
        </div>

        <div className="grid-3">
          {[
            {
              icon: 'lock',
              label: 'Your Role',
              value: roleLabel,
              sub: 'Current access level',
              color: 'var(--accent-primary)',
              bg: 'rgba(99,102,241,0.10)',
            },
            {
              icon: 'key',
              label: 'Session',
              value: 'Active',
              sub: 'JWT + HTTP-only cookie',
              color: 'var(--status-success)',
              bg: 'var(--status-success-bg)',
            },
            {
              icon: 'shield',
              label: 'Permissions',
              value: user?.role === 'admin' ? 'Full' : user?.role === 'manager' ? 'Elevated' : 'Standard',
              sub: 'Enforced server-side',
              color: 'var(--accent-secondary)',
              bg: 'rgba(139,92,246,0.10)',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: item.bg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {item.icon}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions — role-aware */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
        Quick Actions
      </h2>
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* User management — admin + manager */}
        <RoleGuard allowedRoles={['admin', 'manager']}>
          <Link
            to="/users"
            style={{ textDecoration: 'none' }}
            id="quick-action-users"
          >
            <div
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(99,102,241,0.12)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <span className="material-symbols-outlined">group</span>
              </div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>
                User Management
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                View, manage roles &amp; activate/deactivate users
              </div>
            </div>
          </Link>
        </RoleGuard>

        {/* CRM Leads — active for all authenticated users */}
        <Link
          to="/leads"
          style={{ textDecoration: 'none' }}
          id="quick-action-leads"
        >
          <div
            className="glass-card"
            style={{
              padding: '20px',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <span className="material-symbols-outlined">leaderboard</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>
              Lead Management
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Track sales pipeline, qualify, and manage leads
            </div>
            <span className="badge badge-success">
              Phase 5 Live
            </span>
          </div>
        </Link>

        {/* CRM Deals & Sales Pipeline — active for all authenticated users */}
        <Link
          to="/deals"
          style={{ textDecoration: 'none' }}
          id="quick-action-deals"
        >
          <div
            className="glass-card"
            style={{
              padding: '20px',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <span className="material-symbols-outlined">monetization_on</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>
              Deals &amp; Pipeline
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Sales pipeline stages, deal probabilities, and revenue forecasts
            </div>
            <span className="badge badge-success">
              Phase 6 Live
            </span>
          </div>
        </Link>

        {/* Projects & Project Management — active for all authenticated users */}
        <Link
          to="/projects"
          style={{ textDecoration: 'none' }}
          id="quick-action-projects"
        >
          <div
            className="glass-card"
            style={{
              padding: '20px',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>
              Projects &amp; Management
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Project portfolio, status tracking, and budget management
            </div>
            <span className="badge badge-success">
              Phase 7 Live
            </span>
          </div>
        </Link>

        {/* Tasks & Activities — active for all authenticated users */}
        <Link
          to="/tasks"
          style={{ textDecoration: 'none' }}
          id="quick-action-tasks"
        >
          <div
            className="glass-card"
            style={{
              padding: '20px',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <span className="material-symbols-outlined">checklist</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>
              Tasks &amp; Activities
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Kanban task boards, deliverables, notes, and activity timeline
            </div>
            <span className="badge badge-success">
              Phase 8 Live
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
