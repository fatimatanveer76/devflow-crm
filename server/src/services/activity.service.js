import { Op } from 'sequelize';
import { Activity, User, Lead, Deal, Project, Task } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role'];

export class ActivityService {
  /**
   * Safely logs an activity entry with duplicate prevention and non-fatal error handling
   * @param {Object} data - { type, description, user_id, lead_id, deal_id, project_id, task_id, metadata }
   * @returns {Promise<Activity|null>}
   */
  static async log({ type, description, user_id, lead_id, deal_id, project_id, task_id, metadata = null }) {
    try {
      // Prevent rapid duplicate activity entries (within 5 seconds)
      const duplicateWindow = new Date(Date.now() - 5000);
      const duplicateWhere = {
        type,
        user_id: user_id || null,
        lead_id: lead_id || null,
        deal_id: deal_id || null,
        project_id: project_id || null,
        task_id: task_id || null,
        description,
        created_at: {
          [Op.gte]: duplicateWindow,
        },
      };

      const existingActivity = await Activity.findOne({ where: duplicateWhere });
      if (existingActivity) {
        return existingActivity;
      }

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
      console.warn('[ActivityService.log] Non-fatal activity logging failure:', err.message);
      return null;
    }
  }

  /**
   * Lists activities with strict RBAC data scoping, filtering, and pagination.
   * Prevents employees from accessing unrelated users' or entities' activity records.
   * Historical activity records are read-only and cannot be mutated by ordinary users.
   * @param {Object} query - Query parameters (page, limit, lead_id, deal_id, project_id, task_id, user_id, type)
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<{activities: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async listActivities(query = {}, user) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    const where = {};
    const isEmployee = user.role === ROLES.EMPLOYEE;

    // 1. Explicit entity-level filters with authorization enforcement
    let entityFilterApplied = false;

    if (query.lead_id) {
      if (!isValidUUID(query.lead_id)) {
        const err = new Error('Invalid lead ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const lead = await Lead.findByPk(query.lead_id);
      if (!lead) {
        const err = new Error('Lead not found.');
        err.statusCode = 404;
        err.code = 'LEAD_NOT_FOUND';
        throw err;
      }
      if (isEmployee && lead.assigned_user_id !== user.id) {
        const err = new Error('You do not have permission to view activity for this lead.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      where.lead_id = query.lead_id;
      entityFilterApplied = true;
    }

    if (query.deal_id) {
      if (!isValidUUID(query.deal_id)) {
        const err = new Error('Invalid deal ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const deal = await Deal.findByPk(query.deal_id);
      if (!deal) {
        const err = new Error('Deal not found.');
        err.statusCode = 404;
        err.code = 'DEAL_NOT_FOUND';
        throw err;
      }
      if (isEmployee && deal.assigned_user_id !== user.id) {
        const err = new Error('You do not have permission to view activity for this deal.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      where.deal_id = query.deal_id;
      entityFilterApplied = true;
    }

    if (query.project_id) {
      if (!isValidUUID(query.project_id)) {
        const err = new Error('Invalid project ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const project = await Project.findByPk(query.project_id);
      if (!project) {
        const err = new Error('Project not found.');
        err.statusCode = 404;
        err.code = 'PROJECT_NOT_FOUND';
        throw err;
      }
      if (isEmployee && project.assigned_user_id !== user.id) {
        const err = new Error('You do not have permission to view activity for this project.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      where.project_id = query.project_id;
      entityFilterApplied = true;
    }

    if (query.task_id) {
      if (!isValidUUID(query.task_id)) {
        const err = new Error('Invalid task ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const task = await Task.findByPk(query.task_id);
      if (!task) {
        const err = new Error('Task not found.');
        err.statusCode = 404;
        err.code = 'TASK_NOT_FOUND';
        throw err;
      }
      if (isEmployee && task.assigned_user_id !== user.id && task.created_by_id !== user.id) {
        const err = new Error('You do not have permission to view activity for this task.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      where.task_id = query.task_id;
      entityFilterApplied = true;
    }

    // 2. User filter enforcement
    if (query.user_id) {
      if (!isValidUUID(query.user_id)) {
        const err = new Error('Invalid user ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      if (isEmployee && query.user_id !== user.id) {
        const err = new Error('Employees may only view their own activity history.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      where.user_id = query.user_id;
    }

    // 3. Activity type filter
    if (query.type && typeof query.type === 'string') {
      where.type = query.type;
    }

    // 4. Default scoping for employees when no specific entity was queried
    if (isEmployee && !entityFilterApplied && !query.user_id) {
      const [assignedLeads, assignedDeals, assignedProjects, assignedTasks] = await Promise.all([
        Lead.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Deal.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Project.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Task.findAll({
          where: { [Op.or]: [{ assigned_user_id: user.id }, { created_by_id: user.id }] },
          attributes: ['id'],
          raw: true,
        }),
      ]);

      const leadIds = assignedLeads.map((l) => l.id);
      const dealIds = assignedDeals.map((d) => d.id);
      const projectIds = assignedProjects.map((p) => p.id);
      const taskIds = assignedTasks.map((t) => t.id);

      const scopedOr = [
        { user_id: user.id },
        ...(leadIds.length > 0 ? [{ lead_id: { [Op.in]: leadIds } }] : []),
        ...(dealIds.length > 0 ? [{ deal_id: { [Op.in]: dealIds } }] : []),
        ...(projectIds.length > 0 ? [{ project_id: { [Op.in]: projectIds } }] : []),
        ...(taskIds.length > 0 ? [{ task_id: { [Op.in]: taskIds } }] : []),
      ];

      where[Op.and] = where[Op.and] ? [...where[Op.and], { [Op.or]: scopedOr }] : [{ [Op.or]: scopedOr }];
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
