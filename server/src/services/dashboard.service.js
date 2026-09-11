import { Op } from 'sequelize';
import { sequelize, Lead, Deal, Project, Task, User, Activity } from '../database/models/index.js';
import { ROLES } from '../config/roles.js';

export class DashboardService {
  /**
   * Parses and validates start and end dates for time-range filtering.
   * @param {string} startDateStr
   * @param {string} endDateStr
   * @returns {{ startDate: Date|null, endDate: Date|null }}
   */
  static parseDateRange(startDateStr, endDateStr) {
    let startDate = null;
    let endDate = null;

    if (startDateStr) {
      const d = new Date(startDateStr);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        startDate = d;
      }
    }

    if (endDateStr) {
      const d = new Date(endDateStr);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        endDate = d;
      }
    }

    return { startDate, endDate };
  }

  /**
   * Retrieves aggregated dashboard summary metrics with RBAC scoping and date filtering.
   * @param {Object} query - Query parameters (start_date, end_date)
   * @param {Object} user - Authenticated user identity
   * @returns {Promise<Object>} Aggregated metrics
   */
  static async getSummaryMetrics(query = {}, user) {
    const { startDate, endDate } = this.parseDateRange(query.start_date, query.end_date);

    // Build date filter clause if valid dates were provided
    const dateClause = {};
    if (startDate && endDate) {
      dateClause.created_at = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      dateClause.created_at = { [Op.gte]: startDate };
    } else if (endDate) {
      dateClause.created_at = { [Op.lte]: endDate };
    }

    // Role-based data scoping
    const isEmployee = user.role === ROLES.EMPLOYEE;

    const leadWhere = isEmployee ? { assigned_user_id: user.id, ...dateClause } : { ...dateClause };
    const dealWhere = isEmployee ? { assigned_user_id: user.id, ...dateClause } : { ...dateClause };
    const projectWhere = isEmployee ? { assigned_user_id: user.id, ...dateClause } : { ...dateClause };
    const taskWhere = isEmployee
      ? { [Op.or]: [{ assigned_user_id: user.id }, { created_by_id: user.id }], ...dateClause }
      : { ...dateClause };

    const activityWhere = isEmployee
      ? { user_id: user.id, ...(startDate || endDate ? { created_at: dateClause.created_at } : {}) }
      : (startDate || endDate ? { created_at: dateClause.created_at } : {});

    // 1. CRM Overview Counts
    const [
      totalLeads,
      totalDeals,
      totalProjects,
      totalTasks,
      totalUsers,
    ] = await Promise.all([
      Lead.count({ where: leadWhere }),
      Deal.count({ where: dealWhere }),
      Project.count({ where: projectWhere }),
      Task.count({ where: taskWhere }),
      !isEmployee ? User.count() : Promise.resolve(null),
    ]);

    // 2. Lead Metrics
    const [leadsByStatusRaw, leadsBySourceRaw, leadsByPriorityRaw, recentLeads] = await Promise.all([
      Lead.findAll({
        where: leadWhere,
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Lead.findAll({
        where: leadWhere,
        attributes: ['source', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['source'],
        raw: true,
      }),
      Lead.findAll({
        where: leadWhere,
        attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['priority'],
        raw: true,
      }),
      Lead.findAll({
        where: leadWhere,
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'name', 'company', 'email', 'status', 'priority', 'created_at'],
        raw: true,
      }),
    ]);

    const leadsByStatus = {};
    leadsByStatusRaw.forEach((row) => {
      leadsByStatus[row.status] = parseInt(row.count, 10) || 0;
    });

    const leadsBySource = {};
    leadsBySourceRaw.forEach((row) => {
      leadsBySource[row.source || 'unspecified'] = parseInt(row.count, 10) || 0;
    });

    const leadsByPriority = {};
    leadsByPriorityRaw.forEach((row) => {
      leadsByPriority[row.priority] = parseInt(row.count, 10) || 0;
    });

    // 3. Deal Metrics
    const [dealStatusValuesRaw, dealsByStageRaw, recentDeals] = await Promise.all([
      Deal.findAll({
        where: dealWhere,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('value')), 'totalValue'],
        ],
        group: ['status'],
        raw: true,
      }),
      Deal.findAll({
        where: dealWhere,
        attributes: [
          'stage',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('value')), 'totalValue'],
        ],
        group: ['stage'],
        raw: true,
      }),
      Deal.findAll({
        where: dealWhere,
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'title', 'value', 'currency', 'stage', 'status', 'created_at'],
        raw: true,
      }),
    ]);

    let totalDealValue = 0;
    let openDealValue = 0;
    let wonDealValue = 0;
    let lostDealValue = 0;
    const dealsByStatus = {};

    dealStatusValuesRaw.forEach((row) => {
      const val = parseFloat(row.totalValue) || 0;
      const count = parseInt(row.count, 10) || 0;
      dealsByStatus[row.status] = count;
      totalDealValue += val;

      if (row.status === 'won') wonDealValue += val;
      else if (row.status === 'lost') lostDealValue += val;
      else openDealValue += val;
    });

    const dealsByStage = {};
    dealsByStageRaw.forEach((row) => {
      dealsByStage[row.stage] = {
        count: parseInt(row.count, 10) || 0,
        value: parseFloat(row.totalValue) || 0,
      };
    });

    // 4. Project Metrics
    const [projectsByStatusRaw, projectsByPriorityRaw, totalProjectBudgetRaw, recentProjects] = await Promise.all([
      Project.findAll({
        where: projectWhere,
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Project.findAll({
        where: projectWhere,
        attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['priority'],
        raw: true,
      }),
      Project.sum('budget', { where: projectWhere }),
      Project.findAll({
        where: projectWhere,
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'name', 'status', 'priority', 'budget', 'created_at'],
        raw: true,
      }),
    ]);

    const projectsByStatus = {};
    projectsByStatusRaw.forEach((row) => {
      projectsByStatus[row.status] = parseInt(row.count, 10) || 0;
    });

    const projectsByPriority = {};
    projectsByPriorityRaw.forEach((row) => {
      projectsByPriority[row.priority] = parseInt(row.count, 10) || 0;
    });

    const totalProjectBudget = parseFloat(totalProjectBudgetRaw) || 0;

    // 5. Task Metrics
    const overdueTaskWhere = {
      ...taskWhere,
      due_date: { [Op.lt]: new Date() },
      status: { [Op.notIn]: ['completed', 'cancelled'] },
    };

    const [tasksByStatusRaw, tasksByPriorityRaw, overdueTasks] = await Promise.all([
      Task.findAll({
        where: taskWhere,
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Task.findAll({
        where: taskWhere,
        attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['priority'],
        raw: true,
      }),
      Task.count({ where: overdueTaskWhere }),
    ]);

    const tasksByStatus = {};
    tasksByStatusRaw.forEach((row) => {
      tasksByStatus[row.status] = parseInt(row.count, 10) || 0;
    });

    const tasksByPriority = {};
    tasksByPriorityRaw.forEach((row) => {
      tasksByPriority[row.priority] = parseInt(row.count, 10) || 0;
    });

    // 6. Activity Metrics
    const [recentActivityCount, recentActivities] = await Promise.all([
      Activity.count({ where: activityWhere }),
      Activity.findAll({
        where: activityWhere,
        limit: 8,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role'],
          },
        ],
      }),
    ]);

    return {
      range: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
      overview: {
        totalLeads,
        totalDeals,
        totalProjects,
        totalTasks,
        totalUsers,
      },
      leads: {
        total: totalLeads,
        byStatus: leadsByStatus,
        bySource: leadsBySource,
        byPriority: leadsByPriority,
        recent: recentLeads,
      },
      deals: {
        total: totalDeals,
        totalValue: totalDealValue,
        openValue: openDealValue,
        wonValue: wonDealValue,
        lostValue: lostDealValue,
        byStage: dealsByStage,
        byStatus: dealsByStatus,
        recent: recentDeals,
      },
      projects: {
        total: totalProjects,
        totalBudget: totalProjectBudget,
        byStatus: projectsByStatus,
        byPriority: projectsByPriority,
        activeProjects: projectsByStatus['active'] || 0,
        recent: recentProjects,
      },
      tasks: {
        total: totalTasks,
        pending: tasksByStatus['pending'] || 0,
        inProgress: tasksByStatus['in_progress'] || 0,
        completed: tasksByStatus['completed'] || 0,
        cancelled: tasksByStatus['cancelled'] || 0,
        overdue: overdueTasks,
        byStatus: tasksByStatus,
        byPriority: tasksByPriority,
      },
      activities: {
        totalCount: recentActivityCount,
        recent: recentActivities.map((act) => act.toJSON()),
      },
    };
  }
}

export default DashboardService;
