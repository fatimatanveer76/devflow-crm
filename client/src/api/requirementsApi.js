import axiosClient from './axiosClient';

/**
 * Requirements management API service
 * Interacts with /api/v1/requirements via axiosClient (with token injection and auto-refresh).
 */
export const requirementsApi = {
  /**
   * GET /api/v1/requirements
   * List requirements with optional pagination, search, status, type, priority, project, and deal filters.
   * @param {Object} params
   */
  listRequirements: (params = {}) => axiosClient.get('/requirements', { params }),

  /**
   * GET /api/v1/requirements/:id
   * Get single requirement details with complete version snapshots and creator/approver info
   * @param {string} id - Requirement UUID
   */
  getRequirementById: (id) => axiosClient.get(`/requirements/${id}`),

  /**
   * POST /api/v1/requirements
   * Create a new requirement in Draft status
   * @param {Object} data - Requirement payload
   */
  createRequirement: (data) => axiosClient.post('/requirements', data),

  /**
   * PATCH /api/v1/requirements/:id
   * Update requirement (creates an immutable version snapshot)
   * @param {string} id - Requirement UUID
   * @param {Object} data - Fields to update
   */
  updateRequirement: (id, data) => axiosClient.patch(`/requirements/${id}`, data),

  /**
   * PATCH /api/v1/requirements/:id/status
   * Transition requirement status
   * @param {string} id - Requirement UUID
   * @param {string} status - Target status
   * @param {string|null} rejection_reason - Explanation if rejected
   */
  updateStatus: (id, status, rejection_reason = null) =>
    axiosClient.patch(`/requirements/${id}/status`, { status, rejection_reason }),

  /**
   * PATCH /api/v1/requirements/:id/approve
   * Approve requirement (Admin / Manager only)
   * @param {string} id - Requirement UUID
   */
  approveRequirement: (id) => axiosClient.patch(`/requirements/${id}/approve`),

  /**
   * PATCH /api/v1/requirements/:id/reject
   * Reject requirement with required reason (Admin / Manager only)
   * @param {string} id - Requirement UUID
   * @param {string} rejection_reason - Reason for rejection
   */
  rejectRequirement: (id, rejection_reason) =>
    axiosClient.patch(`/requirements/${id}/reject`, { rejection_reason }),

  /**
   * PATCH /api/v1/requirements/:id/publish
   * Publish approved requirement (Admin / Manager only)
   * @param {string} id - Requirement UUID
   */
  publishRequirement: (id) => axiosClient.patch(`/requirements/${id}/publish`),

  /**
   * DELETE /api/v1/requirements/:id
   * Soft-delete requirement (Admin only)
   * @param {string} id - Requirement UUID
   */
  deleteRequirement: (id) => axiosClient.delete(`/requirements/${id}`),

  /**
   * GET /api/v1/requirements/:id/versions
   * Retrieve append-only version history snapshots
   * @param {string} id - Requirement UUID
   */
  getVersionHistory: (id) => axiosClient.get(`/requirements/${id}/versions`),
};

export default requirementsApi;
