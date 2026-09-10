import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTasks,
  createNewTask,
  updateExistingTask,
  changeTaskStatus,
  removeTask,
  clearTasksError,
  selectTasks,
  selectTasksTotal,
  selectTasksTotalPages,
  selectTasksPage,
  selectTasksSummary,
  selectTasksLoading,
  selectTasksActionLoading,
  selectTasksError,
  selectTasksActionError,
} from '../features/tasks/tasksSlice';
import { selectCurrentUser } from '../features/auth/authSlice';
import { fetchUsers, selectUsers } from '../features/users/usersSlice';
import { fetchLeads, selectLeads } from '../features/leads/leadsSlice';
import { fetchProjects, selectProjects } from '../features/projects/projectsSlice';
import { NotesSection } from '../components/notes/NotesSection';
import { ActivityTimeline } from '../components/activities/ActivityTimeline';

const TASK_STATUSES = [
  { key: 'pending',     label: 'Pending',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'completed',   label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const TASK_PRIORITIES = [
  { key: 'low',    label: 'Low',    color: '#94a3b8' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'high',   label: 'High',   color: '#f97316' },
  { key: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const formatDate = (d) => {
  if (!d) return 'No due date';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed' || status === 'cancelled') return false;
  return new Date(dueDate) < new Date();
};

const getStatusMeta = (key) => TASK_STATUSES.find((s) => s.key === key) || { label: key, color: '#94a3b8', bg: 'var(--bg-tertiary)' };
const getPriorityMeta = (key) => TASK_PRIORITIES.find((p) => p.key === key) || { label: key, color: '#94a3b8' };

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

const TaskForm = ({ title, formData, formErrors, isAdminOrManager, isActionLoading, actionError, users, leads, projects, onChange, onSubmit, onCancel, submitLabel, submitIcon }) => {
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Task Title *</label>
          <input type="text" value={formData.title} onChange={(e) => onChange('title', e.target.value)} style={inp('title')} placeholder="e.g. Follow up on proposal contract" autoFocus />
          {formErrors.title && <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '4px' }}>{formErrors.title}</div>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
          <textarea value={formData.description} onChange={(e) => onChange('description', e.target.value)} rows={3} style={{ ...inp('description'), resize: 'vertical' }} placeholder="Provide relevant details or steps..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
            <select value={formData.status} onChange={(e) => onChange('status', e.target.value)} style={inp('status')}>
              {TASK_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Priority</label>
            <select value={formData.priority} onChange={(e) => onChange('priority', e.target.value)} style={inp('priority')}>
              {TASK_PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Due Date</label>
            <input type="date" value={formData.due_date} onChange={(e) => onChange('due_date', e.target.value)} style={inp('due_date')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Assigned Team Member</label>
            <select value={formData.assigned_user_id} onChange={(e) => onChange('assigned_user_id', e.target.value)} style={inp('assigned_user_id')} disabled={!isAdminOrManager}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Related Lead</label>
            <select value={formData.lead_id} onChange={(e) => onChange('lead_id', e.target.value)} style={inp('lead_id')}>
              <option value="">None</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Related Project</label>
            <select value={formData.project_id} onChange={(e) => onChange('project_id', e.target.value)} style={inp('project_id')}>
              <option value="">None</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={isActionLoading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{submitIcon}</span>
          {isActionLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export const TasksPage = () => {
  const dispatch = useDispatch();
  const tasks = useSelector(selectTasks);
  const total = useSelector(selectTasksTotal);
  const totalPages = useSelector(selectTasksTotalPages);
  const page = useSelector(selectTasksPage);
  const summary = useSelector(selectTasksSummary);
  const isLoading = useSelector(selectTasksLoading);
  const isActionLoading = useSelector(selectTasksActionLoading);
  const error = useSelector(selectTasksError);
  const actionError = useSelector(selectTasksActionError);

  const currentUser = useSelector(selectCurrentUser);
  const users = useSelector(selectUsers);
  const leads = useSelector(selectLeads);
  const projects = useSelector(selectProjects);

  const isAdmin = currentUser?.role === 'admin';
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailsTask, setDetailsTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const defaultFormData = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    assigned_user_id: '',
    lead_id: '',
    project_id: '',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});

  const loadTasks = useCallback(() => {
    const params = { page, limit: 30 };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    if (assigneeFilter) params.assigned_user_id = assigneeFilter;
    dispatch(fetchTasks(params));
  }, [dispatch, page, search, statusFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (users.length === 0 && isAdminOrManager) dispatch(fetchUsers());
    if (leads.length === 0) dispatch(fetchLeads({ limit: 50 }));
    if (projects.length === 0) dispatch(fetchProjects({ limit: 50 }));
  }, [dispatch, users.length, leads.length, projects.length, isAdminOrManager]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title || formData.title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    dispatch(clearTasksError());
    setIsCreateOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.substring(0, 10) : '',
      assigned_user_id: task.assigned_user_id || '',
      lead_id: task.lead_id || '',
      project_id: task.project_id || '',
    });
    setFormErrors({});
    dispatch(clearTasksError());
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...formData };
    if (!payload.due_date) delete payload.due_date;
    if (!payload.assigned_user_id) delete payload.assigned_user_id;
    if (!payload.lead_id) delete payload.lead_id;
    if (!payload.project_id) delete payload.project_id;

    const res = await dispatch(createNewTask(payload));
    if (!res.error) {
      setIsCreateOpen(false);
      loadTasks();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...formData };
    if (!payload.due_date) payload.due_date = null;
    if (!payload.assigned_user_id) payload.assigned_user_id = null;
    if (!payload.lead_id) payload.lead_id = null;
    if (!payload.project_id) payload.project_id = null;

    const res = await dispatch(updateExistingTask({ id: editingTask.id, data: payload }));
    if (!res.error) {
      setEditingTask(null);
      if (detailsTask?.id === editingTask.id) {
        setDetailsTask(res.payload);
      }
      loadTasks();
    }
  };

  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await dispatch(changeTaskStatus({ id: task.id, status: nextStatus }));
    loadTasks();
  };

  const handleDeleteTask = async (id) => {
    await dispatch(removeTask(id));
    setDeletingTaskId(null);
    if (detailsTask?.id === id) setDetailsTask(null);
    loadTasks();
  };

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const map = { pending: [], in_progress: [], completed: [], cancelled: [] };
    tasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--brand-primary)' }}>
              task_alt
            </span>
            Tasks & Activities
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Track, assign, and manage team deliverables, actionable milestones, and audit history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'list' ? 'var(--brand-primary)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_list</span>
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'board' ? 'var(--brand-primary)' : 'transparent',
                color: viewMode === 'board' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>view_kanban</span>
              Board
            </button>
          </div>

          <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            New Task
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>TOTAL TASKS</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--brand-primary)' }}>checklist</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px' }}>{summary?.totalTasks || 0}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>PENDING</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6366f1' }}>pending</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#6366f1' }}>{summary?.pendingTasks || 0}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>IN PROGRESS</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#f59e0b' }}>sync</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#f59e0b' }}>{summary?.inProgressTasks || 0}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>COMPLETED</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#10b981' }}>check_circle</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#10b981' }}>{summary?.completedTasks || 0}</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
            <span>OVERDUE</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ef4444' }}>warning</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '8px', color: '#ef4444' }}>{summary?.overdueTasks || 0}</div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '18px' }}>
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Priorities</option>
          {TASK_PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>

        {isAdminOrManager && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        )}
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }}>sync</span>
          <div style={{ marginTop: '12px' }}>Loading tasks...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 'var(--radius-lg)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-tertiary)' }}>task</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '16px' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
            Create a task or adjust your active search and filters.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: '18px' }}>
            Create First Task
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 16px', width: '40px' }}></th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Task</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Priority</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Assignee</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Due Date</th>
                  <th style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Related Entity</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const overdue = isOverdue(task.due_date, task.status);
                  const isDone = task.status === 'completed';

                  return (
                    <tr
                      key={task.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isDone ? 'rgba(16,185,129,0.03)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleComplete(task)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          title={isDone ? 'Mark pending' : 'Mark completed'}
                        />
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div
                          style={{
                            fontWeight: '600',
                            color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            cursor: 'pointer',
                          }}
                          onClick={() => setDetailsTask(task)}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={task.status} />
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <PriorityBadge priority={task.priority} />
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '0.8rem', color: task.assignedUser ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {task.assignedUser?.name || task.assignedUser?.email || 'Unassigned'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '0.8rem', color: overdue ? 'var(--status-danger)' : 'var(--text-secondary)', fontWeight: overdue ? '700' : 'normal' }}>
                          {formatDate(task.due_date)} {overdue ? '(Overdue)' : ''}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {task.project ? (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                            Project: {task.project.name}
                          </span>
                        ) : task.lead ? (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>
                            Lead: {task.lead.name}
                          </span>
                        ) : task.deal ? (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                            Deal: {task.deal.title}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setDetailsTask(task)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="View details & notes"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                          </button>
                          <button
                            onClick={() => openEditModal(task)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Edit task"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeletingTaskId(task.id)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--status-danger)' }}
                              title="Delete task"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Board / Kanban View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
          {TASK_STATUSES.map((column) => {
            const columnTasks = tasksByStatus[column.key] || [];

            return (
              <div
                key={column.key}
                className="glass-card"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--bg-secondary)',
                  borderTop: `3px solid ${column.color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color }}></span>
                    {column.label}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: column.bg, color: column.color, padding: '2px 8px', borderRadius: '12px' }}>
                    {columnTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '150px' }}>
                  {columnTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-tertiary)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      No {column.label.toLowerCase()} tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const overdue = isOverdue(task.due_date, task.status);

                      return (
                        <div
                          key={task.id}
                          className="glass-card"
                          style={{
                            padding: '14px',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            cursor: 'pointer',
                          }}
                          onClick={() => setDetailsTask(task)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <PriorityBadge priority={task.priority} />
                            {overdue && (
                              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--status-danger)' }}>
                                OVERDUE
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                            {task.title}
                          </div>

                          {task.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {task.description}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <span>{task.assignedUser?.name || 'Unassigned'}</span>
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <ModalOverlay onClose={() => setIsCreateOpen(false)}>
          <TaskForm
            title="Create New Task"
            formData={formData}
            formErrors={formErrors}
            isAdminOrManager={isAdminOrManager}
            isActionLoading={isActionLoading}
            actionError={actionError}
            users={users}
            leads={leads}
            projects={projects}
            onChange={handleFieldChange}
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateOpen(false)}
            submitLabel="Create Task"
            submitIcon="add_task"
          />
        </ModalOverlay>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <ModalOverlay onClose={() => setEditingTask(null)}>
          <TaskForm
            title="Edit Task"
            formData={formData}
            formErrors={formErrors}
            isAdminOrManager={isAdminOrManager}
            isActionLoading={isActionLoading}
            actionError={actionError}
            users={users}
            leads={leads}
            projects={projects}
            onChange={handleFieldChange}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingTask(null)}
            submitLabel="Update Task"
            submitIcon="save"
          />
        </ModalOverlay>
      )}

      {/* Details & Activities Modal */}
      {detailsTask && (
        <ModalOverlay onClose={() => setDetailsTask(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <StatusBadge status={detailsTask.status} />
                  <PriorityBadge priority={detailsTask.priority} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{detailsTask.title}</h2>
              </div>
              <button onClick={() => setDetailsTask(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {detailsTask.description && (
              <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                {detailsTask.description}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Assigned to:</span>{' '}
                <strong>{detailsTask.assignedUser?.name || detailsTask.assignedUser?.email || 'Unassigned'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Due date:</span>{' '}
                <strong>{formatDate(detailsTask.due_date)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Created by:</span>{' '}
                <strong>{detailsTask.creator?.name || detailsTask.creator?.email || 'System'}</strong>
              </div>
              {detailsTask.project && (
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Project:</span>{' '}
                  <strong>{detailsTask.project.name}</strong>
                </div>
              )}
            </div>

            <hr style={{ borderColor: 'var(--border-color)', margin: '0' }} />

            {/* Notes Section */}
            <NotesSection entityType="task" entityId={detailsTask.id} />

            <hr style={{ borderColor: 'var(--border-color)', margin: '0' }} />

            {/* Activity Timeline */}
            <ActivityTimeline entityType="task" entityId={detailsTask.id} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  const t = detailsTask;
                  setDetailsTask(null);
                  openEditModal(t);
                }}
                className="btn btn-secondary"
              >
                Edit Task
              </button>
              <button onClick={() => setDetailsTask(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTaskId && (
        <ModalOverlay onClose={() => setDeletingTaskId(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--status-danger)' }}>Delete Task</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button onClick={() => setDeletingTaskId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleDeleteTask(deletingTaskId)} className="btn btn-primary" style={{ background: 'var(--status-danger)' }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default TasksPage;
