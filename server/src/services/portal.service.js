import { Op } from 'sequelize';
import {
  Project,
  Task,
  Requirement,
  RequirementVersion,
  User,
  ClientProfile,
  Activity,
} from '../database/models/index.js';
import { isValidUUID } from '../middleware/leadValidate.middleware.js';

const SAFE_PROJECT_ATTRIBUTES = [
  'id',
  'name',
  'description',
  'status',
  'priority',
  'start_date',
  'due_date',
  'created_at',
  'updated_at',
];

const SAFE_TASK_ATTRIBUTES = [
  'id',
  'title',
  'description',
  'status',
  'priority',
  'due_date',
  'completed_at',
];

const SAFE_REQUIREMENT_ATTRIBUTES = [
  'id',
  'title',
  'description',
  'type',
  'status',
  'priority',
  'version_number',
  'tags',
  'project_id',
  'approved_at',
  'created_at',
  'updated_at',
];

export class PortalService {
  /**
   * Retrieves summary metrics and dashboard data strictly for the authenticated client.
   * @param {string} clientId - Authenticated client user UUID (req.user.id)
   * @returns {Promise<Object>}
   */
  static async getDashboard(clientId) {
    // 1. Fetch all projects assigned to this client
    const projects = await Project.findAll({
      where: { client_id: clientId },
      attributes: SAFE_PROJECT_ATTRIBUTES,
      order: [['created_at', 'DESC']],
    });

    const projectIds = projects.map((p) => p.id);

    // 2. Metrics breakdown
    let activeProjects = 0;
    let completedProjects = 0;
    projects.forEach((p) => {
      if (['planning', 'active', 'in_progress', 'on_hold'].includes(p.status)) {
        activeProjects += 1;
      } else if (p.status === 'completed') {
        completedProjects += 1;
      }
    });

    // 3. Count approved & published requirements strictly for this client's projects
    let approvedRequirementsCount = 0;
    let publishedRequirementsCount = 0;

    if (projectIds.length > 0) {
      const [approvedCount, publishedCount] = await Promise.all([
        Requirement.count({
          where: {
            project_id: { [Op.in]: projectIds },
            status: 'approved',
          },
        }),
        Requirement.count({
          where: {
            project_id: { [Op.in]: projectIds },
            status: 'published',
          },
        }),
      ]);
      approvedRequirementsCount = approvedCount;
      publishedRequirementsCount = publishedCount;
    }

    // 4. Fetch Client Profile
    const profile = await ClientProfile.findOne({
      where: { user_id: clientId },
    });

    // 5. Fetch recent project activity (if projects exist)
    let recentActivities = [];
    if (projectIds.length > 0) {
      const rawActivities = await Activity.findAll({
        where: {
          project_id: { [Op.in]: projectIds },
          type: {
            [Op.in]: [
              'project_created',
              'project_updated',
              'project_status_changed',
              'task_completed',
              'requirement_approved',
              'requirement_published',
            ],
          },
        },
        limit: 8,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'type', 'description', 'created_at'],
      });
      recentActivities = rawActivities.map((a) => a.toJSON());
    }

    return {
      metrics: {
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        approvedRequirements: approvedRequirementsCount,
        publishedRequirements: publishedRequirementsCount,
      },
      recentProjects: projects.slice(0, 5).map((p) => p.toJSON()),
      recentActivities,
      clientProfile: profile ? profile.toJSON() : null,
    };
  }

  /**
   * Retrieves all projects assigned to this client with pagination and filters.
   * Strictly isolated: where client_id = clientId.
   */
  static async listProjects(clientId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const where = { client_id: clientId };

    if (query.status && typeof query.status === 'string') {
      where.status = query.status;
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      where.name = { [Op.iLike]: `%${query.search.trim()}%` };
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: SAFE_PROJECT_ATTRIBUTES,
      include: [
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status'],
        },
      ],
      distinct: true,
    });

    // Format output with progress metrics
    const formattedProjects = rows.map((p) => {
      const json = p.toJSON();
      const tasks = json.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      delete json.tasks;
      return {
        ...json,
        totalTasks,
        completedTasks,
        progressPercent,
      };
    });

    return {
      projects: formattedProjects,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  /**
   * Retrieves single project details with tasks and approved/published requirements.
   * Rejects request if project does not belong to the authenticated client.
   */
  static async getProjectById(clientId, projectId) {
    if (!isValidUUID(projectId)) {
      const err = new Error('Invalid project ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    const project = await Project.findOne({
      where: {
        id: projectId,
        client_id: clientId,
      },
      attributes: SAFE_PROJECT_ATTRIBUTES,
      include: [
        {
          model: Task,
          as: 'tasks',
          attributes: SAFE_TASK_ATTRIBUTES,
        },
      ],
    });

    if (!project) {
      const err = new Error('Project not found or you do not have permission to view it.');
      err.statusCode = 404;
      err.code = 'PROJECT_NOT_FOUND';
      throw err;
    }

    // Fetch approved and published requirements strictly for this project
    const requirements = await Requirement.findAll({
      where: {
        project_id: projectId,
        status: { [Op.in]: ['approved', 'published'] },
      },
      attributes: SAFE_REQUIREMENT_ATTRIBUTES,
      order: [['updated_at', 'DESC']],
    });

    const projectJson = project.toJSON();
    const tasks = projectJson.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...projectJson,
      totalTasks,
      completedTasks,
      progressPercent,
      requirements: requirements.map((r) => r.toJSON()),
    };
  }

  /**
   * Lists approved and published requirement specifications across client's projects.
   * Under no circumstances can a client view draft, in_review, or rejected requirements.
   */
  static async listRequirements(clientId, query = {}) {
    // 1. Get client's project IDs
    const clientProjects = await Project.findAll({
      where: { client_id: clientId },
      attributes: ['id', 'name'],
      raw: true,
    });

    const projectIds = clientProjects.map((p) => p.id);
    if (projectIds.length === 0) {
      return {
        requirements: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    // Strict security constraint: status MUST be approved or published
    const where = {
      project_id: { [Op.in]: projectIds },
      status: { [Op.in]: ['approved', 'published'] },
    };

    // Optional user status filter can only narrow to approved OR published
    if (query.status === 'approved' || query.status === 'published') {
      where.status = query.status;
    }

    if (query.project_id && projectIds.includes(query.project_id)) {
      where.project_id = query.project_id;
    }

    if (query.type && typeof query.type === 'string') {
      where.type = query.type;
    }

    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query.search.trim()}%` } },
        { description: { [Op.iLike]: `%${query.search.trim()}%` } },
      ];
    }

    const { count, rows } = await Requirement.findAndCountAll({
      where,
      limit,
      offset,
      order: [['updated_at', 'DESC']],
      attributes: SAFE_REQUIREMENT_ATTRIBUTES,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status'],
        },
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
   * Retrieves single requirement details with immutable version history for a client.
   * Strictly enforces that the requirement belongs to a project assigned to this client
   * and that its status is 'approved' or 'published'.
   */
  static async getRequirementById(clientId, requirementId) {
    if (!isValidUUID(requirementId)) {
      const err = new Error('Invalid requirement ID format.');
      err.statusCode = 400;
      err.code = 'INVALID_UUID';
      throw err;
    }

    // 1. Get client's project IDs
    const clientProjects = await Project.findAll({
      where: { client_id: clientId },
      attributes: ['id'],
      raw: true,
    });
    const projectIds = clientProjects.map((p) => p.id);

    // 2. Query requirement
    const req = await Requirement.findOne({
      where: {
        id: requirementId,
        project_id: { [Op.in]: projectIds },
        status: { [Op.in]: ['approved', 'published'] },
      },
      attributes: SAFE_REQUIREMENT_ATTRIBUTES,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status'],
        },
      ],
    });

    if (!req) {
      const err = new Error('Specification not found or access is restricted.');
      err.statusCode = 404;
      err.code = 'REQUIREMENT_NOT_FOUND';
      throw err;
    }

    // 3. Fetch version snapshots (filtered to approved/published snapshots)
    const versions = await RequirementVersion.findAll({
      where: {
        requirement_id: requirementId,
        status: { [Op.in]: ['approved', 'published'] },
      },
      order: [['version_number', 'DESC']],
      attributes: [
        'id',
        'version_number',
        'title',
        'description',
        'type',
        'status',
        'priority',
        'change_summary',
        'tags',
        'created_at',
      ],
    });

    return {
      ...req.toJSON(),
      versions: versions.map((v) => v.toJSON()),
    };
  }

  /**
   * Retrieves the authenticated client's company profile and contact info.
   */
  static async getProfile(clientId) {
    const user = await User.findByPk(clientId, {
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'created_at'],
      include: [
        {
          model: ClientProfile,
          as: 'clientProfile',
        },
      ],
    });

    if (!user) {
      const err = new Error('Client user not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return user.toJSON();
  }

  /**
   * Updates contact information for the client.
   */
  static async updateProfile(clientId, data) {
    const { name, contact_phone, address, industry } = data;

    const user = await User.findByPk(clientId);
    if (!user) {
      const err = new Error('Client user not found.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
      await user.save();
    }

    let profile = await ClientProfile.findOne({ where: { user_id: clientId } });
    if (!profile) {
      profile = await ClientProfile.create({
        user_id: clientId,
        company_name: user.name + ' Organization',
        contact_phone: contact_phone || null,
        address: address || null,
        industry: industry || null,
      });
    } else {
      if (contact_phone !== undefined) profile.contact_phone = contact_phone;
      if (address !== undefined) profile.address = address;
      if (industry !== undefined) profile.industry = industry;
      await profile.save();
    }

    return await PortalService.getProfile(clientId);
  }
}

export default PortalService;
