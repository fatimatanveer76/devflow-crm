import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchPortalDashboard,
  selectPortalMetrics,
  selectPortalRecentProjects,
  selectPortalRecentActivities,
  selectPortalProfile,
  selectPortalLoading,
  selectPortalError,
} from '../../features/portal/portalSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';

export const ClientDashboardPage = () => {
  const dispatch = useDispatch();
  const metrics = useSelector(selectPortalMetrics);
  const recentProjects = useSelector(selectPortalRecentProjects);
  const recentActivities = useSelector(selectPortalRecentActivities);
  const profile = useSelector(selectPortalProfile);
  const loading = useSelector(selectPortalLoading);
  const error = useSelector(selectPortalError);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    dispatch(fetchPortalDashboard());
  }, [dispatch]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const meta = {
      planning: { label: 'Planning', color: '#6366f1', bg: 'rgba(99,102,241,0.14)' },
      active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
      on_hold: { label: 'On Hold', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
      completed: { label: 'Completed', color: '#06b6d4', bg: 'rgba(6,182,212,0.14)' },
    }[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.14)' };

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: meta.bg,
          color: meta.color,
        }}
      >
        {meta.label}
      </span>
    );
  };

  if (loading && recentProjects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(6, 182, 212, 0.2)',
            borderTopColor: '#06b6d4',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        Loading client dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
            Welcome back, {currentUser?.name || 'Client'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            {profile?.company_name ? `${profile.company_name} — ` : ''}Real-time visibility into your active projects, deliverables, and approved requirement specifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/portal/projects" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>task_alt</span>
            View Projects
          </Link>
          <Link to="/portal/requirements" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
            View Specifications
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '24px',
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--status-danger)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Projects
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '8px' }}>
            {metrics.totalProjects}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Managed in DevFlow
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>
            Active Projects
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>
            {metrics.activeProjects}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            In planning &amp; progress
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: '700', textTransform: 'uppercase' }}>
            Completed Projects
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#06b6d4', marginTop: '8px' }}>
            {metrics.completedProjects}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Delivered successfully
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase' }}>
            Approved Specifications
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '8px' }}>
            {metrics.approvedRequirements + metrics.publishedRequirements}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Signed-off deliverables
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Assigned Projects */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Active Projects</h2>
            <Link to="/portal/projects" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>
              View All &rarr;
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>folder_open</span>
              <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>No projects currently assigned to your account.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/portal/projects?project=${p.id}`}
                  style={{
                    display: 'block',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  className="table-row-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    {getStatusBadge(p.status)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Target Completion: {formatDate(p.due_date)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Stream */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 16px 0' }}>Project Updates</h2>

          {recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>notifications_off</span>
              <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>No recent updates for your projects.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(6, 182, 212, 0.12)',
                      color: '#06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      bolt
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDate(act.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
