import { Op } from 'sequelize';
import { Deal, Lead, User } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import {
  ALL_DEAL_STAGES,
  ALL_DEAL_STATUSES,
  STAGE_PROBABILITY,
  getStatusForStage,
  isValidDealStage,
  isValidDealStatus,
} from '../config/deals.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role', 'is_active'];
const SAFE_LEAD_ATTRIBUTES = ['id', 'name', 'company', 'email', 'phone', 'status', 'priority'];

export class DealService {
  /**
   * Finds a deal by PK with associations and enforces role-based data scoping
   * @param {string} id - Deal UUID
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Deal>}
   */
  static async findDealOrFail(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid deal ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const deal = await Deal.findByPk(id, {
      include: [
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

    if (!deal) {
      const err = new Error('Deal not found.');
      err.statusCode = 404;
      err.code = 'DEAL_NOT_FOUND';
      throw err;
    }

    // Role-based data scoping: Employees can only access deals assigned to them
    if (user.role === ROLES.EMPLOYEE && deal.assigned_user_id !== user.id) {
      const err = new Error('You do not have permission to view or manage this deal.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return deal;
  }

  /**
   * Creates a new deal
   * @param {Object} data - Deal input payload
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async createDeal(data, user) {
    let assignedUserId = data.assigned_user_id || null;

    // Employees cannot assign deals to other users
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

    // Validate related lead if provided
    let leadId = data.lead_id || null;
    if (leadId) {
      const lead = await Lead.findByPk(leadId);
      if (!lead) {
        const err = new Error('The related lead does not exist.');
        err.statusCode = 400;
        err.code = 'INVALID_LEAD';
        throw err;
      }
      // If employee, verify the lead is assigned to them
      if (user.role === ROLES.EMPLOYEE && lead.assigned_user_id !== user.id) {
        const err = new Error('You can only attach deals to leads assigned to you.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    const stage = data.stage || undefined;
    const probability = data.probability !== undefined && data.probability !== null
      ? Number(data.probability)
      : (stage ? STAGE_PROBABILITY[stage] : 20);

    const status = data.status || (stage ? getStatusForStage(stage) : undefined);

    const deal = await Deal.create({
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      lead_id: leadId,
      assigned_user_id: assignedUserId,
      created_by_id: user.id,
      value: data.value !== undefined ? Number(data.value) : 0.00,
      currency: data.currency || undefined,
      stage,
      probability,
      expected_close_date: data.expected_close_date ? new Date(data.expected_close_date) : null,
      status,
      notes: data.notes ? data.notes.trim() : null,
    });

    await deal.reload({
      include: [
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

    return deal.toJSON();
  }

  /**
   * Lists deals with search, stage/status filters, pagination, and summary metrics
   * @param {Object} query - Query parameters
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async listDeals(query = {}, user) {
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

    // 2. Stage filter
    if (query.stage && isValidDealStage(query.stage)) {
      where.stage = query.stage;
    }

    // 3. Status filter
    if (query.status && isValidDealStatus(query.status)) {
      where.status = query.status;
    }

    // 4. Lead relationship filter
    if (query.lead_id && isValidUUID(query.lead_id)) {
      where.lead_id = query.lead_id;
    }

    // 5. Value range filter
    if (query.minValue !== undefined && !isNaN(Number(query.minValue))) {
      where.value = { ...where.value, [Op.gte]: Number(query.minValue) };
    }
    if (query.maxValue !== undefined && !isNaN(Number(query.maxValue))) {
      where.value = { ...where.value, [Op.lte]: Number(query.maxValue) };
    }

    // 6. Search across title, description, notes
    if (query.search && typeof query.search === 'string') {
      const term = `%${query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
        { notes: { [Op.iLike]: term } },
      ];
    }

    // 7. Sorting
    const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'value', 'stage', 'probability', 'expected_close_date', 'status'];
    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'created_at';
    const sortOrder = query.sortOrder && query.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Deal.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
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

    // 8. Pipeline aggregate metrics (scoped to user's permissions)
    const summaryWhere = user.role === ROLES.EMPLOYEE ? { assigned_user_id: user.id } : {};
    const allScopedDeals = await Deal.findAll({
      where: summaryWhere,
      attributes: ['stage', 'status', 'value'],
    });

    let totalPipelineValue = 0;
    let openValue = 0;
    let wonValue = 0;
    let lostValue = 0;
    const countByStage = {};
    ALL_DEAL_STAGES.forEach((st) => { countByStage[st] = 0; });

    allScopedDeals.forEach((d) => {
      const val = parseFloat(d.value) || 0;
      totalPipelineValue += val;
      if (d.status === 'open') openValue += val;
      else if (d.status === 'won') wonValue += val;
      else if (d.status === 'lost') lostValue += val;

      if (countByStage[d.stage] !== undefined) {
        countByStage[d.stage] += 1;
      }
    });

    return {
      deals: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      summary: {
        totalPipelineValue,
        openValue,
        wonValue,
        lostValue,
        countByStage,
        totalDeals: allScopedDeals.length,
      },
    };
  }

  /**
   * Retrieves single deal by ID
   * @param {string} id
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async getDealById(id, user) {
    const deal = await DealService.findDealOrFail(id, user);
    return deal.toJSON();
  }

  /**
   * Updates an existing deal
   * @param {string} id
   * @param {Object} updateData
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async updateDeal(id, updateData, user) {
    const deal = await DealService.findDealOrFail(id, user);

    const fieldsToUpdate = {};

    if (updateData.title !== undefined) fieldsToUpdate.title = updateData.title.trim();
    if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description ? updateData.description.trim() : null;
    if (updateData.value !== undefined) fieldsToUpdate.value = Number(updateData.value);
    if (updateData.currency !== undefined) fieldsToUpdate.currency = updateData.currency;
    if (updateData.notes !== undefined) fieldsToUpdate.notes = updateData.notes ? updateData.notes.trim() : null;
    if (updateData.expected_close_date !== undefined) {
      fieldsToUpdate.expected_close_date = updateData.expected_close_date ? new Date(updateData.expected_close_date) : null;
    }

    // Stage & Status alignment
    if (updateData.stage !== undefined && isValidDealStage(updateData.stage)) {
      fieldsToUpdate.stage = updateData.stage;
      if (updateData.probability === undefined) {
        fieldsToUpdate.probability = STAGE_PROBABILITY[updateData.stage] ?? deal.probability;
      }
      if (updateData.status === undefined) {
        fieldsToUpdate.status = getStatusForStage(updateData.stage);
      }
    }

    if (updateData.probability !== undefined) {
      fieldsToUpdate.probability = Number(updateData.probability);
    }

    if (updateData.status !== undefined && isValidDealStatus(updateData.status)) {
      fieldsToUpdate.status = updateData.status;
    }

    // Lead link
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

    await deal.update(fieldsToUpdate);

    await deal.reload({
      include: [
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

    return deal.toJSON();
  }

  /**
   * Updates deal pipeline stage
   * @param {string} id
   * @param {string} stage
   * @param {number|undefined} probability
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async updateDealStage(id, stage, probability, user) {
    if (!isValidDealStage(stage)) {
      const err = new Error('Invalid deal stage.');
      err.statusCode = 400;
      err.code = 'INVALID_STAGE';
      throw err;
    }

    const deal = await DealService.findLeadDealOrFail(id, user);

    const newProbability = probability !== undefined && probability !== null
      ? Number(probability)
      : (STAGE_PROBABILITY[stage] ?? deal.probability);

    const newStatus = getStatusForStage(stage);

    await deal.update({
      stage,
      probability: newProbability,
      status: newStatus,
    });

    await deal.reload({
      include: [
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

    return deal.toJSON();
  }

  /**
   * Updates deal status (open / won / lost)
   * @param {string} id
   * @param {string} status
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async updateDealStatus(id, status, user) {
    if (!isValidDealStatus(status)) {
      const err = new Error('Invalid deal status.');
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const deal = await DealService.findDealOrFail(id, user);

    const updateFields = { status };
    if (status === 'won' && deal.stage !== 'closed_won') {
      updateFields.stage = 'closed_won';
      updateFields.probability = 100;
    } else if (status === 'lost' && deal.stage !== 'closed_lost') {
      updateFields.stage = 'closed_lost';
      updateFields.probability = 0;
    }

    await deal.update(updateFields);

    await deal.reload({
      include: [
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

    return deal.toJSON();
  }

  /**
   * Assigns or reassigns a deal to a user (Admin/Manager only)
   * @param {string} id
   * @param {string|null} assignedUserId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async assignDeal(id, assignedUserId, user) {
    const deal = await DealService.findDealOrFail(id, user);

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

    await deal.update({ assigned_user_id: targetUserId });

    await deal.reload({
      include: [
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

    return deal.toJSON();
  }

  /**
   * Soft-deletes a deal (Admin only)
   * @param {string} id
   * @param {Object} user
   * @returns {Promise<void>}
   */
  static async deleteDeal(id, user) {
    const deal = await DealService.findDealOrFail(id, user);
    await deal.destroy(); // paranoid soft-delete
  }

  // Alias helper
  static async findLeadDealOrFail(id, user) {
    return DealService.findDealOrFail(id, user);
  }
}

export default DealService;
