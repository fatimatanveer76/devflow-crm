import { DashboardService } from '../services/dashboard.service.js';

/**
 * GET /api/v1/dashboard/summary
 * Returns aggregated CRM metrics, KPI data, and activity feeds.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await DashboardService.getSummaryMetrics(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
