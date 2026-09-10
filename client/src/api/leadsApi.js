import axiosClient from './axiosClient';

/**
 * Leads management API service
 * All calls are sent via axiosClient with automatic token injection and refresh.
 */
export const leadsApi = {
  /**
   * GET /api/v1/leads
   * List leads with optional pagination, search, and filters.
   * @param {Object} params
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @param {string} [params.search]
   * @param {string} [params.status]
   * @param {string} [params.priority]
   * @param {string} [params.source]
   * @param {string} [params.assigned_user_id]
   * @param {string} [params.sortBy]
   * @param {string} [params.sortOrder]
   */
  listLeads: (params = {}) => axiosClient.get('/leads', { params }),

  /**
   * GET /api/v1/leads/:id
   * Get a single lead by UUID
   * @param {string} id - Lead UUID
   */
  getLeadById: (id) => axiosClient.get(`/leads/${id}`),

  /**
   * POST /api/v1/leads
   * Create a new lead
   * @param {Object} data - Lead payload
   */
  createLead: (data) => axiosClient.post('/leads', data),

  /**
   * PATCH /api/v1/leads/:id
   * Update lead fields
   * @param {string} id - Lead UUID
   * @param {Object} data - Fields to update
   */
  updateLead: (id, data) => axiosClient.patch(`/leads/${id}`, data),

  /**
   * PATCH /api/v1/leads/:id/status
   * Update lead status
   * @param {string} id - Lead UUID
   * @param {string} status - New status
   */
  updateStatus: (id, status) => axiosClient.patch(`/leads/${id}/status`, { status }),

  /**
   * PATCH /api/v1/leads/:id/assign
   * Assign or reassign lead (Admin/Manager only)
   * @param {string} id - Lead UUID
   * @param {string|null} assigned_user_id - User UUID or null to unassign
   */
  assignLead: (id, assigned_user_id) => axiosClient.patch(`/leads/${id}/assign`, { assigned_user_id }),

  /**
   * DELETE /api/v1/leads/:id
   * Soft-delete lead (Admin only)
   * @param {string} id - Lead UUID
   */
  deleteLead: (id) => axiosClient.delete(`/leads/${id}`),
};

export default leadsApi;
