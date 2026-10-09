import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRequirements,
  fetchRequirementById,
  createNewRequirement,
  updateExistingRequirement,
  changeRequirementStatus,
  approveRequirementAction,
  rejectRequirementAction,
  publishRequirementAction,
  removeRequirement,
  setFilters,
  clearFilters,
  setPage,
  selectRequirements,
  selectTotalRequirements,
  selectActiveRequirement,
  selectVersionHistory,
  selectRequirementsLoading,
  selectRequirementsActionLoading,
  selectRequirementsError,
  selectRequirementsFilters,
  selectRequirementsPagination,
} from '../features/requirements/requirementsSlice';
import { selectCurrentUser } from '../features/auth/authSlice';
import { fetchProjects, selectProjects } from '../features/projects/projectsSlice';
import { fetchDeals, selectDeals } from '../features/deals/dealsSlice';

const REQUIREMENT_STATUSES = [
  { key: 'draft', label: 'Draft', color: '#94a3b8', bg: 'rgba(148,163,184,0.14)' },
  { key: 'in_review', label: 'In Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  { key: 'approved', label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  { key: 'published', label: 'Published', color: '#06b6d4', bg: 'rgba(6,182,212,0.14)' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  { key: 'archived', label: 'Archived', color: '#64748b', bg: 'rgba(100,116,139,0.14)' },
];

const REQUIREMENT_PRIORITIES = [
  { key: 'low', label: 'Low', color: '#94a3b8' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'high', label: 'High', color: '#f97316' },
  { key: 'critical', label: 'Critical', color: '#ef4444' },
];

const REQUIREMENT_TYPES = [
  { key: 'functional', label: 'Functional' },
  { key: 'non_functional', label: 'Non-Functional' },
  { key: 'technical', label: 'Technical' },
  { key: 'business', label: 'Business' },
  { key: 'ui_ux', label: 'UI/UX' },
  { key: 'security', label: 'Security' },
  { key: 'integration', label: 'Integration' },
];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusMeta = (key) =>
  REQUIREMENT_STATUSES.find((s) => s.key === key || (key === 'under_review' && s.key === 'in_review')) || {
    label: key,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.14)',
  };

const getPriorityMeta = (key) =>
  REQUIREMENT_PRIORITIES.find((p) => p.key === key) || { label: key, color: '#94a3b8' };

const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);
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
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: meta.color,
        }}
      />
      {meta.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const meta = getPriorityMeta(priority);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.72rem',
        fontWeight: '600',
        border: `1px solid ${meta.color}40`,
        color: meta.color,
        background: `${meta.color}14`,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
        flag
      </span>
      {meta.label}
    </span>
  );
};

const VersionBadge = ({ versionNumber }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      padding: '2px 7px',
      borderRadius: '8px',
      fontSize: '0.72rem',
      fontWeight: '700',
      background: 'rgba(99, 102, 241, 0.14)',
      color: 'var(--accent-primary)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      whiteSpace: 'nowrap',
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
      history
    </span>
    v{versionNumber || 1}
  </span>
);

const ModalOverlay = ({ children, onClose }) => (
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
    onClick={onClose}
  >
    <div
      className="glass-card"
      style={{
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        maxHeight: '92vh',
        overflowY: 'auto',
        width: '100%',
        maxWidth: '720px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export const RequirementsPage = () => {
  const dispatch = useDispatch();
  const requirements = useSelector(selectRequirements);
  const total = useSelector(selectTotalRequirements);
  const activeReq = useSelector(selectActiveRequirement);
  const versionHistory = useSelector(selectVersionHistory);
  const loading = useSelector(selectRequirementsLoading);
  const actionLoading = useSelector(selectRequirementsActionLoading);
  const error = useSelector(selectRequirementsError);
  const filters = useSelector(selectRequirementsFilters);
  const pagination = useSelector(selectRequirementsPagination);
  const currentUser = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjects);
  const deals = useSelector(selectDeals);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canApproveOrPublish = isAdmin || isManager;

  // Local state for modals and forms
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    project_id: '',
    deal_id: '',
    tags: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    tags: '',
    change_summary: '',
  });

  const [rejectionReason, setRejectionReason] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchRequirements(filters));
    dispatch(fetchProjects());
    dispatch(fetchDeals());
  }, [dispatch]);

  // Handle filter changes with server query
  const handleFilterChange = (key, val) => {
    const updated = { ...filters, [key]: val };
    dispatch(setFilters({ [key]: val }));
    dispatch(fetchRequirements(updated));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    dispatch(fetchRequirements({}));
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const counts = { total, draft: 0, in_review: 0, approved: 0, published: 0 };
    requirements.forEach((r) => {
      if (r.status === 'draft') counts.draft++;
      else if (r.status === 'in_review' || r.status === 'under_review') counts.in_review++;
      else if (r.status === 'approved') counts.approved++;
      else if (r.status === 'published') counts.published++;
    });
    return counts;
  }, [requirements, total]);

  // View details
  const handleOpenDetail = (id) => {
    dispatch(fetchRequirementById(id));
    setEditMode(false);
    setActiveTab('overview');
    setDetailModalOpen(true);
  };

  // Populate edit form when active requirement changes
  useEffect(() => {
    if (activeReq) {
      setEditFormData({
        title: activeReq.title || '',
        description: activeReq.description || '',
        type: activeReq.type || 'functional',
        priority: activeReq.priority || 'medium',
        tags: Array.isArray(activeReq.tags) ? activeReq.tags.join(', ') : '',
        change_summary: '',
      });
    }
  }, [activeReq]);

  // Handle Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      priority: formData.priority,
      project_id: formData.project_id || null,
      deal_id: formData.deal_id || null,
      tags: tagsArray,
    };

    const res = await dispatch(createNewRequirement(payload));
    if (!res.error) {
      setCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'functional',
        priority: 'medium',
        project_id: '',
        deal_id: '',
        tags: '',
      });
      setFormErrors({});
      dispatch(fetchRequirements(filters));
    }
  };

  // Handle Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!activeReq) return;

    const tagsArray = editFormData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: editFormData.title.trim(),
      description: editFormData.description.trim() || null,
      type: editFormData.type,
      priority: editFormData.priority,
      tags: tagsArray,
      change_summary: editFormData.change_summary.trim() || 'Specification revision.',
    };

    const res = await dispatch(
      updateExistingRequirement({ id: activeReq.id, data: payload })
    );

    if (!res.error) {
      setEditMode(false);
      dispatch(fetchRequirementById(activeReq.id));
      dispatch(fetchRequirements(filters));
    }
  };

  // Status transitions
  const handleStatusTransition = async (newStatus) => {
    if (!activeReq) return;
    const res = await dispatch(
      changeRequirementStatus({ id: activeReq.id, status: newStatus })
    );
    if (!res.error) {
      dispatch(fetchRequirementById(activeReq.id));
      dispatch(fetchRequirements(filters));
    }
  };

  const handleApprove = async () => {
    if (!activeReq) return;
    const res = await dispatch(approveRequirementAction(activeReq.id));
    if (!res.error) {
      dispatch(fetchRequirementById(activeReq.id));
      dispatch(fetchRequirements(filters));
    }
  };

  const handleRejectPrompt = () => {
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!activeReq || !rejectionReason.trim()) return;
    const res = await dispatch(
      rejectRequirementAction({ id: activeReq.id, rejection_reason: rejectionReason.trim() })
    );
    if (!res.error) {
      setRejectModalOpen(false);
      dispatch(fetchRequirementById(activeReq.id));
      dispatch(fetchRequirements(filters));
    }
  };

  const handlePublish = async () => {
    if (!activeReq) return;
    const res = await dispatch(publishRequirementAction(activeReq.id));
    if (!res.error) {
      dispatch(fetchRequirementById(activeReq.id));
      dispatch(fetchRequirements(filters));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this requirement specification?')) {
      await dispatch(removeRequirement(id));
      if (detailModalOpen && activeReq?.id === id) {
        setDetailModalOpen(false);
      }
      dispatch(fetchRequirements(filters));
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '30px', color: 'var(--accent-primary)' }}
            >
              inventory_2
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
              Requirement Vault
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            Enterprise specification repository with append-only version control, change auditing, and lifecycle sign-offs.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              type: 'functional',
              priority: 'medium',
              project_id: '',
              deal_id: '',
              tags: '',
            });
            setFormErrors({});
            setCreateModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          New Requirement
        </button>
      </div>

      {/* Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Specifications
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '6px' }}>{metrics.total}</div>
        </div>

        <div className="glass-card" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
            Draft
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#94a3b8', marginTop: '6px' }}>
            {metrics.draft}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '600', textTransform: 'uppercase' }}>
            In Review
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b', marginTop: '6px' }}>
            {metrics.in_review}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', textTransform: 'uppercase' }}>
            Approved
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '6px' }}>
            {metrics.approved}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: '600', textTransform: 'uppercase' }}>
            Published
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#06b6d4', marginTop: '6px' }}>
            {metrics.published}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by requirement title or description..."
            style={inputStyle}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Statuses</option>
          {REQUIREMENT_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Types</option>
          {REQUIREMENT_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Priorities</option>
          {REQUIREMENT_PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>

        {(filters.search || filters.status || filters.type || filters.priority) && (
          <button
            onClick={handleClearFilters}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 12px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              filter_alt_off
            </span>
            Reset
          </button>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
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

      {/* Main Table Content */}
      <div className="glass-card" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {loading && requirements.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.15)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            Loading requirement vault...
          </div>
        ) : requirements.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '42px', color: 'var(--text-muted)' }}>
              folder_open
            </span>
            <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '8px' }}>
              No requirements found
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Create a new requirement specification or adjust your search filters.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '14px 16px' }}>Requirement</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Version</th>
                  <th style={{ padding: '14px 16px' }}>Type &amp; Priority</th>
                  <th style={{ padding: '14px 16px' }}>Associated Entity</th>
                  <th style={{ padding: '14px 16px' }}>Author / Approver</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background var(--transition-fast)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleOpenDetail(req.id)}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '14px 16px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{req.title}</div>
                      {req.description && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {req.description}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={req.status} />
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <VersionBadge versionNumber={req.version_number} />
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {req.type}
                        </span>
                        <PriorityBadge priority={req.priority} />
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {req.project ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '0.8rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            task_alt
                          </span>
                          {req.project.name}
                        </div>
                      ) : req.deal ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            monetization_on
                          </span>
                          {req.deal.title}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Global</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {req.creator?.name || 'Staff User'}
                      </div>
                      {req.approver && (
                        <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
                          Approved by {req.approver.name}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenDetail(req.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          title="View Details and History"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            visibility
                          </span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Delete Requirement"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          <button
            onClick={() => {
              const prev = Math.max(1, pagination.page - 1);
              dispatch(setPage(prev));
              dispatch(fetchRequirements({ ...filters, page: prev }));
            }}
            disabled={pagination.page <= 1}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => {
              const next = Math.min(pagination.totalPages, pagination.page + 1);
              dispatch(setPage(next));
              dispatch(fetchRequirements({ ...filters, page: next }));
            }}
            disabled={pagination.page >= pagination.totalPages}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Requirement Modal */}
      {createModalOpen && (
        <ModalOverlay onClose={() => setCreateModalOpen(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '22px' }}>
                post_add
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Create Requirement Specification</h2>
            </div>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary"
              style={{ padding: '6px', lineHeight: 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                close
              </span>
            </button>
          </div>

          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    ...inputStyle,
                    borderColor: formErrors.title ? 'var(--status-danger)' : 'var(--border-color)',
                  }}
                  placeholder="e.g. Multi-Factor Authentication with Biometric Support"
                  autoFocus
                />
                {formErrors.title && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px' }}>
                    {formErrors.title}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                  Description / Specifications
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Detail functional requirements, edge cases, acceptance criteria..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Requirement Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={inputStyle}
                  >
                    {REQUIREMENT_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={inputStyle}
                  >
                    {REQUIREMENT_PRIORITIES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Attach to Project (Optional)
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">None / Standalone</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Attach to Deal (Optional)
                  </label>
                  <select
                    value={formData.deal_id}
                    onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">None / Standalone</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g. backend, security, api, phase-7"
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {actionLoading ? 'Creating...' : 'Create Specification'}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* Requirement Detail & Audit Modal */}
      {detailModalOpen && activeReq && (
        <ModalOverlay onClose={() => setDetailModalOpen(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={activeReq.status} />
                <VersionBadge versionNumber={activeReq.version_number} />
                <PriorityBadge priority={activeReq.priority} />
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {activeReq.type}
                </span>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginTop: '8px', marginBottom: 0 }}>
                {activeReq.title}
              </h2>
            </div>

            <button
              onClick={() => setDetailModalOpen(false)}
              className="btn btn-secondary"
              style={{ padding: '6px', lineHeight: 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                close
              </span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => {
                setActiveTab('overview');
                setEditMode(false);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Overview &amp; Workflow
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setEditMode(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                history_edu
              </span>
              Version History ({versionHistory.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && !editMode && (
            <div>
              {/* Rejection Alert */}
              {activeReq.status === 'rejected' && activeReq.rejection_reason && (
                <div
                  style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>Rejection Reason:</div>
                  <div>{activeReq.rejection_reason}</div>
                </div>
              )}

              {/* Description Body */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Specification Content
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {activeReq.description || 'No detailed specification provided.'}
                </div>
              </div>

              {/* Tags & Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                    Created By
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    {activeReq.creator?.name || 'Staff User'} on {formatDate(activeReq.created_at)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                    Approval Status
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    {activeReq.approver ? (
                      <span style={{ color: '#10b981' }}>
                        Approved by {activeReq.approver.name} on {formatDate(activeReq.approved_at)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Pending approval</span>
                    )}
                  </div>
                </div>
              </div>

              {activeReq.tags && activeReq.tags.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                    Tags
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {activeReq.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifecycle Actions Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Edit button */}
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      edit
                    </span>
                    Edit (New Version)
                  </button>

                  {/* Submit for review (Draft / Rejected -> In Review) */}
                  {(activeReq.status === 'draft' || activeReq.status === 'rejected') && (
                    <button
                      onClick={() => handleStatusTransition('in_review')}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ color: '#f59e0b', borderColor: '#f59e0b40', fontSize: '0.8rem' }}
                    >
                      Submit for Review
                    </button>
                  )}

                  {/* Approvals (Admin/Manager only when in_review) */}
                  {canApproveOrPublish &&
                    (activeReq.status === 'in_review' || activeReq.status === 'under_review') && (
                      <>
                        <button
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="btn btn-primary"
                          style={{
                            background: '#10b981',
                            borderColor: '#10b981',
                            fontSize: '0.8rem',
                          }}
                        >
                          Approve Requirement
                        </button>
                        <button
                          onClick={handleRejectPrompt}
                          disabled={actionLoading}
                          className="btn btn-danger"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                  {/* Publish (Admin/Manager only when approved) */}
                  {canApproveOrPublish && activeReq.status === 'approved' && (
                    <button
                      onClick={handlePublish}
                      disabled={actionLoading}
                      className="btn btn-primary"
                      style={{ background: '#06b6d4', borderColor: '#06b6d4', fontSize: '0.8rem' }}
                    >
                      Publish Specification
                    </button>
                  )}

                  {/* Archive */}
                  {activeReq.status !== 'archived' && (
                    <button
                      onClick={() => handleStatusTransition('archived')}
                      disabled={actionLoading}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      Archive
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(activeReq.id)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* EDIT FORM (Creates a new immutable version snapshot) */}
          {activeTab === 'overview' && editMode && (
            <form onSubmit={handleUpdateSubmit}>
              <div
                style={{
                  padding: '10px 14px',
                  marginBottom: '16px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                }}
              >
                Saving these changes will create an append-only snapshot of <strong>v{activeReq.version_number}</strong> and increment this specification to <strong>v{activeReq.version_number + 1}</strong>.
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                      Type
                    </label>
                    <select
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      style={inputStyle}
                    >
                      {REQUIREMENT_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                      Priority
                    </label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      style={inputStyle}
                    >
                      {REQUIREMENT_PRIORITIES.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={editFormData.tags}
                    onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                    Change Summary (Audit Log Note) *
                  </label>
                  <input
                    type="text"
                    value={editFormData.change_summary}
                    onChange={(e) => setEditFormData({ ...editFormData, change_summary: e.target.value })}
                    placeholder="e.g. Added JWT token expiration requirements"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Saving...' : `Save & Bump to v${activeReq.version_number + 1}`}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: VERSION HISTORY (APPEND-ONLY) */}
          {activeTab === 'history' && (
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                Immutable snapshot ledger. Every revision and status change is permanently archived for compliance.
              </div>

              {versionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No prior version snapshots recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {versionHistory.map((ver) => (
                    <div
                      key={ver.id}
                      style={{
                        padding: '14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <VersionBadge versionNumber={ver.version_number} />
                          <StatusBadge status={ver.status} />
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{ver.title}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(ver.created_at)}
                        </span>
                      </div>

                      {ver.change_summary && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--accent-primary)',
                            background: 'rgba(99, 102, 241, 0.08)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginBottom: '6px',
                          }}
                        >
                          Change: {ver.change_summary}
                        </div>
                      )}

                      {ver.description && (
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.4',
                            maxHeight: '80px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {ver.description}
                        </div>
                      )}

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Snapshot by: {ver.author?.name || 'Staff User'} ({ver.author?.email || 'N/A'})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalOverlay>
      )}

      {/* Rejection Explanation Prompt Modal */}
      {rejectModalOpen && (
        <ModalOverlay onClose={() => setRejectModalOpen(false)}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--status-danger)', margin: 0 }}>
              Reject Requirement Specification
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Please provide a clear reason for the rejection so the author can address deficiencies.
            </p>
          </div>

          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Explain why this specification is rejected and required changes..."
            style={{ ...inputStyle, resize: 'vertical', marginBottom: '16px' }}
            autoFocus
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setRejectModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim() || actionLoading}
              className="btn btn-danger"
            >
              Confirm Rejection
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default RequirementsPage;
