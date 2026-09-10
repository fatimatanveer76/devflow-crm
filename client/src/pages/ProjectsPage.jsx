import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects, createNewProject, updateExistingProject,
  changeProjectStatus, removeProject, clearProjectsError,
  selectProjects, selectProjectsTotal, selectProjectsTotalPages,
  selectProjectsPage, selectProjectsSummary, selectProjectsLoading,
  selectProjectsActionLoading, selectProjectsError, selectProjectsActionError,
} from '../features/projects/projectsSlice';
import { selectCurrentUser } from '../features/auth/authSlice';
import { fetchLeads, selectLeads } from '../features/leads/leadsSlice';
import { fetchUsers, selectUsers } from '../features/users/usersSlice';

const PROJECT_STATUSES = [
  { key: 'planning',  label: 'Planning',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { key: 'active',    label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'on_hold',   label: 'On Hold',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'completed', label: 'Completed', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
];

const PROJECT_PRIORITIES = [
  { key: 'low',    label: 'Low',    color: '#94a3b8' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'high',   label: 'High',   color: '#f97316' },
  { key: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const STATUS_NEXT = { planning: 'active', active: 'on_hold', on_hold: 'active', completed: null, cancelled: null };

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatMoney = (amount) => {
  const n = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
};

const getStatusMeta = (key) => PROJECT_STATUSES.find((s) => s.key === key) || { label: key, color: '#94a3b8', bg: 'var(--bg-tertiary)' };
const getPriorityMeta = (key) => PROJECT_PRIORITIES.find((p) => p.key === key) || { label: key, color: '#94a3b8' };

const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
      {meta.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const meta = getPriorityMeta(priority);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600', border: `1px solid ${meta.color}40`, color: meta.color, background: `${meta.color}12`, whiteSpace: 'nowrap' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>flag</span>
      {meta.label}
    </span>
  );
};

const ModalOverlay = ({ children, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
    <div className="glass-card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', maxHeight: '90vh', overflowY: 'auto', width: '100%', maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const ProjectForm = ({ title, formData, formErrors, isAdminOrManager, isActionLoading, actionError, leads, users, onChange, onSubmit, onCancel, submitLabel, submitIcon }) => {
  const inp = (field) => ({
    width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)',
    border: `1px solid ${formErrors[field] ? 'var(--status-danger)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  });
  return (
    <form onSubmit={onSubmit} noValidate>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{title}</h2>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ padding: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
        </button>
      </div>
      {actionError && (
        <div style={{ padding: '10px 14px', marginBottom: '16px', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--status-danger)', fontSize: '0.85rem' }}>
          {actionError}
        </div>
      )}
      <div style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Project Name *</label>
          <input type="text" value={formData.name} onChange={(e) => onChange('name', e.target.value)} style={inp('name')} placeholder="e.g. Website Redesign" autoFocus />
          {formErrors.name && <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px' }}>{formErrors.name}</div>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
          <textarea value={formData.description} onChange={(e) => onChange('description', e.target.value)} rows={3} style={{ ...inp('description'), resize: 'vertical' }} placeholder="Project overview and goals..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
            <select value={formData.status} onChange={(e) => onChange('status', e.target.value)} style={inp('status')}>
              {PROJECT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Priority</label>
            <select value={formData.priority} onChange={(e) => onChange('priority', e.target.value)} style={inp('priority')}>
              {PROJECT_PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Date</label>
            <input type="date" value={formData.start_date} onChange={(e) => onChange('start_date', e.target.value)} style={inp('start_date')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>End Date</label>
            <input type="date" value={formData.end_date} onChange={(e) => onChange('end_date', e.target.value)} style={inp('end_date')} />
            {formErrors.end_date && <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px' }}>{formErrors.end_date}</div>}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Budget (USD)</label>
          <input type="number" min="0" step="0.01" value={formData.budget} onChange={(e) => onChange('budget', e.target.value)} style={inp('budget')} placeholder="0.00" />
          {formErrors.budget && <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px' }}>{formErrors.budget}</div>}
        </div>
        {leads && leads.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Linked Lead</label>
            <select value={formData.lead_id} onChange={(e) => onChange('lead_id', e.target.value)} style={inp('lead_id')}>
              <option value="">No linked lead</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name}{l.company ? ` — ${l.company}` : ''}</option>)}
            </select>
          </div>
        )}
        {isAdminOrManager && users && users.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Assigned To</label>
            <select value={formData.assigned_user_id} onChange={(e) => onChange('assigned_user_id', e.target.value)} style={inp('assigned_user_id')}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
          <textarea value={formData.notes} onChange={(e) => onChange('notes', e.target.value)} rows={2} style={{ ...inp('notes'), resize: 'vertical' }} placeholder="Internal notes..." />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ minWidth: '100px' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isActionLoading} style={{ minWidth: '140px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          {isActionLoading
            ? <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
            : <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{submitIcon}</span>}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export const ProjectsPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjects);
  const total = useSelector(selectProjectsTotal);
  const totalPages = useSelector(selectProjectsTotalPages);
  const page = useSelector(selectProjectsPage);
  const summary = useSelector(selectProjectsSummary);
  const isLoading = useSelector(selectProjectsLoading);
  const isActionLoading = useSelector(selectProjectsActionLoading);
  const error = useSelector(selectProjectsError);
  const actionError = useSelector(selectProjectsActionError);
  const leads = useSelector(selectLeads);
  const users = useSelector(selectUsers);

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const [viewMode, setViewMode] = useState('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const emptyForm = { name: '', description: '', status: 'planning', priority: 'medium', start_date: '', end_date: '', budget: '', lead_id: '', assigned_user_id: '', notes: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!leads || leads.length === 0) dispatch(fetchLeads({ limit: 100 }));
    if (isAdminOrManager && (!users || users.length === 0)) dispatch(fetchUsers({ limit: 100, isActive: true }));
  }, [dispatch, isAdminOrManager]);

  const loadProjects = useCallback(() => {
    const params = { page: currentPage, limit: viewMode === 'board' ? 100 : 15, sortBy: 'created_at', sortOrder: 'DESC' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    if (assigneeFilter && isAdminOrManager) params.assigned_user_id = assigneeFilter;
    dispatch(fetchProjects(params));
  }, [dispatch, currentPage, viewMode, debouncedSearch, statusFilter, priorityFilter, assigneeFilter, isAdminOrManager]);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { return () => dispatch(clearProjectsError()); }, [dispatch]);

  const projectsByStatus = useMemo(() => {
    const map = {};
    PROJECT_STATUSES.forEach((s) => { map[s.key] = []; });
    projects.forEach((p) => { if (map[p.status]) map[p.status].push(p); });
    return map;
  }, [projects]);

  const resetForm = () => { setFormData(emptyForm); setFormErrors({}); };
  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleOpenCreate = () => { resetForm(); setIsCreateModalOpen(true); };
  const handleOpenEdit = (project) => {
    setFormData({
      name: project.name || '', description: project.description || '',
      status: project.status || 'planning', priority: project.priority || 'medium',
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : '',
      budget: project.budget != null ? String(project.budget) : '',
      lead_id: project.lead_id || '', assigned_user_id: project.assigned_user_id || '',
      notes: project.notes || '',
    });
    setFormErrors({});
    setEditingProject(project);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) errors.name = 'Project name must be at least 2 characters.';
    if (formData.budget && (isNaN(Number(formData.budget)) || Number(formData.budget) < 0)) errors.budget = 'Budget must be a non-negative number.';
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) errors.end_date = 'End date cannot be before start date.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const p = {
      name: formData.name.trim(), description: formData.description.trim() || null,
      status: formData.status, priority: formData.priority,
      start_date: formData.start_date || null, end_date: formData.end_date || null,
      budget: formData.budget ? Number(formData.budget) : null,
      lead_id: formData.lead_id || null, notes: formData.notes.trim() || null,
    };
    if (isAdminOrManager && formData.assigned_user_id) p.assigned_user_id = formData.assigned_user_id;
    return p;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const res = await dispatch(createNewProject(buildPayload()));
    if (createNewProject.fulfilled.match(res)) { setIsCreateModalOpen(false); resetForm(); loadProjects(); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = buildPayload();
    if (isAdminOrManager) payload.assigned_user_id = formData.assigned_user_id || null;
    const res = await dispatch(updateExistingProject({ id: editingProject.id, data: payload }));
    if (updateExistingProject.fulfilled.match(res)) { setEditingProject(null); resetForm(); loadProjects(); }
  };

  const handleQuickStatus = (projectId, newStatus) => dispatch(changeProjectStatus({ id: projectId, status: newStatus }));

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    const res = await dispatch(removeProject(deletingProject.id));
    if (removeProject.fulfilled.match(res)) { setDeletingProject(null); loadProjects(); }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '32px' }}>task_alt</span>
            Projects &amp; Project Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {currentUser?.role === 'employee' ? 'Tracking your assigned project workloads and deadlines' : 'Enterprise project portfolio, delivery pipeline, and budget management'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '3px', border: '1px solid var(--border-color)' }}>
            {[{ mode: 'board', icon: 'view_kanban', label: 'Board' }, { mode: 'table', icon: 'table_rows', label: 'Table' }].map(({ mode, icon, label }) => (
              <button key={mode} className="btn" onClick={() => setViewMode(mode)} style={{ padding: '6px 12px', fontSize: '0.85rem', border: 'none', background: viewMode === mode ? 'var(--accent-primary)' : 'transparent', color: viewMode === mode ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleOpenCreate} id="btn-create-project" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            New Project
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          { icon: 'folder_open',  label: 'Total Projects', value: summary.totalProjects ?? total,        color: 'var(--accent-primary)',   bg: 'rgba(99,102,241,0.12)' },
          { icon: 'bolt',         label: 'Active',         value: summary.activeProjects ?? 0,           color: '#10b981',                 bg: 'rgba(16,185,129,0.12)' },
          { icon: 'check_circle', label: 'Completed',      value: summary.completedProjects ?? 0,        color: '#06b6d4',                 bg: 'rgba(6,182,212,0.12)'  },
          { icon: 'payments',     label: 'Total Budget',   value: formatMoney(summary.totalBudget ?? 0), color: 'var(--accent-secondary)', bg: 'rgba(139,92,246,0.12)' },
        ].map((card) => (
          <div key={card.label} className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{card.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{card.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: card.color, lineHeight: 1 }}>{isLoading ? '...' : card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', width: '100%' }} />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span></button>}
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-input" style={{ flex: '0 1 150px', fontSize: '0.875rem' }}>
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }} className="form-input" style={{ flex: '0 1 140px', fontSize: '0.875rem' }}>
          <option value="">All Priorities</option>
          {PROJECT_PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        {isAdminOrManager && (
          <select value={assigneeFilter} onChange={(e) => { setAssigneeFilter(e.target.value); setCurrentPage(1); }} className="form-input" style={{ flex: '0 1 160px', fontSize: '0.875rem' }}>
            <option value="">All Assignees</option>
            {(users || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        {(searchTerm || statusFilter || priorityFilter || assigneeFilter) && (
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setStatusFilter(''); setPriorityFilter(''); setAssigneeFilter(''); setCurrentPage(1); }} style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_alt_off</span>
            Clear
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{total} project{total !== 1 ? 's' : ''}</div>
      </div>

      {/* Error Banner */}
      {(error || actionError) && (
        <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          <span style={{ fontSize: '0.875rem' }}>{error || actionError}</span>
          <button onClick={() => dispatch(clearProjectsError())} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit' }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span></button>
        </div>
      )}

      {/* BOARD VIEW */}
      {viewMode === 'board' && (
        <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', minWidth: `${PROJECT_STATUSES.length * 280}px`, alignItems: 'flex-start' }}>
              {PROJECT_STATUSES.map((statusMeta) => {
                const colProjects = projectsByStatus[statusMeta.key] || [];
                return (
                  <div key={statusMeta.key} style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', marginBottom: '10px', borderRadius: 'var(--radius-md)', background: statusMeta.bg, border: `1px solid ${statusMeta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: statusMeta.color }}>{statusMeta.label}</span>
                      <span style={{ background: `${statusMeta.color}25`, color: statusMeta.color, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>{colProjects.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '80px' }}>
                      {colProjects.length === 0 ? (
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No projects</div>
                      ) : (
                        colProjects.map((project) => (
                          <div key={project.id} className="glass-card" style={{ padding: '14px', cursor: 'pointer', transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)', borderLeft: `3px solid ${statusMeta.color}` }}
                            onClick={() => setViewingProject(project)}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{project.name}</div>
                              <PriorityBadge priority={project.priority} />
                            </div>
                            {project.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{project.description}</div>}
                            {project.end_date && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>calendar_today</span>Due {formatDate(project.end_date)}</div>}
                            {project.budget && <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>payments</span>{formatMoney(project.budget)}</div>}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-secondary" onClick={() => handleOpenEdit(project)} style={{ flex: 1, fontSize: '0.75rem', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                              </button>
                              {STATUS_NEXT[project.status] && (
                                <button className="btn" onClick={() => handleQuickStatus(project.id, STATUS_NEXT[project.status])} disabled={isActionLoading} style={{ flex: 1, padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} title={`Move to ${STATUS_NEXT[project.status]}`}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                                </button>
                              )}
                              {(isAdminOrManager || project.created_by === currentUser?.id) && (
                                <button className="btn" onClick={() => setDeletingProject(project)} style={{ flex: 1, padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', border: 'none' }} title="Delete">
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: 0.4 }}>folder_open</span>
              <div style={{ fontSize: '1rem', marginBottom: '6px' }}>No projects found</div>
              <div style={{ fontSize: '0.85rem' }}>Create your first project to get started</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Project', 'Status', 'Priority', 'Due Date', 'Budget', 'Assigned To', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, i) => (
                  <tr key={project.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                    onClick={() => setViewingProject(project)}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{project.name}</div>
                      {project.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{project.description}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={project.status} /></td>
                    <td style={{ padding: '14px 16px' }}><PriorityBadge priority={project.priority} /></td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(project.end_date)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: '600' }}>{project.budget ? formatMoney(project.budget) : 'N/A'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{project.assignedUser?.name || (project.assigned_user_id ? 'Assigned' : 'N/A')}</td>
                    <td style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary" onClick={() => handleOpenEdit(project)} style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                        </button>
                        {(isAdminOrManager || project.created_by === currentUser?.id) && (
                          <button className="btn" onClick={() => setDeletingProject(project)} style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', border: 'none' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && totalPages > 1 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <ModalOverlay onClose={() => { setIsCreateModalOpen(false); resetForm(); }}>
          <ProjectForm title="New Project" formData={formData} formErrors={formErrors} isAdminOrManager={isAdminOrManager} isActionLoading={isActionLoading} actionError={actionError} leads={leads} users={users} onChange={handleFormChange} onSubmit={handleCreateSubmit} onCancel={() => { setIsCreateModalOpen(false); resetForm(); }} submitLabel="Create Project" submitIcon="add" />
        </ModalOverlay>
      )}

      {/* EDIT MODAL */}
      {editingProject && (
        <ModalOverlay onClose={() => { setEditingProject(null); resetForm(); }}>
          <ProjectForm title={`Edit: ${editingProject.name}`} formData={formData} formErrors={formErrors} isAdminOrManager={isAdminOrManager} isActionLoading={isActionLoading} actionError={actionError} leads={leads} users={users} onChange={handleFormChange} onSubmit={handleEditSubmit} onCancel={() => { setEditingProject(null); resetForm(); }} submitLabel="Save Changes" submitIcon="save" />
        </ModalOverlay>
      )}

      {/* VIEW MODAL */}
      {viewingProject && (
        <ModalOverlay onClose={() => setViewingProject(null)}>
          <div style={{ minWidth: '480px', maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>{viewingProject.name}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusBadge status={viewingProject.status} />
                  <PriorityBadge priority={viewingProject.priority} />
                </div>
              </div>
              <button onClick={() => setViewingProject(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { icon: 'calendar_today', label: 'Start Date',  value: formatDate(viewingProject.start_date) },
                { icon: 'event',          label: 'Due Date',    value: formatDate(viewingProject.end_date) },
                { icon: 'payments',       label: 'Budget',      value: viewingProject.budget ? formatMoney(viewingProject.budget) : 'N/A' },
                { icon: 'person',         label: 'Assigned To', value: viewingProject.assignedUser?.name || 'Unassigned' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{item.icon}</span>
                    {item.label}
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {viewingProject.description && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{viewingProject.description}</p>
              </div>
            )}
            {viewingProject.notes && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{viewingProject.notes}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-primary" onClick={() => { setViewingProject(null); handleOpenEdit(viewingProject); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                Edit Project
              </button>
              {(isAdminOrManager || viewingProject.created_by === currentUser?.id) && (
                <button className="btn" onClick={() => { setViewingProject(null); setDeletingProject(viewingProject); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', border: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  Delete
                </button>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* DELETE CONFIRM */}
      {deletingProject && (
        <ModalOverlay onClose={() => setDeletingProject(null)}>
          <div style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>delete_forever</span>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px' }}>Delete Project?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{deletingProject.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingProject(null)} style={{ minWidth: '110px' }}>Cancel</button>
              <button className="btn" onClick={handleDeleteConfirm} disabled={isActionLoading} id="btn-confirm-delete-project" style={{ minWidth: '110px', background: 'var(--status-danger)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                {isActionLoading ? <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>}
                Delete
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default ProjectsPage;
