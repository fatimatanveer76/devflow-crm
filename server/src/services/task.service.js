import { Op } from 'sequelize';
import { Task, Project, Deal, Lead, User } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import {
  ALL_TASK_STATUSES,
  ALL_TASK_PRIORITIES,
  TASK_STATUS,
  TASK_PRIORITY,
  isValidTaskStatus,
  isValidTaskPriority,
} from '../config/tasks.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';
import { ActivityService } from './activity.service.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role', 'is_active'];
const SAFE_DEAL_ATTRIBUTES = ['id', 'title', 'value', 'currency', 'stage', 'status'];
const SAFE_LEAD_ATTRIBUTES = ['id', 'name', 'company', 'email', 'phone', 'status'];
const SAFE_PROJECT_ATTRIBUTES = ['id', 'name', 'status', 'priority'];

export class TaskService {
  /**
   * Finds a task by PK with full associations and enforces role-based scoping
   * @param {string} id - Task UUID
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Task>}
   */
  static async findTaskOrFail(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid task ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: SAFE_USER_ATTRIBUTES,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Project,
          as: 'project',
          attributes: SAFE_PROJECT_ATTRIBUTES,
        },
      ],
    });

    if (!task) {
      const err = new Error('Task not found.');
      err.statusCode = 404;
      err.code = 'TASK_NOT_FOUND';
      throw err;
    }

    // Role-based data scoping: Employees can only view/manage tasks assigned to them or created by them
    if (user.role === ROLES.EMPLOYEE && task.assigned_user_id !== user.id && task.created_by_id !== user.id) {
      const err = new Error('You do not have permission to view or manage this task.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return task;
  }

  /**
   * Creates a new task
   * @param {Object} data - Task payload
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>}
   */
  static async createTask(data, user) {
    let assignedUserId = data.assigned_user_id || null;

    if (user.role === ROLES.EMPLOYEE) {
      // Employees assign tasks to themselves by default
      assignedUserId = user.id;
    } else if (assignedUserId) {
      const assignee = await User.findByPk(assignedUserId);
      if (!assignee || !assignee.is_active) {
        const err = new Error('The assigned user does not exist or is inactive.');
        err.statusCode = 400;
        err.code = 'INVALID_ASSIGNEE';
        throw err;
      }
    }

    // Verify entity references if supplied
    if (data.lead_id) {
      const lead = await Lead.findByPk(data.lead_id);
      if (!lead) {
        const err = new Error('The related lead does not exist.');
        err.statusCode = 400;
        err.code = 'INVALID_LEAD';
        throw err;
      }
    }

    if (data.deal_id) {
      const deal = await Deal.findByPk(data.deal_id);
      if (!deal) {
        const err = new Error('The related deal does not exist.');
        err.statusCode = 400;
        err.code = 'INVALID_DEAL';
        throw err;
      }
    }

    if (data.project_id) {
      const project = await Project.findByPk(data.project_id);
      if (!project) {
        const err = new Error('The related project does not exist.');
        err.statusCode = 400;
        err.code = 'INVALID_PROJECT';
        throw err;
      }
    }

    const task = await Task.create({
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      status: data.status || TASK_STATUS.PENDING,
      priority: data.priority || TASK_PRIORITY.MEDIUM,
      due_date: data.due_date ? new Date(data.due_date) : null,
      assigned_user_id: assignedUserId,
      created_by_id: user.id,
      lead_id: data.lead_id || null,
      deal_id: data.deal_id || null,
      project_id: data.project_id || null,
    });

    // Log activity
    await ActivityService.log({
      type: 'task_created',
      description: `Task "${task.title}" was created by ${user.name || user.email}.`,
      user_id: user.id,
      task_id: task.id,
      lead_id: task.lead_id,
      deal_id: task.deal_id,
      project_id: task.project_id,
      metadata: { priority: task.priority, status: task.status },
    });

    await task.reload({
      include: [
        { model: User, as: 'assignedUser', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Lead, as: 'lead', attributes: SAFE_LEAD_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
      ],
    });

    return task.toJSON();
  }

  /**
   * Lists tasks with search, filtering, pagination, and metrics summary
   * @param {Object} query - Query parameters
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>}
   */
  static async listTasks(query = {}, user) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = {};

    // 1. Role scoping
    if (user.role === ROLES.EMPLOYEE) {
      where[Op.or] = [
        { assigned_user_id: user.id },
        { created_by_id: user.id },
      ];
    } else if (query.assigned_user_id) {
      if (query.assigned_user_id === 'unassigned') {
        where.assigned_user_id = null;
      } else if (isValidUUID(query.assigned_user_id)) {
        where.assigned_user_id = query.assigned_user_id;
      }
    }

    // 2. Status filter
    if (query.status && isValidTaskStatus(query.status)) {
      where.status = query.status;
    }

    // 3. Priority filter
    if (query.priority && isValidTaskPriority(query.priority)) {
      where.priority = query.priority;
    }

    // 4. Related entity filters
    if (query.lead_id && isValidUUID(query.lead_id)) {
      where.lead_id = query.lead_id;
    }
    if (query.deal_id && isValidUUID(query.deal_id)) {
      where.deal_id = query.deal_id;
    }
    if (query.project_id && isValidUUID(query.project_id)) {
      where.project_id = query.project_id;
    }

    // 5. Search across title, description
    if (query.search && typeof query.search === 'string') {
      const term = `%${query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
      ];
    }

    // 6. Sorting
    const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'due_date', 'title', 'status', 'priority'];
    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'created_at';
    const sortOrder = query.sortOrder && query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Task.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: User, as: 'assignedUser', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Lead, as: 'lead', attributes: SAFE_LEAD_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
      ],
      distinct: true,
    });

    // 7. Aggregate metrics summary (scoped)
    const summaryWhere = user.role === ROLES.EMPLOYEE
      ? { [Op.or]: [{ assigned_user_id: user.id }, { created_by_id: user.id }] }
      : {};

    const allScopedTasks = await Task.findAll({
      where: summaryWhere,
      attributes: ['status', 'priority', 'due_date'],
    });

    const countByStatus = {};
    ALL_TASK_STATUSES.forEach((st) => { countByStatus[st] = 0; });
    const countByPriority = {};
    ALL_TASK_PRIORITIES.forEach((pr) => { countByPriority[pr] = 0; });

    let overdueTasks = 0;
    const now = new Date();

    allScopedTasks.forEach((t) => {
      if (countByStatus[t.status] !== undefined) countByStatus[t.status] += 1;
      if (countByPriority[t.priority] !== undefined) countByPriority[t.priority] += 1;
      if (t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.CANCELLED && t.due_date && new Date(t.due_date) < now) {
        overdueTasks += 1;
      }
    });

    return {
      tasks: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      summary: {
        totalTasks: allScopedTasks.length,
        countByStatus,
        countByPriority,
        pendingTasks: countByStatus[TASK_STATUS.PENDING] || 0,
        inProgressTasks: countByStatus[TASK_STATUS.IN_PROGRESS] || 0,
        completedTasks: countByStatus[TASK_STATUS.COMPLETED] || 0,
        overdueTasks,
      },
    };
  }

  /**
   * Retrieves single task by ID
   */
  static async getTaskById(id, user) {
    const task = await TaskService.findTaskOrFail(id, user);
    return task.toJSON();
  }

  /**
   * Updates an existing task
   */
  static async updateTask(id, updateData, user) {
    const task = await TaskService.findTaskOrFail(id, user);

    if (updateData.assigned_user_id !== undefined) {
      if (user.role === ROLES.EMPLOYEE && updateData.assigned_user_id !== user.id) {
        const err = new Error('Employees cannot reassign tasks.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (updateData.assigned_user_id) {
        const assignee = await User.findByPk(updateData.assigned_user_id);
        if (!assignee || !assignee.is_active) {
          const err = new Error('Assigned user not found or inactive.');
          err.statusCode = 400;
          err.code = 'INVALID_ASSIGNEE';
          throw err;
        }
      }
      task.assigned_user_id = updateData.assigned_user_id || null;
    }

    if (updateData.title !== undefined) task.title = updateData.title.trim();
    if (updateData.description !== undefined) task.description = updateData.description ? updateData.description.trim() : null;
    if (updateData.priority !== undefined) task.priority = updateData.priority;
    if (updateData.due_date !== undefined) task.due_date = updateData.due_date ? new Date(updateData.due_date) : null;
    if (updateData.lead_id !== undefined) task.lead_id = updateData.lead_id || null;
    if (updateData.deal_id !== undefined) task.deal_id = updateData.deal_id || null;
    if (updateData.project_id !== undefined) task.project_id = updateData.project_id || null;

    const oldStatus = task.status;
    if (updateData.status !== undefined && isValidTaskStatus(updateData.status)) {
      task.status = updateData.status;
      if (task.status === TASK_STATUS.COMPLETED) {
        task.completed_at = new Date();
      } else {
        task.completed_at = null;
      }
    }

    await task.save();

    // Activity log
    if (oldStatus !== task.status) {
      const type = task.status === TASK_STATUS.COMPLETED ? 'task_completed' : 'task_status_changed';
      await ActivityService.log({
        type,
        description: `Task "${task.title}" status changed from ${oldStatus} to ${task.status}.`,
        user_id: user.id,
        task_id: task.id,
        lead_id: task.lead_id,
        deal_id: task.deal_id,
        project_id: task.project_id,
        metadata: { from: oldStatus, to: task.status },
      });
    } else {
      await ActivityService.log({
        type: 'task_updated',
        description: `Task "${task.title}" was updated by ${user.name || user.email}.`,
        user_id: user.id,
        task_id: task.id,
        lead_id: task.lead_id,
        deal_id: task.deal_id,
        project_id: task.project_id,
      });
    }

    await task.reload({
      include: [
        { model: User, as: 'assignedUser', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Lead, as: 'lead', attributes: SAFE_LEAD_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
      ],
    });

    return task.toJSON();
  }

  /**
   * Updates task status
   */
  static async updateTaskStatus(id, status, user) {
    const task = await TaskService.findTaskOrFail(id, user);
    const oldStatus = task.status;
    task.status = status;
    if (status === TASK_STATUS.COMPLETED) {
      task.completed_at = new Date();
    } else {
      task.completed_at = null;
    }
    await task.save();

    const type = status === TASK_STATUS.COMPLETED ? 'task_completed' : 'task_status_changed';
    await ActivityService.log({
      type,
      description: `Task "${task.title}" marked as ${status} by ${user.name || user.email}.`,
      user_id: user.id,
      task_id: task.id,
      lead_id: task.lead_id,
      deal_id: task.deal_id,
      project_id: task.project_id,
      metadata: { from: oldStatus, to: status },
    });

    await task.reload({
      include: [
        { model: User, as: 'assignedUser', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Lead, as: 'lead', attributes: SAFE_LEAD_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
      ],
    });

    return task.toJSON();
  }

  /**
   * Assigns or reassigns task
   */
  static async assignTask(id, assignedUserId, user) {
    const task = await TaskService.findTaskOrFail(id, user);

    if (assignedUserId) {
      const assignee = await User.findByPk(assignedUserId);
      if (!assignee || !assignee.is_active) {
        const err = new Error('Assigned user not found or inactive.');
        err.statusCode = 400;
        err.code = 'INVALID_ASSIGNEE';
        throw err;
      }
      task.assigned_user_id = assignedUserId;
    } else {
      task.assigned_user_id = null;
    }

    await task.save();

    await ActivityService.log({
      type: 'task_updated',
      description: `Task "${task.title}" reassigned by ${user.name || user.email}.`,
      user_id: user.id,
      task_id: task.id,
      lead_id: task.lead_id,
      deal_id: task.deal_id,
      project_id: task.project_id,
      metadata: { assigned_user_id: assignedUserId },
    });

    await task.reload({
      include: [
        { model: User, as: 'assignedUser', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Lead, as: 'lead', attributes: SAFE_LEAD_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
      ],
    });

    return task.toJSON();
  }

  /**
   * Soft-deletes a task (Admin only)
   */
  static async deleteTask(id, user) {
    const task = await TaskService.findTaskOrFail(id, user);
    await task.destroy();

    await ActivityService.log({
      type: 'task_updated',
      description: `Task "${task.title}" was deleted by ${user.name || user.email}.`,
      user_id: user.id,
      task_id: task.id,
      lead_id: task.lead_id,
      deal_id: task.deal_id,
      project_id: task.project_id,
    });

    return true;
  }
}

export default TaskService;
