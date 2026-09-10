import { Op } from 'sequelize';
import { Lead, User } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import {
  isValidLeadStatus,
  isValidLeadPriority,
  isValidLeadSource,
} from '../config/leads.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role', 'is_active'];

export class LeadService {
  /**
   * Finds a lead by PK with associations and enforces role-based data scoping
   * @param {string} id - Lead UUID
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Lead>}
   */
  static async findLeadOrFail(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid lead ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const lead = await Lead.findByPk(id, {
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
      ],
    });

    if (!lead) {
      const err = new Error('Lead not found.');
      err.statusCode = 404;
      err.code = 'LEAD_NOT_FOUND';
      throw err;
    }

    // Role-based data scoping: Employees can only access leads assigned to them
    if (user.role === ROLES.EMPLOYEE && lead.assigned_user_id !== user.id) {
      const err = new Error('You do not have permission to view or manage this lead.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return lead;
  }

  /**
   * Creates a new lead
   * @param {Object} data - Lead input fields
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Object>} Created lead with associations
   */
  static async createLead(data, user) {
    let assignedUserId = data.assigned_user_id || null;

    // Employees cannot assign leads to other users; default to self or unassigned
    if (user.role === ROLES.EMPLOYEE) {
      assignedUserId = user.id;
    } else if (assignedUserId) {
      // Validate that assigned user exists and is active
      const assignee = await User.findByPk(assignedUserId);
      if (!assignee || !assignee.is_active) {
        const err = new Error('The assigned user does not exist or is inactive.');
        err.statusCode = 400;
        err.code = 'INVALID_ASSIGNEE';
        throw err;
      }
    }

    const lead = await Lead.create({
      name: data.name.trim(),
      email: data.email ? data.email.toLowerCase().trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      company: data.company ? data.company.trim() : null,
      source: data.source || undefined,
      status: data.status || undefined,
      priority: data.priority || undefined,
      notes: data.notes ? data.notes.trim() : null,
      assigned_user_id: assignedUserId,
      created_by_id: user.id,
    });

    // Reload with associations
    await lead.reload({
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
      ],
    });

    return lead.toJSON();
  }

  /**
   * Lists leads with filtering, search, pagination, and sorting
   * @param {Object} query - Query parameters
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<{leads: Array, total: number, page: number, limit: number, totalPages: number}>}
   */
  static async listLeads(query = {}, user) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const where = {};

    // 1. Role-based scoping
    if (user.role === ROLES.EMPLOYEE) {
      // Employees only see their own assigned leads
      where.assigned_user_id = user.id;
    } else if (query.assigned_user_id) {
      // Admin/Manager can filter by assignee
      if (query.assigned_user_id === 'unassigned') {
        where.assigned_user_id = null;
      } else if (isValidUUID(query.assigned_user_id)) {
        where.assigned_user_id = query.assigned_user_id;
      }
    }

    // 2. Status filter
    if (query.status && isValidLeadStatus(query.status)) {
      where.status = query.status;
    }

    // 3. Priority filter
    if (query.priority && isValidLeadPriority(query.priority)) {
      where.priority = query.priority;
    }

    // 4. Source filter
    if (query.source && isValidLeadSource(query.source)) {
      where.source = query.source;
    }

    // 5. Search across name, email, company, phone
    if (query.search && typeof query.search === 'string') {
      const searchTerm = `%${query.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { email: { [Op.iLike]: searchTerm } },
        { company: { [Op.iLike]: searchTerm } },
        { phone: { [Op.iLike]: searchTerm } },
      ];
    }

    // 6. Sorting
    const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'name', 'company', 'status', 'priority', 'source'];
    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'created_at';
    const sortOrder = query.sortOrder && query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Lead.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
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
      ],
      distinct: true, // ensures correct count with joins
    });

    return {
      leads: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  /**
   * Retrieves single lead by ID
   * @param {string} id - Lead UUID
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async getLeadById(id, user) {
    const lead = await LeadService.findLeadOrFail(id, user);
    return lead.toJSON();
  }

  /**
   * Updates an existing lead
   * @param {string} id - Lead UUID
   * @param {Object} updateData - Fields to update
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async updateLead(id, updateData, user) {
    const lead = await LeadService.findLeadOrFail(id, user);

    const fieldsToUpdate = {};

    if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name.trim();
    if (updateData.email !== undefined) fieldsToUpdate.email = updateData.email ? updateData.email.toLowerCase().trim() : null;
    if (updateData.phone !== undefined) fieldsToUpdate.phone = updateData.phone ? updateData.phone.trim() : null;
    if (updateData.company !== undefined) fieldsToUpdate.company = updateData.company ? updateData.company.trim() : null;
    if (updateData.source !== undefined && isValidLeadSource(updateData.source)) fieldsToUpdate.source = updateData.source;
    if (updateData.status !== undefined && isValidLeadStatus(updateData.status)) fieldsToUpdate.status = updateData.status;
    if (updateData.priority !== undefined && isValidLeadPriority(updateData.priority)) fieldsToUpdate.priority = updateData.priority;
    if (updateData.notes !== undefined) fieldsToUpdate.notes = updateData.notes ? updateData.notes.trim() : null;

    // Only Admin & Manager can reassign leads
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

    await lead.update(fieldsToUpdate);

    await lead.reload({
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
      ],
    });

    return lead.toJSON();
  }

  /**
   * Updates only the status of a lead
   * @param {string} id - Lead UUID
   * @param {string} status - New status
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async updateLeadStatus(id, status, user) {
    if (!isValidLeadStatus(status)) {
      const err = new Error('Invalid lead status.');
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const lead = await LeadService.findLeadOrFail(id, user);
    await lead.update({ status });

    await lead.reload({
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
      ],
    });

    return lead.toJSON();
  }

  /**
   * Assigns or reassigns a lead to a user (Admin/Manager only)
   * @param {string} id - Lead UUID
   * @param {string|null} assignedUserId - Assignee UUID or null to unassign
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async assignLead(id, assignedUserId, user) {
    const lead = await LeadService.findLeadOrFail(id, user);

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

    await lead.update({ assigned_user_id: targetUserId });

    await lead.reload({
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
      ],
    });

    return lead.toJSON();
  }

  /**
   * Soft-deletes a lead (Admin only)
   * @param {string} id - Lead UUID
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<void>}
   */
  static async deleteLead(id, user) {
    const lead = await LeadService.findLeadOrFail(id, user);
    await lead.destroy(); // paranoid soft-delete
  }
}

export default LeadService;
