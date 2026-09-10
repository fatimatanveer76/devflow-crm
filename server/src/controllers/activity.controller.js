import { ActivityService } from '../services/activity.service.js';

/**
 * GET /api/v1/activities
 * List activities with filters
 */
export const listActivities = async (req, res, next) => {
  try {
    const result = await ActivityService.listActivities(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
