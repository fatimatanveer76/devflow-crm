import axiosClient from './axiosClient';

/**
 * Deals management API service
 * Interacts with /api/v1/deals via axiosClient (with token injection and auto-refresh).
 */
export const dealsApi = {
  /**
   * GET /api/v1/deals
   * List deals with optional pagination, search, stage, status, and assignee filters.
   * @param {Object} params
   */
  listDeals: (params = {}) => axiosClient.get('/deals', { params }),

  /**
   * GET /api/v1/deals/:id
   * Get single deal details with lead and user associations
   * @param {string} id - Deal UUID
   */
  getDealById: (id) => axiosClient.get(`/deals/${id}`),

  /**
   * POST /api/v1/deals
   * Create a new deal
   * @param {Object} data - Deal payload
   */
  createDeal: (data) => axiosClient.post('/deals', data),

  /**
   * PATCH /api/v1/deals/:id
   * Update deal details
   * @param {string} id - Deal UUID
   * @param {Object} data - Fields to update
   */
  updateDeal: (id, data) => axiosClient.patch(`/deals/${id}`, data),

  /**
   * PATCH /api/v1/deals/:id/stage
   * Update deal pipeline stage and probability
   * @param {string} id - Deal UUID
   * @param {string} stage - New stage
   * @param {number} [probability] - Optional probability %
   */
  updateStage: (id, stage, probability) => axiosClient.patch(`/deals/${id}/stage`, { stage, probability }),

  /**
   * PATCH /api/v1/deals/:id/status
   * Update deal status (open / won / lost)
   * @param {string} id - Deal UUID
   * @param {string} status - New status
   */
  updateStatus: (id, status) => axiosClient.patch(`/deals/${id}/status`, { status }),

  /**
   * PATCH /api/v1/deals/:id/assign
   * Assign or reassign deal (Admin/Manager only)
   * @param {string} id - Deal UUID
   * @param {string|null} assigned_user_id - User UUID or null
   */
  assignDeal: (id, assigned_user_id) => axiosClient.patch(`/deals/${id}/assign`, { assigned_user_id }),

  /**
   * DELETE /api/v1/deals/:id
   * Soft-delete deal (Admin only)
   * @param {string} id - Deal UUID
   */
  deleteDeal: (id) => axiosClient.delete(`/deals/${id}`),
};

export default dealsApi;
