import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDeals,
  createNewDeal,
  updateExistingDeal,
  changeDealStage,
  changeDealStatus,
  removeDeal,
  clearDealsError,
  selectDeals,
  selectDealsTotal,
  selectDealsTotalPages,
  selectDealsPage,
  selectDealsSummary,
  selectDealsLoading,
  selectDealsActionLoading,
  selectDealsError,
  selectDealsActionError,
} from '../features/deals/dealsSlice';
import { selectCurrentUser } from '../features/auth/authSlice';
import { fetchLeads, selectLeads } from '../features/leads/leadsSlice';
import { fetchUsers, selectUsers } from '../features/users/usersSlice';

const PIPELINE_STAGES = [
  { key: 'qualification', label: 'Qualification', defaultProb: 20, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { key: 'discovery', label: 'Discovery', defaultProb: 40, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  { key: 'proposal', label: 'Proposal', defaultProb: 60, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { key: 'negotiation', label: 'Negotiation', defaultProb: 80, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { key: 'closed_won', label: 'Closed Won', defaultProb: 100, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { key: 'closed_lost', label: 'Closed Lost', defaultProb: 0, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'CAD', 'AUD'];

const formatMoney = (amount, currency = 'USD') => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(num);
};

export const DealsPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const deals = useSelector(selectDeals);
  const total = useSelector(selectDealsTotal);
  const totalPages = useSelector(selectDealsTotalPages);
  const page = useSelector(selectDealsPage);
  const summary = useSelector(selectDealsSummary);
  const isLoading = useSelector(selectDealsLoading);
  const isActionLoading = useSelector(selectDealsActionLoading);
  const error = useSelector(selectDealsError);
  const actionError = useSelector(selectDealsActionError);

  const leads = useSelector(selectLeads);
  const users = useSelector(selectUsers);

  // View mode: 'pipeline' (Kanban) or 'table'
  const [viewMode, setViewMode] = useState('pipeline');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [viewingDeal, setViewingDeal] = useState(null);
  const [deletingDeal, setDeletingDeal] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    currency: 'USD',
    stage: 'qualification',
    probability: 20,
    expected_close_date: '',
    lead_id: '',
    assigned_user_id: '',
    notes: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch leads and users for relationship selectors
  useEffect(() => {
    if (!leads || leads.length === 0) {
      dispatch(fetchLeads({ limit: 100 }));
    }
    if (isAdminOrManager && (!users || users.length === 0)) {
      dispatch(fetchUsers({ limit: 100, isActive: true }));
    }
  }, [dispatch, isAdminOrManager, leads, users]);

  // Load deals
  const loadDeals = useCallback(() => {
    const params = {
      page: currentPage,
      limit: viewMode === 'pipeline' ? 100 : 15,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (stageFilter) params.stage = stageFilter;
    if (statusFilter) params.status = statusFilter;
    if (assigneeFilter && isAdminOrManager) params.assigned_user_id = assigneeFilter;

    dispatch(fetchDeals(params));
  }, [
    dispatch,
    currentPage,
    viewMode,
    debouncedSearch,
    stageFilter,
    statusFilter,
    assigneeFilter,
    isAdminOrManager,
  ]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    return () => {
      dispatch(clearDealsError());
    };
  }, [dispatch]);

  // Group deals by stage for Kanban
  const dealsByStage = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach((st) => {
      map[st.key] = [];
    });
    deals.forEach((d) => {
      if (map[d.stage]) {
        map[d.stage].push(d);
      }
    });
    return map;
  }, [deals]);

  // Form helpers
  const resetForm = () => {
    setFormData({
      title: '',
      value: '',
      currency: 'USD',
      stage: 'qualification',
      probability: 20,
      expected_close_date: '',
      lead_id: '',
      assigned_user_id: '',
      notes: '',
      description: '',
    });
    setFormErrors({});
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (deal) => {
    setFormData({
      title: deal.title || '',
      value: deal.value !== undefined ? deal.value : '',
      currency: deal.currency || 'USD',
      stage: deal.stage || 'qualification',
      probability: deal.probability !== undefined ? deal.probability : 20,
      expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
      lead_id: deal.lead_id || '',
      assigned_user_id: deal.assigned_user_id || '',
      notes: deal.notes || '',
      description: deal.description || '',
    });
    setFormErrors({});
    setEditingDeal(deal);
  };

  const handleStageChangeInForm = (newStage) => {
    const stageObj = PIPELINE_STAGES.find((s) => s.key === newStage);
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: stageObj ? stageObj.defaultProb : prev.probability,
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim() || formData.title.trim().length < 2) {
      errors.title = 'Deal title must be at least 2 characters.';
    }
    if (formData.value && (isNaN(Number(formData.value)) || Number(formData.value) < 0)) {
      errors.value = 'Deal value must be a non-negative number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: formData.title.trim(),
      value: formData.value ? Number(formData.value) : 0,
      currency: formData.currency,
      stage: formData.stage,
      probability: Number(formData.probability),
      lead_id: formData.lead_id || null,
      expected_close_date: formData.expected_close_date || null,
      notes: formData.notes.trim() || null,
      description: formData.description.trim() || null,
    };

    if (isAdminOrManager && formData.assigned_user_id) {
      payload.assigned_user_id = formData.assigned_user_id;
    }

    const res = await dispatch(createNewDeal(payload));
    if (createNewDeal.fulfilled.match(res)) {
      setIsCreateModalOpen(false);
      resetForm();
      loadDeals();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: formData.title.trim(),
      value: formData.value ? Number(formData.value) : 0,
      currency: formData.currency,
      stage: formData.stage,
      probability: Number(formData.probability),
      lead_id: formData.lead_id || null,
      expected_close_date: formData.expected_close_date || null,
      notes: formData.notes.trim() || null,
      description: formData.description.trim() || null,
    };

    if (isAdminOrManager) {
      payload.assigned_user_id = formData.assigned_user_id || null;
    }

    const res = await dispatch(updateExistingDeal({ id: editingDeal.id, data: payload }));
    if (updateExistingDeal.fulfilled.match(res)) {
      setEditingDeal(null);
      resetForm();
      loadDeals();
    }
  };

  const handleQuickStageMove = async (dealId, nextStage) => {
    const stageObj = PIPELINE_STAGES.find((s) => s.key === nextStage);
    await dispatch(
      changeDealStage({
        id: dealId,
        stage: nextStage,
        probability: stageObj?.defaultProb,
      })
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDeal) return;
    const res = await dispatch(removeDeal(deletingDeal.id));
    if (removeDeal.fulfilled.match(res)) {
      setDeletingDeal(null);
      loadDeals();
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
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
              monetization_on
            </span>
            Sales Pipeline &amp; Deals
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {currentUser?.role === 'employee'
              ? 'Tracking your assigned deal opportunities and revenue forecasts'
              : 'Enterprise sales pipeline, stage velocity, and revenue conversion'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              className="btn"
              onClick={() => setViewMode('pipeline')}
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                border: 'none',
                background: viewMode === 'pipeline' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'pipeline' ? '#fff' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_kanban</span>
              Pipeline
            </button>
            <button
              className="btn"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>table_rows</span>
              Table
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            id="btn-create-deal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '0.9rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            New Deal
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Pipeline Value
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatMoney(summary.totalPipelineValue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {summary.totalDeals || total} active deal records
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--status-info)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Open Pipeline
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-info)', marginTop: '4px' }}>
            {formatMoney(summary.openValue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            In progress across qualification → negotiation
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Closed Won
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-success)', marginTop: '4px' }}>
            {formatMoney(summary.wonValue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Successfully converted revenue
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
            Closed Lost
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--status-danger)', marginTop: '4px' }}>
            {formatMoney(summary.lostValue)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Disqualified or lost opportunities
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
            onClick={() => dispatch(clearDealsError())}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
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
            placeholder="Search deals by title, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
            id="input-search-deals"
          />
        </div>

        {/* Stage Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '150px' }}
          value={stageFilter}
          onChange={(e) => {
            setStageFilter(e.target.value);
            setCurrentPage(1);
          }}
          id="select-filter-stage"
        >
          <option value="">All Stages</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '140px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          id="select-filter-deal-status"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
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
            id="select-filter-deal-assignee"
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

        {(searchTerm || stageFilter || statusFilter || assigneeFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setStageFilter('');
              setStatusFilter('');
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

      {/* Main Content: Pipeline Board OR Table View */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span
            className="material-symbols-outlined spinner"
            style={{ fontSize: '36px', color: 'var(--accent-primary)', marginBottom: '12px' }}
          >
            progress_activity
          </span>
          <p>Loading deals &amp; pipeline...</p>
        </div>
      ) : viewMode === 'pipeline' ? (
        /* ================= KANBAN PIPELINE BOARD ================= */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(240px, 1fr))',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '20px',
            alignItems: 'start',
          }}
        >
          {PIPELINE_STAGES.map((stageObj, idx) => {
            const stageDeals = dealsByStage[stageObj.key] || [];
            const stageTotalVal = stageDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

            return (
              <div
                key={stageObj.key}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  minHeight: '520px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Stage Header */}
                <div
                  style={{
                    padding: '8px 10px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {stageObj.label}
                    </span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: stageObj.bg,
                        color: stageObj.color,
                        fontWeight: '700',
                        fontSize: '0.75rem',
                      }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: stageObj.color, fontWeight: '600', marginTop: '4px' }}>
                    {formatMoney(stageTotalVal)}
                  </div>
                </div>

                {/* Stage Cards Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {stageDeals.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 10px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                      }}
                    >
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="glass-card"
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                          borderLeft: `3px solid ${stageObj.color}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '';
                        }}
                      >
                        {/* Title & Amount */}
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            marginBottom: '4px',
                          }}
                          onClick={() => setViewingDeal(deal)}
                        >
                          {deal.title}
                        </div>

                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                          }}
                        >
                          {formatMoney(deal.value, deal.currency)}
                        </div>

                        {/* Related Lead if attached */}
                        {deal.lead && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              marginBottom: '6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={`Originating Lead: ${deal.lead.name}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>
                              contact_mail
                            </span>
                            <span>{deal.lead.name}</span>
                            {deal.lead.company && <span style={{ color: 'var(--text-muted)' }}>({deal.lead.company})</span>}
                          </div>
                        )}

                        {/* Probability Progress Bar */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                            <span>Probability</span>
                            <span>{deal.probability}%</span>
                          </div>
                          <div
                            style={{
                              height: '4px',
                              background: 'var(--bg-tertiary)',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${deal.probability}%`,
                                height: '100%',
                                backgroundColor: stageObj.color,
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer: Assignee & Expected Close */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--border-color)',
                          }}
                        >
                          <span>{deal.assignedUser?.name || 'Unassigned'}</span>
                          {deal.expected_close_date && (
                            <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                          )}
                        </div>

                        {/* Card Stage Stepper Actions */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '8px',
                            paddingTop: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {idx > 0 && (
                              <button
                                className="btn btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStageMove(deal.id, PIPELINE_STAGES[idx - 1].key);
                                }}
                                style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                title={`Move back to ${PIPELINE_STAGES[idx - 1].label}`}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                              </button>
                            )}
                            {idx < PIPELINE_STAGES.length - 1 && (
                              <button
                                className="btn btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStageMove(deal.id, PIPELINE_STAGES[idx + 1].key);
                                }}
                                style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                title={`Advance to ${PIPELINE_STAGES[idx + 1].label}`}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(deal);
                              }}
                              style={{ padding: '3px 6px' }}
                              title="Edit Deal"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                            </button>
                            {isAdmin && (
                              <button
                                className="btn btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingDeal(deal);
                                }}
                                style={{ padding: '3px 6px', color: 'var(--status-danger)' }}
                                title="Delete Deal"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {deals.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>
                inbox
              </span>
              <h3 style={{ marginTop: '12px' }}>No deals found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Try clearing your search or create your first pipeline deal.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Deal Title
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Value
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Originating Lead
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Stage
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Probability
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Assignee
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Close Date
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => {
                    const stageObj = PIPELINE_STAGES.find((s) => s.key === deal.stage) || PIPELINE_STAGES[0];
                    return (
                      <tr
                        key={deal.id}
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div
                            style={{ fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}
                            onClick={() => setViewingDeal(deal)}
                          >
                            {deal.title}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {formatMoney(deal.value, deal.currency)}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {deal.lead ? (
                            <span>
                              {deal.lead.name} {deal.lead.company && `(${deal.lead.company})`}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            className="badge"
                            style={{ backgroundColor: stageObj.bg, color: stageObj.color, fontWeight: '600' }}
                          >
                            {stageObj.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem' }}>
                          {deal.probability}%
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem' }}>
                          {deal.assignedUser?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setViewingDeal(deal)}
                              style={{ padding: '6px' }}
                              title="View Details"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleOpenEdit(deal)}
                              style={{ padding: '6px' }}
                              title="Edit Deal"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                            </button>
                            {isAdmin && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => setDeletingDeal(deal)}
                                style={{ padding: '6px', color: 'var(--status-danger)' }}
                                title="Delete Deal"
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
                Page {page} of {totalPages} ({total} deals total)
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
      )}

      {/* ================= MODAL: CREATE DEAL ================= */}
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Create New Deal</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Deal Title *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                  placeholder="e.g. Enterprise Cloud Migration"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  id="create-deal-title"
                />
                {formErrors.title && (
                  <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.title}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Deal Value / Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${formErrors.value ? 'is-invalid' : ''}`}
                    placeholder="50000"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    id="create-deal-value"
                  />
                  {formErrors.value && (
                    <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      {formErrors.value}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-control"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    id="create-deal-currency"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lead Relationship */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Originating Lead (Optional)</label>
                <select
                  className="form-control"
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  id="create-deal-lead-id"
                >
                  <option value="">No Associated Lead</option>
                  {leads?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.company ? `(${l.company})` : ''} — {l.status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Pipeline Stage</label>
                  <select
                    className="form-control"
                    value={formData.stage}
                    onChange={(e) => handleStageChangeInForm(e.target.value)}
                    id="create-deal-stage"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Probability ({formData.probability}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    style={{ width: '100%', marginTop: '10px' }}
                    id="create-deal-probability"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Expected Close Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    id="create-deal-close-date"
                  />
                </div>
                {isAdminOrManager && (
                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-control"
                      value={formData.assigned_user_id}
                      onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                      id="create-deal-assignee"
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
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description &amp; Strategy Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Key milestones, negotiation terms, customer pain points..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  id="create-deal-notes"
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
                  id="btn-submit-create-deal"
                >
                  {isActionLoading ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DEAL ================= */}
      {editingDeal && (
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Edit Deal: {editingDeal.title}</h2>
              <button
                onClick={() => setEditingDeal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Deal Title *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  id="edit-deal-title"
                />
                {formErrors.title && (
                  <span style={{ color: 'var(--status-danger)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    {formErrors.title}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Deal Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    id="edit-deal-value"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-control"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    id="edit-deal-currency"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lead Relationship */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Originating Lead</label>
                <select
                  className="form-control"
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  id="edit-deal-lead-id"
                >
                  <option value="">No Associated Lead</option>
                  {leads?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.company ? `(${l.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Pipeline Stage</label>
                  <select
                    className="form-control"
                    value={formData.stage}
                    onChange={(e) => handleStageChangeInForm(e.target.value)}
                    id="edit-deal-stage"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Probability ({formData.probability}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    style={{ width: '100%', marginTop: '10px' }}
                    id="edit-deal-probability"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Expected Close Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    id="edit-deal-close-date"
                  />
                </div>
                {isAdminOrManager && (
                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-control"
                      value={formData.assigned_user_id}
                      onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                      id="edit-deal-assignee"
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
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description &amp; Strategy Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  id="edit-deal-notes"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingDeal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isActionLoading}
                  id="btn-submit-edit-deal"
                >
                  {isActionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW DEAL DETAILS ================= */}
      {viewingDeal && (
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
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {viewingDeal.title}
                </h2>
                <div style={{ color: 'var(--status-success)', fontSize: '1.5rem', fontWeight: '700', marginTop: '4px' }}>
                  {formatMoney(viewingDeal.value, viewingDeal.currency)}
                </div>
              </div>
              <button
                onClick={() => setViewingDeal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                Stage: {viewingDeal.stage?.replace('_', ' ')}
              </span>
              <span className="badge badge-warning">
                Probability: {viewingDeal.probability}%
              </span>
              <span
                className={`badge ${
                  viewingDeal.status === 'won'
                    ? 'badge-success'
                    : viewingDeal.status === 'lost'
                    ? 'badge-danger'
                    : 'badge-info'
                }`}
                style={{ textTransform: 'uppercase' }}
              >
                Status: {viewingDeal.status}
              </span>
            </div>

            {/* Originating Lead details card */}
            {viewingDeal.lead && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Originating Lead Information
                </div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {viewingDeal.lead.name} {viewingDeal.lead.company && `— ${viewingDeal.lead.company}`}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {viewingDeal.lead.email && `Email: ${viewingDeal.lead.email} `}
                  {viewingDeal.lead.phone && `• Phone: ${viewingDeal.lead.phone}`}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Assigned User
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingDeal.assignedUser?.name || 'Unassigned'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Expected Close
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingDeal.expected_close_date ? new Date(viewingDeal.expected_close_date).toLocaleDateString() : 'Not Set'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Created By
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  {viewingDeal.creator?.name || 'System'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Created Date
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {new Date(viewingDeal.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                Strategy &amp; Deal Notes
              </div>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {viewingDeal.notes || 'No notes added for this deal.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const dealToEdit = viewingDeal;
                  setViewingDeal(null);
                  handleOpenEdit(dealToEdit);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>edit</span>
                Edit Deal
              </button>
              <button className="btn btn-primary" onClick={() => setViewingDeal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETE ================= */}
      {deletingDeal && (
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
              Are you sure you want to delete deal <strong style={{ color: 'var(--text-primary)' }}>{deletingDeal.title}</strong>?
              This record will be safely soft-deleted from the active pipeline.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingDeal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isActionLoading}
                id="btn-confirm-delete-deal"
              >
                {isActionLoading ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPage;
