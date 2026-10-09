import { Op } from 'sequelize';
import {
  Requirement,
  RequirementVersion,
  User,
  Project,
  Deal,
} from '../database/models/index.js';
import { ROLES } from '../config/roles.js';
import {
  REQUIREMENT_STATUS,
  ALLOWED_STATUS_TRANSITIONS,
  isValidRequirementStatus,
  isValidRequirementPriority,
  isValidRequirementType,
} from '../config/requirements.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';
import { ActivityService } from './activity.service.js';

const SAFE_USER_ATTRIBUTES = ['id', 'name', 'email', 'role'];
const SAFE_PROJECT_ATTRIBUTES = ['id', 'name', 'status', 'priority'];
const SAFE_DEAL_ATTRIBUTES = ['id', 'title', 'stage', 'status', 'value', 'currency'];

/**
 * Creates an immutable version snapshot of a requirement before an update or transition.
 * This is an internal helper — append-only; records are never mutated once written.
 */
async function snapshotVersion(requirement, changeSummary, userId) {
  return await RequirementVersion.create({
    requirement_id: requirement.id,
    version_number: requirement.version_number,
    title: requirement.title,
    description: requirement.description,
    type: requirement.type,
    status: requirement.status,
    priority: requirement.priority,
    tags: requirement.tags || [],
    change_summary: changeSummary || null,
    created_by_id: userId,
  });
}

export class RequirementService {
  /**
   * Finds a requirement by PK with associations and enforces role-based data scoping.
   * Employees may only access requirements for projects/deals assigned to them or created by them.
   * @param {string} id - Requirement UUID
   * @param {Object} user - Authenticated user identity (req.user)
   * @returns {Promise<Requirement>}
   */
  static async findRequirementOrFail(id, user) {
    if (!isValidUUID(id)) {
      const err = new Error('Invalid requirement ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const req = await Requirement.findByPk(id, {
      include: [
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'approver', attributes: SAFE_USER_ATTRIBUTES },
      ],
    });

    if (!req) {
      const err = new Error('Requirement not found.');
      err.statusCode = 404;
      err.code = 'REQUIREMENT_NOT_FOUND';
      throw err;
    }

    // Object-level authorization for employees
    if (user.role === ROLES.EMPLOYEE) {
      const canAccess = await RequirementService._employeeCanAccess(req, user.id);
      if (!canAccess) {
        const err = new Error('You do not have permission to access this requirement.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    return req;
  }

  /**
   * Internal check: can an employee user access this requirement?
   * @param {Requirement} req
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  static async _employeeCanAccess(req, userId) {
    if (req.created_by_id === userId) return true;

    // Check if the associated project or deal is assigned to this user
    if (req.project_id) {
      const project = await Project.findByPk(req.project_id);
      if (project && project.assigned_user_id === userId) return true;
    }
    if (req.deal_id) {
      const deal = await Deal.findByPk(req.deal_id);
      if (deal && deal.assigned_user_id === userId) return true;
    }
    return false;
  }

  /**
   * Creates a new requirement in Draft status.
   * Logs creation activity in the activity stream.
   * @param {Object} data - Input fields
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>} Created requirement
   */
  static async createRequirement(data, user) {
    const { title, description, type, priority, project_id, deal_id, tags } = data;

    // Validate parent entity references
    if (project_id) {
      if (!isValidUUID(project_id)) {
        const err = new Error('Invalid project ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const project = await Project.findByPk(project_id);
      if (!project) {
        const err = new Error('Project not found.');
        err.statusCode = 404;
        err.code = 'PROJECT_NOT_FOUND';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && project.assigned_user_id !== user.id) {
        const err = new Error('You may only create requirements for projects assigned to you.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    if (deal_id) {
      if (!isValidUUID(deal_id)) {
        const err = new Error('Invalid deal ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      const deal = await Deal.findByPk(deal_id);
      if (!deal) {
        const err = new Error('Deal not found.');
        err.statusCode = 404;
        err.code = 'DEAL_NOT_FOUND';
        throw err;
      }
      if (user.role === ROLES.EMPLOYEE && deal.assigned_user_id !== user.id) {
        const err = new Error('You may only create requirements for deals assigned to you.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    const requirement = await Requirement.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      type: type || 'functional',
      status: REQUIREMENT_STATUS.DRAFT,
      priority: priority || 'medium',
      version_number: 1,
      project_id: project_id || null,
      deal_id: deal_id || null,
      created_by_id: user.id,
      tags: Array.isArray(tags) ? tags : [],
    });

    await requirement.reload({
      include: [
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES },
      ],
    });

    // Log activity
    await ActivityService.log({
      type: 'requirement_created',
      description: `Requirement "${requirement.title}" (v1) was created by ${user.name || user.email}.`,
      user_id: user.id,
      project_id: requirement.project_id || null,
      deal_id: requirement.deal_id || null,
      metadata: {
        requirement_id: requirement.id,
        version_number: 1,
        type: requirement.type,
        priority: requirement.priority,
      },
    });

    return requirement.toJSON();
  }

  /**
   * Returns a paginated list of requirements with optional filters.
   * Employees see only requirements for entities assigned to them or created by them.
   * @param {Object} query - Filter/pagination params
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<{requirements: Array, total, page, limit, totalPages}>}
   */
  static async listRequirements(query = {}, user) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    const where = {};
    const isEmployee = user.role === ROLES.EMPLOYEE;

    // Entity scope filters
    if (query.project_id) {
      if (!isValidUUID(query.project_id)) {
        const err = new Error('Invalid project ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      where.project_id = query.project_id;
    }

    if (query.deal_id) {
      if (!isValidUUID(query.deal_id)) {
        const err = new Error('Invalid deal ID format.');
        err.statusCode = 400;
        err.code = 'INVALID_UUID';
        throw err;
      }
      where.deal_id = query.deal_id;
    }

    if (query.status && isValidRequirementStatus(query.status)) {
      where.status = query.status;
    }

    if (query.type && isValidRequirementType(query.type)) {
      where.type = query.type;
    }

    if (query.priority && isValidRequirementPriority(query.priority)) {
      where.priority = query.priority;
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
      ];
    }

    // Default employee scoping when no entity filter was provided
    if (isEmployee && !query.project_id && !query.deal_id) {
      const [assignedProjects, assignedDeals] = await Promise.all([
        Project.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
        Deal.findAll({ where: { assigned_user_id: user.id }, attributes: ['id'], raw: true }),
      ]);

      const projectIds = assignedProjects.map((p) => p.id);
      const dealIds = assignedDeals.map((d) => d.id);

      const employeeScope = [
        { created_by_id: user.id },
        ...(projectIds.length > 0 ? [{ project_id: { [Op.in]: projectIds } }] : []),
        ...(dealIds.length > 0 ? [{ deal_id: { [Op.in]: dealIds } }] : []),
      ];

      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, { [Op.or]: employeeScope }];
        delete where[Op.or];
      } else {
        where[Op.or] = employeeScope;
      }
    }

    const { count, rows } = await Requirement.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'approver', attributes: SAFE_USER_ATTRIBUTES },
      ],
      distinct: true,
    });

    return {
      requirements: rows.map((r) => r.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  /**
   * Returns a single requirement with full version history snapshots.
   * @param {string} id - Requirement UUID
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>}
   */
  static async getRequirementById(id, user) {
    const req = await RequirementService.findRequirementOrFail(id, user);

    const versions = await RequirementVersion.findAll({
      where: { requirement_id: id },
      order: [['version_number', 'DESC']],
      include: [{ model: User, as: 'author', attributes: SAFE_USER_ATTRIBUTES }],
    });

    return {
      ...req.toJSON?.() ?? req,
      versions: versions.map((v) => v.toJSON()),
    };
  }

  /**
   * Updates a requirement. Snapshots the current version into immutable history before applying changes.
   * Increments version_number by 1.
   * @param {string} id - Requirement UUID
   * @param {Object} data - Fields to update
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>} Updated requirement
   */
  static async updateRequirement(id, data, user) {
    const req = await RequirementService.findRequirementOrFail(id, user);

    // Prevent employees from modifying approved, published, or archived requirements
    if (
      user.role === ROLES.EMPLOYEE &&
      [REQUIREMENT_STATUS.APPROVED, REQUIREMENT_STATUS.PUBLISHED, REQUIREMENT_STATUS.ARCHIVED].includes(req.status)
    ) {
      const err = new Error('You cannot modify an approved, published, or archived requirement.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const { title, description, type, priority, tags, change_summary } = data;

    // Snapshot current state to immutable versions table before applying mutations
    await snapshotVersion(
      req,
      change_summary || `Updated from v${req.version_number} to v${req.version_number + 1}.`,
      user.id
    );

    // Apply updates
    if (title !== undefined) req.title = title.trim();
    if (description !== undefined) req.description = description ? description.trim() : null;
    if (type !== undefined && isValidRequirementType(type)) req.type = type;
    if (priority !== undefined && isValidRequirementPriority(priority)) req.priority = priority;
    if (Array.isArray(tags)) req.tags = tags;

    req.version_number += 1;

    // If an approved or published requirement is edited by an admin/manager, move back to draft for re-review
    if ([REQUIREMENT_STATUS.APPROVED, REQUIREMENT_STATUS.PUBLISHED].includes(req.status)) {
      req.status = REQUIREMENT_STATUS.DRAFT;
      req.approved_by_id = null;
      req.approved_at = null;
    }

    await req.save();

    await req.reload({
      include: [
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'approver', attributes: SAFE_USER_ATTRIBUTES },
      ],
    });

    // Log activity
    await ActivityService.log({
      type: 'requirement_updated',
      description: `Requirement "${req.title}" was updated to v${req.version_number} by ${user.name || user.email}.`,
      user_id: user.id,
      project_id: req.project_id || null,
      deal_id: req.deal_id || null,
      metadata: {
        requirement_id: req.id,
        version_number: req.version_number,
        change_summary: change_summary || null,
      },
    });

    return req.toJSON();
  }

  /**
   * Transitions a requirement status (draft, in_review, approved, published, rejected, archived).
   * Validates allowed lifecycle paths and permission constraints.
   * @param {string} id - Requirement UUID
   * @param {string} newStatus - Target status
   * @param {string|null} rejectionReason - Required when rejecting
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>} Updated requirement
   */
  static async changeStatus(id, newStatus, rejectionReason, user) {
    // Normalize in_review / under_review
    const normalizedStatus = newStatus === 'under_review' ? REQUIREMENT_STATUS.IN_REVIEW : newStatus;

    if (!isValidRequirementStatus(normalizedStatus)) {
      const err = new Error(`Invalid status: "${newStatus}".`);
      err.statusCode = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const req = await RequirementService.findRequirementOrFail(id, user);

    // Only admins and managers can approve or reject
    if (
      [REQUIREMENT_STATUS.APPROVED, REQUIREMENT_STATUS.REJECTED].includes(normalizedStatus) &&
      user.role === ROLES.EMPLOYEE
    ) {
      const err = new Error('You do not have permission to approve or reject requirements.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Only admins and managers can publish
    if (normalizedStatus === REQUIREMENT_STATUS.PUBLISHED && user.role === ROLES.EMPLOYEE) {
      const err = new Error('You do not have permission to publish requirements.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Normalize current requirement status for comparison
    const currentStatus = req.status === 'under_review' ? REQUIREMENT_STATUS.IN_REVIEW : req.status;

    // Validate allowed transitions
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(normalizedStatus)) {
      const err = new Error(
        `Cannot transition requirement from "${req.status}" to "${normalizedStatus}".`
      );
      err.statusCode = 422;
      err.code = 'INVALID_TRANSITION';
      throw err;
    }

    // Snapshot before transition
    await snapshotVersion(
      req,
      `Status changed from ${req.status} to ${normalizedStatus}.`,
      user.id
    );

    req.status = normalizedStatus;
    req.version_number += 1;

    let activityType = 'requirement_status_changed';
    let activityDesc = `Requirement "${req.title}" status changed to ${normalizedStatus}.`;

    if (normalizedStatus === REQUIREMENT_STATUS.APPROVED) {
      req.approved_by_id = user.id;
      req.approved_at = new Date();
      req.rejection_reason = null;
      activityType = 'requirement_approved';
      activityDesc = `Requirement "${req.title}" was approved by ${user.name || user.email}.`;
    } else if (normalizedStatus === REQUIREMENT_STATUS.REJECTED) {
      if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
        const err = new Error('A rejection reason is required when rejecting a requirement.');
        err.statusCode = 400;
        err.code = 'REJECTION_REASON_REQUIRED';
        throw err;
      }
      req.rejection_reason = rejectionReason.trim();
      req.approved_by_id = null;
      req.approved_at = null;
      activityType = 'requirement_rejected';
      activityDesc = `Requirement "${req.title}" was rejected by ${user.name || user.email}. Reason: ${req.rejection_reason}`;
    } else if (normalizedStatus === REQUIREMENT_STATUS.PUBLISHED) {
      activityType = 'requirement_published';
      activityDesc = `Requirement "${req.title}" was published by ${user.name || user.email}.`;
    }

    await req.save();

    await req.reload({
      include: [
        { model: Project, as: 'project', attributes: SAFE_PROJECT_ATTRIBUTES },
        { model: Deal, as: 'deal', attributes: SAFE_DEAL_ATTRIBUTES },
        { model: User, as: 'creator', attributes: SAFE_USER_ATTRIBUTES },
        { model: User, as: 'approver', attributes: SAFE_USER_ATTRIBUTES },
      ],
    });

    // Log activity
    await ActivityService.log({
      type: activityType,
      description: activityDesc,
      user_id: user.id,
      project_id: req.project_id || null,
      deal_id: req.deal_id || null,
      metadata: {
        requirement_id: req.id,
        version_number: req.version_number,
        new_status: normalizedStatus,
        rejection_reason: req.rejection_reason || null,
      },
    });

    return req.toJSON();
  }

  /**
   * Approves a requirement (Admin/Manager only).
   */
  static async approveRequirement(id, user) {
    return await RequirementService.changeStatus(id, REQUIREMENT_STATUS.APPROVED, null, user);
  }

  /**
   * Rejects a requirement with a required explanation (Admin/Manager only).
   */
  static async rejectRequirement(id, rejectionReason, user) {
    return await RequirementService.changeStatus(id, REQUIREMENT_STATUS.REJECTED, rejectionReason, user);
  }

  /**
   * Publishes an approved requirement (Admin/Manager only).
   */
  static async publishRequirement(id, user) {
    return await RequirementService.changeStatus(id, REQUIREMENT_STATUS.PUBLISHED, null, user);
  }

  /**
   * Soft-deletes a requirement. Admin only.
   * @param {string} id - Requirement UUID
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<boolean>}
   */
  static async deleteRequirement(id, user) {
    if (user.role !== ROLES.ADMIN) {
      const err = new Error('Only system administrators can delete requirements.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const req = await RequirementService.findRequirementOrFail(id, user);
    await req.destroy();
    return true;
  }

  /**
   * Returns the full append-only version history for a requirement.
   * @param {string} id - Requirement UUID
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Array>}
   */
  static async getVersionHistory(id, user) {
    await RequirementService.findRequirementOrFail(id, user); // auth & scoping check

    const versions = await RequirementVersion.findAll({
      where: { requirement_id: id },
      order: [['version_number', 'DESC']],
      include: [{ model: User, as: 'author', attributes: SAFE_USER_ATTRIBUTES }],
    });

    return versions.map((v) => v.toJSON());
  }
}

export default RequirementService;
