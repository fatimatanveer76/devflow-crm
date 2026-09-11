import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import {
  fetchDashboardSummary,
  setDateRange,
  selectDashboardData,
  selectDashboardLoading,
  selectDashboardError,
  selectDashboardDateRange,
  selectDashboardLastUpdated,
} from '../features/dashboard/dashboardSlice';
import { MetricCard } from '../components/dashboard/MetricCard';
import { LeadAnalytics } from '../components/dashboard/LeadAnalytics';
import { DealAnalytics } from '../components/dashboard/DealAnalytics';
import { ProjectAnalytics } from '../components/dashboard/ProjectAnalytics';
import { TaskAnalytics } from '../components/dashboard/TaskAnalytics';
import { DateRangePicker } from '../components/dashboard/DateRangePicker';
import { ActivityTimeline } from '../components/activities/ActivityTimeline';
import RoleGuard from '../components/auth/RoleGuard';

const formatMoney = (amount) => {
  const n = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const data = useSelector(selectDashboardData);
  const isLoading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const { rangeKey, startDate, endDate } = useSelector(selectDashboardDateRange);
  const lastUpdated = useSelector(selectDashboardLastUpdated);

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

  const loadMetrics = useCallback(() => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    dispatch(fetchDashboardSummary(params));
  }, [dispatch, startDate, endDate]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleRangeChange = (newKey, newStart, newEnd) => {
    dispatch(setDateRange({ rangeKey: newKey, startDate: newStart, endDate: newEnd }));
  };

  const overview = data?.overview || {};
  const leads = data?.leads || {};
  const deals = data?.deals || {};
  const projects = data?.projects || {};
  const tasks = data?.tasks || {};

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Date Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className={`badge ${roleBadgeClass}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                {user?.role === 'admin' ? 'admin_panel_settings' : user?.role === 'manager' ? 'manage_accounts' : 'person'}
              </span>
              <span>{roleLabel}</span>
            </span>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="status-dot pulse" />
              Phase 9 Live
            </span>
            {lastUpdated && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Enterprise CRM &amp; analytics performance intelligence dashboard.
          </p>
        </div>

        <DateRangePicker
          activeKey={rangeKey}
          customStart={startDate}
          customEnd={endDate}
          onRangeChange={handleRangeChange}
          onRefresh={loadMetrics}
          isLoading={isLoading}
        />
      </div>

      {/* Error state with retry */}
      {error && (
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--status-danger)',
            background: 'var(--status-danger-bg)',
            color: 'var(--status-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              error
            </span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Failed to retrieve dashboard analytics</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>{error}</div>
            </div>
          </div>
          <button onClick={loadMetrics} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            Retry Request
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && !data && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '42px', animation: 'spin 1s linear infinite' }}>
            sync
          </span>
          <div style={{ marginTop: '14px', fontWeight: '600' }}>Aggregating real-time database metrics...</div>
        </div>
      )}

      {/* Main Analytics Dashboard */}
      {data && (
        <>
          {/* Executive KPI Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <MetricCard
              icon="leaderboard"
              label="Total Leads"
              value={overview.totalLeads ?? 0}
              secondary={`${leads.byStatus?.qualified || 0} qualified leads`}
              color="#06b6d4"
              bg="rgba(6, 182, 212, 0.12)"
              badge="CRM"
              badgeType="info"
            />

            <MetricCard
              icon="monetization_on"
              label="Pipeline Deals"
              value={overview.totalDeals ?? 0}
              secondary={`${deals.byStatus?.won || 0} won deals`}
              color="#6366f1"
              bg="rgba(99, 102, 241, 0.12)"
              badge="Sales"
              badgeType="primary"
            />

            <MetricCard
              icon="account_balance_wallet"
              label="Total Deal Value"
              value={formatMoney(deals.totalValue || 0)}
              secondary={`${formatMoney(deals.wonValue || 0)} secured revenue`}
              color="#10b981"
              bg="rgba(16, 185, 129, 0.12)"
              badge="Revenue"
              badgeType="success"
            />

            <MetricCard
              icon="task_alt"
              label="Active Projects"
              value={projects.activeProjects ?? 0}
              secondary={`${projects.total || 0} total / ${formatMoney(projects.totalBudget || 0)}`}
              color="#ec4899"
              bg="rgba(236, 72, 153, 0.12)"
              badge="Delivery"
              badgeType="warning"
            />

            <MetricCard
              icon="checklist"
              label="Pending Tasks"
              value={(tasks.pending || 0) + (tasks.inProgress || 0)}
              secondary={`${tasks.completed || 0} completed / ${tasks.total || 0} total`}
              color="#f59e0b"
              bg="rgba(245, 158, 11, 0.12)"
              badge="Workload"
              badgeType="warning"
            />

            {tasks.overdue > 0 && (
              <MetricCard
                icon="warning"
                label="Overdue Tasks"
                value={tasks.overdue}
                secondary="Requires urgent review"
                color="#ef4444"
                bg="rgba(239, 68, 68, 0.12)"
                badge="Action Needed"
                badgeType="danger"
              />
            )}
          </div>

          {/* Section 1: Leads & Sales Pipeline Analytics */}
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-primary)' }}>
                trending_up
              </span>
              Sales &amp; Pipeline Analytics
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <LeadAnalytics leads={leads} />
              <DealAnalytics deals={deals} />
            </div>
          </div>

          {/* Section 2: Projects & Workload Analytics */}
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-primary)' }}>
                bar_chart
              </span>
              Delivery &amp; Workload Analytics
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ProjectAnalytics projects={projects} />
              <TaskAnalytics tasks={tasks} />
            </div>
          </div>

          {/* Section 3: Recent Activity & Action Hub */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Live Activity Stream */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
              <ActivityTimeline limit={8} />
            </div>

            {/* Quick Actions & Navigation Hub */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-primary)' }}>
                  apps
                </span>
                Quick Access Hub
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Link to="/leads" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#06b6d4', fontSize: '20px' }}>leaderboard</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Leads</span>
                  </div>
                </Link>

                <Link to="/deals" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#6366f1', fontSize: '20px' }}>monetization_on</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Deals</span>
                  </div>
                </Link>

                <Link to="/projects" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#ec4899', fontSize: '20px' }}>task_alt</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Projects</span>
                  </div>
                </Link>

                <Link to="/tasks" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: '20px' }}>checklist</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Tasks</span>
                  </div>
                </Link>

                <RoleGuard allowedRoles={['admin', 'manager']}>
                  <Link to="/users" style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
                    <div
                      style={{
                        padding: '14px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ color: 'var(--brand-primary)', fontSize: '20px' }}>group</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>User Management</span>
                      <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>Admin / Manager</span>
                    </div>
                  </Link>
                </RoleGuard>
              </div>

              {/* System summary */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '12px 14px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Role Scoping:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {user?.role === 'employee' ? 'Assigned Records Only' : 'Organization Wide'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
