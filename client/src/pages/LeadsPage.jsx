import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLeads,
  createNewLead,
  updateExistingLead,
  changeLeadStatus,
  assignLeadUser,
  removeLead,
  clearLeadsError,
  selectLeads,
  selectLeadsTotal,
  selectLeadsTotalPages,
  selectLeadsPage,
  selectLeadsLoading,
  selectLeadsActionLoading,
  selectLeadsError,
  selectLeadsActionError,
} from '../features/leads/leadsSlice';
import { selectCurrentUser } from '../features/auth/authSlice';
import { fetchUsers, selectUsers } from '../features/users/usersSlice';
import RoleGuard from '../components/auth/RoleGuard';

// Domain constants
const STATUS_OPTIONS = [
  { value: 'new', label: 'New', badge: 'badge-info', icon: 'fiber_new' },
  { value: 'contacted', label: 'Contacted', badge: 'badge-warning', icon: 'call' },
  { value: 'qualifying', label: 'Qualifying', badge: 'badge-warning', icon: 'tune' },
  { value: 'qualified', label: 'Qualified', badge: 'badge-success', icon: 'verified' },
  { value: 'unqualified', label: 'Unqualified', badge: 'badge-danger', icon: 'cancel' },
  { value: 'converted', label: 'Converted', badge: 'badge-success', icon: 'stars' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', badge: 'badge-info', color: '#3b82f6' },
  { value: 'medium', label: 'Medium', badge: 'badge-warning', color: '#f59e0b' },
  { value: 'high', label: 'High', badge: 'badge-danger', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', badge: 'badge-danger', color: '#dc2626' },
];

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

export const LeadsPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const leads = useSelector(selectLeads);
  const total = useSelector(selectLeadsTotal);
  const totalPages = useSelector(selectLeadsTotalPages);
  const page = useSelector(selectLeadsPage);
  const isLoading = useSelector(selectLeadsLoading);
  const isActionLoading = useSelector(selectLeadsActionLoading);
  const error = useSelector(selectLeadsError);
  const actionError = useSelector(selectLeadsActionError);

  const users = useSelector(selectUsers);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    status: 'new',
    priority: 'medium',
    assigned_user_id: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users for assignment dropdown if admin or manager
  useEffect(() => {
    if (isAdminOrManager && (!users || users.length === 0)) {
      dispatch(fetchUsers({ limit: 100, isActive: true }));
    }
  }, [dispatch, isAdminOrManager, users]);

  // Load leads
  const loadLeads = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 15,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    if (sourceFilter) params.source = sourceFilter;
    if (assigneeFilter && isAdminOrManager) params.assigned_user_id = assigneeFilter;

    dispatch(fetchLeads(params));
  }, [
    dispatch,
    currentPage,
    debouncedSearch,
    statusFilter,
    priorityFilter,
    sourceFilter,
    assigneeFilter,
    isAdminOrManager,
  ]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    return () => {
      dispatch(clearLeadsError());
    };
  }, [dispatch]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCount = total;
    let newCount = 0;
    let contactedCount = 0;
    let qualifiedCount = 0;
    let convertedCount = 0;

    leads.forEach((l) => {
      if (l.status === 'new') newCount++;
      else if (l.status === 'contacted' || l.status === 'qualifying') contactedCount++;
      else if (l.status === 'qualified') qualifiedCount++;
      else if (l.status === 'converted') convertedCount++;
    });

    return { totalCount, newCount, contactedCount, qualifiedCount, convertedCount };
  }, [leads, total]);

  // Reset Form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      source: 'website',
      status: 'new',
      priority: 'medium',
      assigned_user_id: '',
      notes: '',
    });
    setFormErrors({});
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (lead) => {
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || 'website',
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      assigned_user_id: lead.assigned_user_id || '',
      notes: lead.notes || '',
    });
    setFormErrors({});
    setEditingLead(lead);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      source: formData.source,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes.trim() || null,
    };

    if (isAdminOrManager && formData.assigned_user_id) {
      payload.assigned_user_id = formData.assigned_user_id;
    }

    const resultAction = await dispatch(createNewLead(payload));
    if (createNewLead.fulfilled.match(resultAction)) {
      setIsCreateModalOpen(false);
      resetForm();
      loadLeads();
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      source: formData.source,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes.trim() || null,
    };

    if (isAdminOrManager) {
      payload.assigned_user_id = formData.assigned_user_id || null;
    }

    const resultAction = await dispatch(
      updateExistingLead({ id: editingLead.id, data: payload })
    );
    if (updateExistingLead.fulfilled.match(resultAction)) {
      setEditingLead(null);
      resetForm();
      loadLeads();
    }
  };

  // Quick Status Change
  const handleQuickStatus = async (leadId, newStatus) => {
    await dispatch(changeLeadStatus({ id: leadId, status: newStatus }));
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deletingLead) return;
    const resultAction = await dispatch(removeLead(deletingLead.id));
    if (removeLead.fulfilled.match(resultAction)) {
      setDeletingLead(null);
      loadLeads();
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '32px' }}>
              leaderboard
            </span>
            Lead Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {currentUser?.role === 'employee'
              ? 'Viewing and managing leads assigned to your portfolio'
              : 'Track, qualify, and assign sales leads across your organization'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          id="btn-create-lead"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.9rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          New Lead
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Leads
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {stats.totalCount}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--status-info)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            New Leads
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-info)', marginTop: '4px' }}>
            {stats.newCount}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            In Progress
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-warning)', marginTop: '4px' }}>
            {stats.contactedCount}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Qualified
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-success)', marginTop: '4px' }}>
            {stats.qualifiedCount}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Converted
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '4px' }}>
            {stats.convertedCount}
          </div>
        </div>
      </div>

      {/* Error alert */}
      {(error || actionError) && (
        <div
          style={{
            background: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger)',
            color: 'var(--status-danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">error</span>
            <span>{error || actionError}</span>
          </div>
          <button
            onClick={() => dispatch(clearLeadsError())}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '20px',
            }}
          >
            search
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search leads by name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
            id="input-search-leads"
          />
        </div>

        {/* Status Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '140px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          id="select-filter-status"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '140px' }}
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
          id="select-filter-priority"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Source Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '140px' }}
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setCurrentPage(1);
          }}
          id="select-filter-source"
        >
          <option value="">All Sources</option>
          {SOURCE_OPTIONS.map((src) => (
            <option key={src.value} value={src.value}>
              {src.label}
            </option>
          ))}
        </select>

        {/* Assignee Filter (Admin/Manager only) */}
        {isAdminOrManager && (
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
            value={assigneeFilter}
            onChange={(e) => {
              setAssigneeFilter(e.target.value);
              setCurrentPage(1);
            }}
            id="select-filter-assignee"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {(searchTerm || statusFilter || priorityFilter || sourceFilter || assigneeFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPriorityFilter('');
              setSourceFilter('');
              setAssigneeFilter('');
              setCurrentPage(1);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>clear_all</span>
            Clear
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span
              className="material-symbols-outlined spinner"
              style={{ fontSize: '36px', color: 'var(--accent-primary)', marginBottom: '12px' }}
            >
              progress_activity
            </span>
            <p>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '54px', color: 'var(--text-muted)', marginBottom: '16px' }}
            >
              inbox
            </span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No leads found</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
              {searchTerm || statusFilter || priorityFilter || sourceFilter
                ? 'No leads match your active filters. Try adjusting or clearing search terms.'
                : 'Get started by creating your first sales lead.'}
            </p>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>add</span>
              Create New Lead
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Lead Contact
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Company
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Priority
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Assignee
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Source
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const statusObj = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
                  const priorityObj = PRIORITY_OPTIONS.find((p) => p.value === lead.priority) || PRIORITY_OPTIONS[1];

                  return (
                    <tr
                      key={lead.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name & Contact */}
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setViewingLead(lead)}
                        >
                          {lead.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {lead.email || lead.phone || 'No direct contact'}
                        </div>
                      </td>

                      {/* Company */}
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {lead.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          className={`badge ${priorityObj.badge}`}
                          style={{ textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: priorityObj.color,
                            }}
                          />
                          {lead.priority}
                        </span>
                      </td>

                      {/* Status (with inline quick change) */}
                      <td style={{ padding: '14px 18px' }}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleQuickStatus(lead.id, e.target.value)}
                          disabled={isActionLoading}
                          style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                          id={`select-lead-status-${lead.id}`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Assignee */}
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem' }}>
                        {lead.assignedUser ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'var(--accent-primary)',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}
                            >
                              {lead.assignedUser.name?.charAt(0).toUpperCase()}
                            </span>
                            <span style={{ color: 'var(--text-primary)' }}>{lead.assignedUser.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>

                      {/* Source */}
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{lead.source?.replace('_', ' ')}</span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setViewingLead(lead)}
                            style={{ padding: '6px', display: 'flex', alignItems: 'center' }}
                            title="View Details"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleOpenEdit(lead)}
                            style={{ padding: '6px', display: 'flex', alignItems: 'center' }}
                            title="Edit Lead"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => setDeletingLead(lead)}
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', color: 'var(--status-danger)' }}
                              title="Delete Lead"
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
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages} ({total} leads total)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE LEAD ================= */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Create New Lead</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Contact / Lead Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Sarah Connor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  id="create-lead-name"
                />
                {formErrors.name && (
                  <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    placeholder="sarah@cyberdyne.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    id="create-lead-email"
                  />
                  {formErrors.email && (
                    <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1 (555) 019-2831"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    id="create-lead-phone"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Company / Organization</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cyberdyne Systems"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  id="create-lead-company"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select
                    className="form-control"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    id="create-lead-source"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    id="create-lead-priority"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    id="create-lead-status"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee selection for Admin/Manager */}
              {isAdminOrManager && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-control"
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    id="create-lead-assignee"
                  >
                    <option value="">Leave Unassigned</option>
                    {users?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Notes & Requirements</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Key details, client requirements, budget context..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  id="create-lead-notes"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isActionLoading}
                  id="btn-submit-create-lead"
                >
                  {isActionLoading ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT LEAD ================= */}
      {editingLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Edit Lead: {editingLead.name}</h2>
              <button
                onClick={() => setEditingLead(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Contact / Lead Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  id="edit-lead-name"
                />
                {formErrors.name && (
                  <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    id="edit-lead-email"
                  />
                  {formErrors.email && (
                    <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    id="edit-lead-phone"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Company / Organization</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  id="edit-lead-company"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select
                    className="form-control"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    id="edit-lead-source"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    id="edit-lead-priority"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    id="edit-lead-status"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee selection for Admin/Manager */}
              {isAdminOrManager && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-control"
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    id="edit-lead-assignee"
                  >
                    <option value="">Leave Unassigned</option>
                    {users?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Notes & Requirements</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  id="edit-lead-notes"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingLead(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isActionLoading}
                  id="btn-submit-edit-lead"
                >
                  {isActionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW LEAD DETAILS ================= */}
      {viewingLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {viewingLead.name}
                </h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
                  {viewingLead.company || 'Individual / No Company'}
                </div>
              </div>
              <button
                onClick={() => setViewingLead(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className={`badge ${STATUS_OPTIONS.find((s) => s.value === viewingLead.status)?.badge || 'badge-info'}`}>
                Status: {viewingLead.status}
              </span>
              <span className={`badge ${PRIORITY_OPTIONS.find((p) => p.value === viewingLead.priority)?.badge || 'badge-info'}`}>
                Priority: {viewingLead.priority}
              </span>
              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                Source: {viewingLead.source?.replace('_', ' ')}
              </span>
            </div>

            {/* Grid of details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                fontSize: '0.9rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Email
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingLead.email || '—'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Phone
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingLead.phone || '—'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Assigned User
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingLead.assignedUser?.name || 'Unassigned'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Created By
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingLead.creator?.name || 'System'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Created At
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {new Date(viewingLead.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Last Updated
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {new Date(viewingLead.updated_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                Notes / Requirements
              </div>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {viewingLead.notes || 'No notes provided for this lead.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const leadToEdit = viewingLead;
                  setViewingLead(null);
                  handleOpenEdit(leadToEdit);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>edit</span>
                Edit Lead
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setViewingLead(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETE ================= */}
      {deletingLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              border: '1px solid var(--status-danger)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--status-danger)', fontSize: '32px' }}>
                warning
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Confirm Soft Delete</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to delete lead <strong style={{ color: 'var(--text-primary)' }}>{deletingLead.name}</strong>?
              This record will be safely soft-deleted from active CRM lists.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingLead(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isActionLoading}
                id="btn-confirm-delete-lead"
              >
                {isActionLoading ? 'Deleting...' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
