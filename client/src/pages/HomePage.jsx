import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSystemHealth,
  selectHealthLoading,
  selectHealthError,
  fetchSystemHealth,
} from '../features/app/appSlice';

export const HomePage = () => {
  const dispatch = useDispatch();
  const health = useSelector(selectSystemHealth);
  const loading = useSelector(selectHealthLoading);
  const error = useSelector(selectHealthError);

  useEffect(() => {
    dispatch(fetchSystemHealth());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSystemHealth());
  };

  const stackItems = [
    {
      name: 'Express REST Server',
      category: 'Backend Core',
      status: 'Active',
      icon: 'dns',
      description: 'API v1 architecture with Helmet, CORS, Morgan, and centralized error handling.',
    },
    {
      name: 'PostgreSQL & Sequelize',
      category: 'Database ORM',
      status: health?.database?.status === 'connected' ? 'Connected' : 'Configured',
      icon: 'database',
      description: 'Connection pool & ORM handshake configured. Business models reserved for Phase 2.',
    },
    {
      name: 'React 18 + Vite',
      category: 'Frontend Core',
      status: 'Active',
      icon: 'code',
      description: 'Fast HMR build system with responsive CSS design tokens and SPA routing.',
    },
    {
      name: 'Redux Toolkit',
      category: 'State Management',
      status: 'Active',
      icon: 'hub',
      description: 'Global store with root reducer and app state slice.',
    },
    {
      name: 'Centralized Axios',
      category: 'HTTP Client',
      status: 'Active',
      icon: 'sync_alt',
      description: 'Pre-configured base URL (/api/v1), timeouts, and standard response interceptors.',
    },
    {
      name: 'Google Material Icons',
      category: 'Design System',
      status: 'Active',
      icon: 'category',
      description: 'Standardized iconography adhering to project specification.',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-info">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
            <span>Phase 1 — Technical Foundation</span>
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>
          DevFlow CRM Architecture Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px' }}>
          Welcome to the foundational environment of DevFlow CRM. All core architectural systems,
          standardized API schemas, routing pipelines, and state stores have been verified.
        </p>
      </div>

      {/* Live System Health Section */}
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--status-info-bg)',
                color: 'var(--status-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Live System Health Probe</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Direct probe targeting <code>GET /api/v1/health</code>
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                animation: loading ? 'pulse-dot 1s infinite' : 'none',
              }}
            >
              refresh
            </span>
            <span>{loading ? 'Probing...' : 'Re-check Status'}</span>
          </button>
        </div>

        {error ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span className="material-symbols-outlined">error</span>
            <div>
              <strong>Backend Connection Unavailable:</strong> {error}
              <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>
                Ensure the backend Express server is running on port 5000.
              </div>
            </div>
          </div>
        ) : health ? (
          <div className="grid-3" style={{ marginTop: '16px' }}>
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                SERVER STATUS
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="status-dot pulse"></span>
                <span>{health.server?.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Uptime: {health.uptime}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                ENVIRONMENT
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                {health.environment?.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Timestamp: {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                DATABASE HANDSHAKE
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color:
                    health.database?.status === 'connected'
                      ? 'var(--status-success)'
                      : 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {health.database?.status === 'connected' ? 'check_circle' : 'pending'}
                </span>
                <span>{health.database?.status?.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Dialect: {health.database?.dialect} ({health.database?.database})
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Initializing health check probe...
          </div>
        )}
      </div>

      {/* Core Architectural Components */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: '600' }}>
        Verified Phase 1 Foundations
      </h2>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {stackItems.map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span className="badge badge-success">{item.status}</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '2px' }}>
              {item.name}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-secondary)',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              {item.category}
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Next Phase Notice */}
      <div
        style={{
          padding: '20px 24px',
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '28px', color: 'var(--status-warning)' }}
        >
          lock_clock
        </span>
        <div>
          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
            Awaiting Phase 2: Database & Sequelize Models
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Per architectural guidelines, business entities (Users, Leads, Deals, Projects, Invoices, Tickets)
            are intentionally locked until Phase 2 is initiated.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
