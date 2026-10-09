import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPortalRequirements,
  fetchPortalRequirementById,
  selectPortalRequirements,
  selectPortalActiveRequirement,
  selectPortalLoading,
  selectPortalActionLoading,
  selectPortalError,
  clearActiveRequirement,
} from '../../features/portal/portalSlice';

export const ClientRequirementsPage = () => {
  const dispatch = useDispatch();
  const requirements = useSelector(selectPortalRequirements);
  const activeReq = useSelector(selectPortalActiveRequirement);
  const loading = useSelector(selectPortalLoading);
  const actionLoading = useSelector(selectPortalActionLoading);
  const error = useSelector(selectPortalError);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPortalRequirements({ search, type: typeFilter }));
  }, [dispatch, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchPortalRequirements({ search, type: typeFilter }));
  };

  const handleOpenDetail = (id) => {
    dispatch(fetchPortalRequirementById(id));
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    dispatch(clearActiveRequirement());
    setDetailModalOpen(false);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const inputStyle = {
    padding: '10px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
          Approved Specifications
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
          Signed-off and published functional, technical, and security specifications for your active projects.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 260px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search specifications by title or description..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0 14px' }}>
            Search
          </button>
        </form>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Types</option>
          <option value="functional">Functional</option>
          <option value="non_functional">Non-Functional</option>
          <option value="technical">Technical</option>
          <option value="business">Business</option>
          <option value="security">Security</option>
          <option value="ui_ux">UI/UX</option>
          <option value="integration">Integration</option>
        </select>
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

      {/* Requirements List / Grid */}
      {loading && requirements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(6, 182, 212, 0.2)',
              borderTopColor: '#06b6d4',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          Loading specifications...
        </div>
      ) : requirements.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#06b6d4' }}>verified</span>
          <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '10px' }}>No specifications found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Only specifications that have been officially approved or published by the delivery team appear in this portal.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {requirements.map((req) => (
            <div
              key={req.id}
              className="glass-card table-row-hover"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => handleOpenDetail(req.id)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: req.status === 'published' ? 'rgba(6, 182, 212, 0.14)' : 'rgba(16, 185, 129, 0.14)',
                        color: req.status === 'published' ? '#06b6d4' : '#10b981',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}
                    >
                      {req.status}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                      }}
                    >
                      v{req.version_number}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {req.type}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                  {req.title}
                </h3>

                {req.description && (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {req.description}
                  </p>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  <span>Project:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {req.project?.name || 'Assigned Project'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(req.id);
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                  Inspect Full Specification
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Specification Detail & History Modal */}
      {detailModalOpen && activeReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={handleCloseDetail}
        >
          <div
            className="glass-card"
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              maxHeight: '92vh',
              overflowY: 'auto',
              width: '100%',
              maxWidth: '760px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: activeReq.status === 'published' ? 'rgba(6, 182, 212, 0.14)' : 'rgba(16, 185, 129, 0.14)',
                      color: activeReq.status === 'published' ? '#06b6d4' : '#10b981',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeReq.status}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '700' }}>
                    v{activeReq.version_number}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    Type: {activeReq.type} &bull; Priority: {activeReq.priority}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  {activeReq.title}
                </h2>
              </div>
              <button onClick={handleCloseDetail} className="btn btn-secondary" style={{ padding: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Project association tag */}
            {activeReq.project && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#06b6d4' }}>task_alt</span>
                Project: <strong>{activeReq.project.name}</strong>
              </div>
            )}

            {/* Specification Body */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {activeReq.description || 'No detailed specifications recorded.'}
            </div>

            {/* Version Snapshot Ledger */}
            {activeReq.versions && activeReq.versions.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 12px 0' }}>
                  Audited Revision History ({activeReq.versions.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeReq.versions.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                          Version {v.version_number} &bull; {v.status}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {formatDate(v.created_at)}
                        </span>
                      </div>
                      {v.change_summary && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          "{v.change_summary}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientRequirementsPage;
