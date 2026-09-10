import { Activity, User, Lead, Deal, Project, Task } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role'];

export class ActivityService {
  /**
   * Safely logs an activity entry without interrupting caller on failure
   * @param {Object} data - { type, description, user_id, lead_id, deal_id, project_id, task_id, metadata }
   * @returns {Promise<Activity|null>}
   */
  static async log({ type, description, user_id, lead_id, deal_id, project_id, task_id, metadata = null }) {
    try {
      const activity = await Activity.create({
        type,
        description,
        user_id: user_id || null,
        lead_id: lead_id || null,
        deal_id: deal_id || null,
        project_id: project_id || null,
        task_id: task_id || null,
        metadata,
      });
      return activity;
    } catch (err) {
      console.error('[ActivityService.log] Failed to log activity:', err.message);
      return null;
    }
  }

  /**
   * Lists activities with filtering, pagination, and user inclusion
   * @param {Object} query - Query parameters
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async listActivities(query = {}, user) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    const where = {};

    // Entity filters
    if (query.lead_id && isValidUUID(query.lead_id)) {
      where.lead_id = query.lead_id;
    }
    if (query.deal_id && isValidUUID(query.deal_id)) {
      where.deal_id = query.deal_id;
    }
    if (query.project_id && isValidUUID(query.project_id)) {
      where.project_id = query.project_id;
    }
    if (query.task_id && isValidUUID(query.task_id)) {
      where.task_id = query.task_id;
    }
    if (query.user_id && isValidUUID(query.user_id)) {
      where.user_id = query.user_id;
    }
    if (query.type && typeof query.type === 'string') {
      where.type = query.type;
    }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: SAFE_USER_ATTRIBUTES,
        },
      ],
      distinct: true,
    });

    return {
      activities: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }
}

export default ActivityService;
