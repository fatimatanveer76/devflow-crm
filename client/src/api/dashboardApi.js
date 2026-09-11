import axiosClient from './axiosClient';

/**
 * Dashboard & Analytics API service
 * Interacts with /api/v1/dashboard
 */
export const dashboardApi = {
  /**
   * GET /api/v1/dashboard/summary
   * Fetch aggregated CRM metrics, KPI data, and activity feed
   * @param {Object} params - { start_date, end_date }
   */
  getSummary: (params = {}) => axiosClient.get('/dashboard/summary', { params }),
};

export default dashboardApi;
