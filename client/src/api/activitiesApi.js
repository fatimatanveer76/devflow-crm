import axiosClient from './axiosClient';

/**
 * Activities API service
 * Interacts with /api/v1/activities
 */
export const activitiesApi = {
  /**
   * GET /api/v1/activities
   * List activities
   */
  listActivities: (params = {}) => axiosClient.get('/activities', { params }),
};

export default activitiesApi;
