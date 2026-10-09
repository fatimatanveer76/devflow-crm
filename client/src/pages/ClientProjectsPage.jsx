import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchPortalProjects,
  fetchPortalProjectById,
  selectPortalProjects,
  selectPortalProjectsTotal,
  selectPortalActiveProject,
  selectPortalLoading,
  selectPortalActionLoading,
  selectPortalError,
  clearActiveProject,
} from '../../features/portal/portalSlice';

export const ClientProjectsPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const projects = useSelector(selectPortalProjects);
  const total = useSelector(selectPortalProjectsTotal);
  const activeProject = useSelector(selectPortalActiveProject);
  const loading = useSelector(selectPortalLoading);
  const actionLoading = useSelector(selectPortalActionLoading);
  const error = useSelector(selectPortalError);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReqDetail, setSelectedReqDetail] = useState(null);

  useEffect(() => {
    dispatch(fetchPortalProjects({ search, status: statusFilter }));
  }, [dispatch, statusFilter]);

  // Handle URL project query param for deep linking
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId) {
      dispatch(fetchPortalProjectById(projectId));
    }
  }, [searchParams, dispatch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchPortalProjects({ search, status: statusFilter }));
  };

  const handleOpenProjectModal = (id) => {
    dispatch(fetchPortalProjectById(id));
    setSearchParams({ project: id });
  };

  const handleCloseProjectModal = () => {
    dispatch(clearActiveProject());
    setSearchParams({});
    setSelectedReqDetail(null);
  };

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
          My Projects
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
          Overview of deliverables, timeline milestones, and task progression for your assigned projects.
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
            placeholder="Search projects by name..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0 14px' }}>
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
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

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
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
          Loading your projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '42px' }}>folder_open</span>
          <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '10px' }}>No projects found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>No project assignments match your current filters.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-card table-row-hover"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => handleOpenProjectModal(proj.id)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                    {proj.name}
                  </h3>
                  {getStatusBadge(proj.status)}
                </div>

                {proj.description && (
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {proj.description}
                  </p>
                )}

                {/* Task Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                    <span>Task Progression</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {proj.completedTasks} / {proj.totalTasks} Tasks ({proj.progressPercent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '4px',
                      background: 'var(--bg-tertiary)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${proj.progressPercent}%`,
                        background: proj.progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    marginBottom: '14px',
                  }}
                >
                  <span>Target Due Date:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {formatDate(proj.due_date)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProjectModal(proj.id);
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                  Project Details &amp; Specifications
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {activeProject && (
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
          onClick={handleCloseProjectModal}
        >
          <div
            className="glass-card"
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              maxHeight: '92vh',
              overflowY: 'auto',
              width: '100%',
              maxWidth: '820px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {getStatusBadge(activeProject.status)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Priority: {activeProject.priority}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  {activeProject.name}
                </h2>
              </div>
              <button onClick={handleCloseProjectModal} className="btn btn-secondary" style={{ padding: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {/* Description */}
            {activeProject.description && (
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {activeProject.description}
              </div>
            )}

            {/* Timeline & Progress Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Start Date</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '4px' }}>{formatDate(activeProject.start_date)}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Target Due Date</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '4px' }}>{formatDate(activeProject.due_date)}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Task Completion</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '4px', color: '#10b981' }}>
                  {activeProject.completedTasks} / {activeProject.totalTasks} ({activeProject.progressPercent}%)
                </div>
              </div>
            </div>

            {/* Milestones / Tasks Breakdown */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 12px 0' }}>Project Milestones &amp; Tasks</h3>
              {(!activeProject.tasks || activeProject.tasks.length === 0) ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '12px 0' }}>No tasks assigned yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeProject.tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: '18px',
                            color: task.status === 'completed' ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          {task.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {task.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Approved Specifications */}
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#06b6d4' }}>verified</span>
                Signed-Off Specifications ({activeProject.requirements?.length || 0})
              </h3>

              {(!activeProject.requirements || activeProject.requirements.length === 0) ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '12px 0' }}>
                  No approved specifications published for this project yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeProject.requirements.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: '14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedReqDetail(req)}
                      className="table-row-hover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{req.title}</div>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', fontSize: '0.72rem', fontWeight: '700' }}>
                          v{req.version_number} &bull; {req.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {req.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Specification Detail Sub-Modal */}
      {selectedReqDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedReqDetail(null)}
        >
          <div
            className="glass-card"
            style={{ padding: '24px', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.14)', color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>
                v{selectedReqDetail.version_number} &bull; {selectedReqDetail.status}
              </span>
              <button onClick={() => setSelectedReqDetail(null)} className="btn btn-secondary" style={{ padding: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 12px 0' }}>{selectedReqDetail.title}</h3>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {selectedReqDetail.description || 'No detailed text available.'}
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Approved Date: {formatDate(selectedReqDetail.approved_at)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProjectsPage;
