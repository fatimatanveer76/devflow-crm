import axiosClient from './axiosClient';

/**
 * Client Portal API service
 * Interacts with /api/v1/portal via axiosClient with token injection and automatic refresh.
 */
export const portalApi = {
  /**
   * GET /api/v1/portal/dashboard
   * Retrieves summary metrics, recent projects, and activity for the authenticated client.
   */
  getDashboard: () => axiosClient.get('/portal/dashboard'),

  /**
   * GET /api/v1/portal/projects
   * Retrieves all projects assigned to the authenticated client.
   * @param {Object} params - { page, limit, status, search }
   */
  getProjects: (params = {}) => axiosClient.get('/portal/projects', { params }),

  /**
   * GET /api/v1/portal/projects/:id
   * Retrieves single project details, task progress, and approved specifications.
   * @param {string} id - Project UUID
   */
  getProjectById: (id) => axiosClient.get(`/portal/projects/${id}`),

  /**
   * GET /api/v1/portal/requirements
   * Retrieves approved and published requirements across client's projects.
   * @param {Object} params - { page, limit, status, project_id, type, search }
   */
  getRequirements: (params = {}) => axiosClient.get('/portal/requirements', { params }),

  /**
   * GET /api/v1/portal/requirements/:id
   * Retrieves single approved/published specification with version snapshots.
   * @param {string} id - Requirement UUID
   */
  getRequirementById: (id) => axiosClient.get(`/portal/requirements/${id}`),

  /**
   * GET /api/v1/portal/profile
   * Retrieves client's company profile and contact details.
   */
  getProfile: () => axiosClient.get('/portal/profile'),

  /**
   * PATCH /api/v1/portal/profile
   * Updates client's contact phone, address, and profile details.
   * @param {Object} data - { name, contact_phone, address, industry }
   */
  updateProfile: (data) => axiosClient.patch('/portal/profile', data),
};

export default portalApi;
