import axiosClient from './axiosClient';

/**
 * Projects management API service
 * Interacts with /api/v1/projects via axiosClient (with token injection and auto-refresh).
 */
export const projectsApi = {
  /**
   * GET /api/v1/projects
   * List projects with optional pagination, search, status, priority, and assignee filters.
   * @param {Object} params
   */
  listProjects: (params = {}) => axiosClient.get('/projects', { params }),

  /**
   * GET /api/v1/projects/:id
   * Get single project details with deal, lead, and user associations
   * @param {string} id - Project UUID
   */
  getProjectById: (id) => axiosClient.get(`/projects/${id}`),

  /**
   * POST /api/v1/projects
   * Create a new project
   * @param {Object} data - Project payload
   */
  createProject: (data) => axiosClient.post('/projects', data),

  /**
   * PATCH /api/v1/projects/:id
   * Update project details
   * @param {string} id - Project UUID
   * @param {Object} data - Fields to update
   */
  updateProject: (id, data) => axiosClient.patch(`/projects/${id}`, data),

  /**
   * PATCH /api/v1/projects/:id/status
   * Update project status
   * @param {string} id - Project UUID
   * @param {string} status - New status
   */
  updateStatus: (id, status) => axiosClient.patch(`/projects/${id}/status`, { status }),

  /**
   * PATCH /api/v1/projects/:id/assign
   * Assign or reassign project (Admin/Manager only)
   * @param {string} id - Project UUID
   * @param {string|null} assigned_user_id - User UUID or null
   */
  assignProject: (id, assigned_user_id) => axiosClient.patch(`/projects/${id}/assign`, { assigned_user_id }),

  /**
   * DELETE /api/v1/projects/:id
   * Soft-delete project (Admin only)
   * @param {string} id - Project UUID
   */
  deleteProject: (id) => axiosClient.delete(`/projects/${id}`),
};

export default projectsApi;
