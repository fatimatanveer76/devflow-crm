import { Op } from 'sequelize';
import { Project, Deal, Lead, User } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import {
  ALL_PROJECT_STATUSES,
  isValidProjectStatus,
  isValidProjectPriority,
} from '../config/projects.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role', 'is_active'];
const SAFE_DEAL_ATTRIBUTES = ['id', 'title', 'value', 'currency', 'stage', 'status'];
const SAFE_LEAD_ATTRIBUTES = ['id', 'name', 'company', 'email', 'phone', 'status'];

export class ProjectService {
  /**
   * Finds a project by PK with full associations and enforces role-based data scoping
   * @param {string} id - Project UUID
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Project>}
   */
  static async findProjectOrFail(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid project ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const project = await Project.findByPk(id, {
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
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
      ],
    });

    if (!project) {
      const err = new Error('Project not found.');
      err.statusCode = 404;
      err.code = 'PROJECT_NOT_FOUND';
      throw err;
    }

    // Role-based data scoping: Employees can only view/manage their assigned projects
    if (user.role === ROLES.EMPLOYEE && project.assigned_user_id !== user.id) {
      const err = new Error('You do not have permission to view or manage this project.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return project;
  }

  /**
   * Creates a new project
   * @param {Object} data - Project input payload
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async createProject(data, user) {
    let assignedUserId = data.assigned_user_id || null;

    // Employees cannot assign projects to other users
    if (user.role === ROLES.EMPLOYEE) {
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

    // Validate related Deal if provided
    let dealId = data.deal_id || null;
    let leadId = data.lead_id || null;

    if (dealId) {
      const deal = await Deal.findByPk(dealId);
      if (!deal) {
        const err = new Error('The related deal does not exist.');
        err.statusCode = 400;
        err.code = 'INVALID_DEAL';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && deal.assigned_user_id !== user.id) {
        const err = new Error('You can only attach projects to deals assigned to you.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      // Inherit originating lead from deal if not explicitly provided
      if (!leadId && deal.lead_id) {
        leadId = deal.lead_id;
      }
    }

    // Validate related Lead if provided
    if (leadId) {
      const lead = await Lead.findByPk(leadId);
      if (!lead) {
        const err = new Error('The related lead does not exist.');
        err.statusCode = 400;
        err.code = 'INVALID_LEAD';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && lead.assigned_user_id !== user.id) {
        const err = new Error('You can only attach projects to leads assigned to you.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    const project = await Project.create({
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      status: data.status || undefined,
      priority: data.priority || undefined,
      start_date: data.start_date ? new Date(data.start_date) : null,
      due_date: data.due_date ? new Date(data.due_date) : null,
      budget: data.budget !== undefined ? Number(data.budget) : 0.00,
      currency: data.currency || undefined,
      deal_id: dealId,
      lead_id: leadId,
      assigned_user_id: assignedUserId,
      created_by_id: user.id,
      notes: data.notes ? data.notes.trim() : null,
    });

    await project.reload({
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
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
      ],
    });

    return project.toJSON();
  }

  /**
   * Lists projects with search, status/priority filters, pagination, and metrics summary
   * @param {Object} query - Query parameters
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async listProjects(query = {}, user) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = {};

    // 1. Role-based scoping
    if (user.role === ROLES.EMPLOYEE) {
      where.assigned_user_id = user.id;
    } else if (query.assigned_user_id) {
      if (query.assigned_user_id === 'unassigned') {
        where.assigned_user_id = null;
      } else if (isValidUUID(query.assigned_user_id)) {
        where.assigned_user_id = query.assigned_user_id;
      }
    }

    // 2. Status filter
    if (query.status && isValidProjectStatus(query.status)) {
      where.status = query.status;
    }

    // 3. Priority filter
    if (query.priority && isValidProjectPriority(query.priority)) {
      where.priority = query.priority;
    }

    // 4. Deal / Lead relationship filters
    if (query.deal_id && isValidUUID(query.deal_id)) {
      where.deal_id = query.deal_id;
    }
    if (query.lead_id && isValidUUID(query.lead_id)) {
      where.lead_id = query.lead_id;
    }

    // 5. Search across name, description, notes
    if (query.search && typeof query.search === 'string') {
      const term = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
        { notes: { [Op.iLike]: term } },
      ];
    }

    // 6. Sorting
    const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'name', 'status', 'priority', 'start_date', 'due_date', 'budget'];
    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'created_at';
    const sortOrder = query.sortOrder && query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
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
      ],
      distinct: true,
    });

    // 7. Aggregate summary metrics (scoped to user's permissions)
    const summaryWhere = user.role === ROLES.EMPLOYEE ? { assigned_user_id: user.id } : {};
    const allScopedProjects = await Project.findAll({
      where: summaryWhere,
      attributes: ['status', 'budget'],
    });

    let totalBudget = 0;
    const countByStatus = {};
    ALL_PROJECT_STATUSES.forEach((st) => { countByStatus[st] = 0; });

    allScopedProjects.forEach((p) => {
      const b = parseFloat(p.budget) || 0;
      totalBudget += b;
      if (countByStatus[p.status] !== undefined) {
        countByStatus[p.status] += 1;
      }
    });

    return {
      projects: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      summary: {
        totalProjects: allScopedProjects.length,
        totalBudget,
        countByStatus,
        activeProjects: countByStatus['active'] || 0,
        completedProjects: countByStatus['completed'] || 0,
      },
    };
  }

  /**
   * Retrieves single project by ID
   * @param {string} id
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async getProjectById(id, user) {
    const project = await ProjectService.findProjectOrFail(id, user);
    return project.toJSON();
  }

  /**
   * Updates an existing project
   * @param {string} id
   * @param {Object} updateData
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async updateProject(id, updateData, user) {
    const project = await ProjectService.findProjectOrFail(id, user);

    const fieldsToUpdate = {};

    if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name.trim();
    if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description ? updateData.description.trim() : null;
    if (updateData.status !== undefined && isValidProjectStatus(updateData.status)) fieldsToUpdate.status = updateData.status;
    if (updateData.priority !== undefined && isValidProjectPriority(updateData.priority)) fieldsToUpdate.priority = updateData.priority;
    if (updateData.budget !== undefined) fieldsToUpdate.budget = Number(updateData.budget);
    if (updateData.currency !== undefined) fieldsToUpdate.currency = updateData.currency;
    if (updateData.notes !== undefined) fieldsToUpdate.notes = updateData.notes ? updateData.notes.trim() : null;
    if (updateData.start_date !== undefined) {
      fieldsToUpdate.start_date = updateData.start_date ? new Date(updateData.start_date) : null;
    }
    if (updateData.due_date !== undefined) {
      fieldsToUpdate.due_date = updateData.due_date ? new Date(updateData.due_date) : null;
    }

    // Deal relationship
    if (updateData.deal_id !== undefined) {
      if (updateData.deal_id === null || updateData.deal_id === '') {
        fieldsToUpdate.deal_id = null;
      } else if (isValidUUID(updateData.deal_id)) {
        const deal = await Deal.findByPk(updateData.deal_id);
        if (!deal) {
          const err = new Error('The related deal does not exist.');
          err.statusCode = 400;
          err.code = 'INVALID_DEAL';
          throw err;
        }
        fieldsToUpdate.deal_id = updateData.deal_id;
      }
    }

    // Lead relationship
    if (updateData.lead_id !== undefined) {
      if (updateData.lead_id === null || updateData.lead_id === '') {
        fieldsToUpdate.lead_id = null;
      } else if (isValidUUID(updateData.lead_id)) {
        const lead = await Lead.findByPk(updateData.lead_id);
        if (!lead) {
          const err = new Error('The related lead does not exist.');
          err.statusCode = 400;
          err.code = 'INVALID_LEAD';
          throw err;
        }
        fieldsToUpdate.lead_id = updateData.lead_id;
      }
    }

    // Assignee (Admin & Manager only)
    if (user.role !== ROLES.EMPLOYEE && updateData.assigned_user_id !== undefined) {
      if (updateData.assigned_user_id === null || updateData.assigned_user_id === '') {
        fieldsToUpdate.assigned_user_id = null;
      } else if (isValidUUID(updateData.assigned_user_id)) {
        const assignee = await User.findByPk(updateData.assigned_user_id);
        if (!assignee || !assignee.is_active) {
          const err = new Error('The assigned user does not exist or is inactive.');
          err.statusCode = 400;
          err.code = 'INVALID_ASSIGNEE';
          throw err;
        }
        fieldsToUpdate.assigned_user_id = updateData.assigned_user_id;
      }
    }

    await project.update(fieldsToUpdate);

    await project.reload({
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
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
      ],
    });

    return project.toJSON();
  }

  /**
   * Updates only project status
   * @param {string} id
   * @param {string} status
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async updateProjectStatus(id, status, user) {
    if (!isValidProjectStatus(status)) {
      const err = new Error('Invalid project status.');
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const project = await ProjectService.findProjectOrFail(id, user);
    await project.update({ status });

    await project.reload({
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
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
      ],
    });

    return project.toJSON();
  }

  /**
   * Assigns or reassigns project to a user (Admin/Manager only)
   * @param {string} id
   * @param {string|null} assignedUserId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async assignProject(id, assignedUserId, user) {
    const project = await ProjectService.findProjectOrFail(id, user);

    let targetUserId = null;
    if (assignedUserId) {
      if (!isValidUUID(assignedUserId)) {
        const err = new Error('Invalid assignee UUID.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const assignee = await User.findByPk(assignedUserId);
      if (!assignee || !assignee.is_active) {
        const err = new Error('The assigned user does not exist or is inactive.');
        err.statusCode = 400;
        err.code = 'INVALID_ASSIGNEE';
        throw err;
      }
      targetUserId = assignee.id;
    }

    await project.update({ assigned_user_id: targetUserId });

    await project.reload({
      include: [
        {
          model: Deal,
          as: 'deal',
          attributes: SAFE_DEAL_ATTRIBUTES,
        },
        {
          model: Lead,
          as: 'lead',
          attributes: SAFE_LEAD_ATTRIBUTES,
        },
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
      ],
    });

    return project.toJSON();
  }

  /**
   * Soft-deletes a project (Admin only)
   * @param {string} id
   * @param {Object} user
   * @returns {Promise<void>}
   */
  static async deleteProject(id, user) {
    const project = await ProjectService.findProjectOrFail(id, user);
    await project.destroy(); // paranoid soft-delete
  }
}

export default ProjectService;
