import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  changeUserRole,
  changeUserStatus,
  removeUser,
  clearUsersError,
  selectUsers,
  selectUsersTotal,
  selectUsersTotalPages,
  selectUsersPage,
  selectUsersLoading,
  selectUsersActionLoading,
  selectUsersError,
  selectUsersActionError,
} from '../features/users/usersSlice';
import { selectCurrentUser } from '../features/auth/authSlice';
import RoleGuard from '../components/auth/RoleGuard';

const ROLE_OPTIONS = ['admin', 'manager', 'employee'];
const ROLE_BADGE = {
  admin: 'badge-danger',
  manager: 'badge-warning',
  employee: 'badge-success',
};
const ROLE_ICON = {
  admin: 'admin_panel_settings',
  manager: 'manage_accounts',
  employee: 'person',
};

/**
 * UsersPage — admin/manager user management interface.
 * Lists all users with pagination. Admins can change roles, toggle status, and delete users.
 */
const UsersPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const users = useSelector(selectUsers);
  const total = useSelector(selectUsersTotal);
  const totalPages = useSelector(selectUsersTotalPages);
  const page = useSelector(selectUsersPage);
  const isLoading = useSelector(selectUsersLoading);
  const isActionLoading = useSelector(selectUsersActionLoading);
  const error = useSelector(selectUsersError);
  const actionError = useSelector(selectUsersActionError);

  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadUsers = useCallback(() => {
    const params = { page: currentPage, limit: 20 };
    if (filterRole) params.role = filterRole;
    if (filterActive !== '') params.isActive = filterActive === 'true';
    dispatch(fetchUsers(params));
  }, [dispatch, currentPage, filterRole, filterActive]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    return () => {
      dispatch(clearUsersError());
    };
  }, [dispatch]);

  const handleRoleChange = (userId, newRole) => {
    setConfirmDialog({
      type: 'role',
      userId,
      newValue: newRole,
      message: `Change this user's role to "${newRole}"?`,
    });
  };

  const handleStatusToggle = (user) => {
    const newActive = !user.is_active;
    setConfirmDialog({
      type: 'status',
      userId: user.id,
      newValue: newActive,
      message: `${newActive ? 'Activate' : 'Deactivate'} user "${user.name}"?`,
    });
  };

  const handleDelete = (user) => {
    setConfirmDialog({
      type: 'delete',
      userId: user.id,
      message: `Permanently remove "${user.name}"? This action is not reversible.`,
    });
  };

  const executeConfirm = async () => {
    if (!confirmDialog) return;
    const { type, userId, newValue } = confirmDialog;
    setConfirmDialog(null);

    if (type === 'role') {
      await dispatch(changeUserRole({ id: userId, role: newValue }));
    } else if (type === 'status') {
      await dispatch(changeUserStatus({ id: userId, isActive: newValue }));
    } else if (type === 'delete') {
      await dispatch(removeUser(userId));
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-info">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              verified_user
            </span>
            Phase 4 — RBAC
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.03em', marginBottom: '4px' }}>
              User Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {total} user{total !== 1 ? 's' : ''} in the system
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={loadUsers}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', animation: isLoading ? 'pulse-dot 1s infinite' : 'none' }}
            >
              refresh
            </span>
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '20px' }}>
          filter_list
        </span>
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(filterRole || filterActive) && (
          <button
            className="btn btn-secondary"
            onClick={() => { setFilterRole(''); setFilterActive(''); setCurrentPage(1); }}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error banners */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--status-danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger)',
            fontSize: '0.875rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      )}
      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--status-danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger)',
            fontSize: '0.875rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
          {actionError}
        </div>
      )}

      {/* Users Table */}
      <div
        className="glass-card"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        {isLoading && users.length === 0 ? (
          <div
            style={{
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.15)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>
              group_off
            </span>
            No users match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.15)',
                  }}
                >
                  {['User', 'Email', 'Role', 'Status', 'Joined'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  <RoleGuard allowedRoles={['admin']}>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Actions
                    </th>
                  </RoleGuard>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: idx < users.length - 1 ? '1px solid var(--border-color)' : 'none',
                        transition: 'background var(--transition-fast)',
                        opacity: isActionLoading ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* User name + avatar */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: isSelf
                                ? 'var(--accent-gradient)'
                                : 'rgba(99,102,241,0.15)',
                              color: isSelf ? '#fff' : 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                              {user.name}
                              {isSelf && (
                                <span
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '0.7rem',
                                    color: 'var(--accent-primary)',
                                    fontWeight: '500',
                                  }}
                                >
                                  (you)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {user.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {user.email}
                        </span>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <RoleGuard
                          allowedRoles={['admin']}
                          fallback={
                            <span className={`badge ${ROLE_BADGE[user.role] || 'badge-info'}`}>
                              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                {ROLE_ICON[user.role] || 'person'}
                              </span>
                              {user.role}
                            </span>
                          }
                        >
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isActionLoading}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                            }}
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </option>
                            ))}
                          </select>
                        </RoleGuard>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <RoleGuard
                          allowedRoles={['admin']}
                          fallback={
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.82rem',
                                color: user.is_active ? 'var(--status-success)' : 'var(--text-muted)',
                              }}
                            >
                              <span className="status-dot" style={{ background: user.is_active ? 'var(--status-success)' : 'var(--text-muted)' }} />
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          }
                        >
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={isActionLoading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${user.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                              background: user.is_active ? 'var(--status-success-bg)' : 'var(--bg-tertiary)',
                              color: user.is_active ? 'var(--status-success)' : 'var(--text-muted)',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <span className="status-dot" style={{ background: user.is_active ? 'var(--status-success)' : 'var(--text-muted)' }} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </RoleGuard>
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Delete — admin only */}
                      <RoleGuard allowedRoles={['admin']}>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={isActionLoading || isSelf}
                            title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                            style={{
                              padding: '6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid transparent',
                              background: 'transparent',
                              color: isSelf ? 'var(--text-muted)' : 'var(--status-danger)',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              opacity: isSelf ? 0.4 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all var(--transition-fast)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelf) {
                                e.currentTarget.style.background = 'var(--status-danger-bg)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              delete
                            </span>
                          </button>
                        </td>
                      </RoleGuard>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="glass-card"
            style={{ maxWidth: '400px', width: '90%', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-warning-bg)',
                  color: 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>Confirm Action</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {confirmDialog.message}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{
                  background: confirmDialog.type === 'delete' ? 'var(--status-danger)' : 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                }}
                onClick={executeConfirm}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Processing…' : confirmDialog.type === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
