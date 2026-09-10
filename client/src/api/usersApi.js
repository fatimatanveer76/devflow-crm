import axiosClient from './axiosClient';

/**
 * Users management API service
 * All endpoints require authentication (Bearer token).
 * Some endpoints additionally require admin/manager role (enforced server-side).
 */
export const usersApi = {
  /**
   * GET /api/v1/users
   * List users with optional pagination and filters.
   * Access: admin, manager
   * @param {{ page?: number, limit?: number, role?: string, isActive?: boolean }} params
   */
  listUsers: (params = {}) => axiosClient.get('/users', { params }),

  /**
   * GET /api/v1/users/:id
   * Get a single user by UUID.
   * Access: admin, manager
   * @param {string} id - User UUID
   */
  getUserById: (id) => axiosClient.get(`/users/${id}`),

  /**
   * PATCH /api/v1/users/:id/role
   * Update a user's role.
   * Access: admin only
   * @param {string} id - User UUID
   * @param {string} role - New role ('admin' | 'manager' | 'employee')
   */
  updateRole: (id, role) => axiosClient.patch(`/users/${id}/role`, { role }),

  /**
   * PATCH /api/v1/users/:id/status
   * Activate or deactivate a user account.
   * Access: admin only
   * @param {string} id - User UUID
   * @param {boolean} isActive - Desired active state
   */
  updateStatus: (id, isActive) => axiosClient.patch(`/users/${id}/status`, { isActive }),

  /**
   * DELETE /api/v1/users/:id
   * Soft-delete a user (paranoid delete).
   * Access: admin only
   * @param {string} id - User UUID
   */
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),
};

export default usersApi;
