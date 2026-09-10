import { sequelize, Sequelize, testDbConnection } from '../../config/database.js';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import { initUser, User } from './user.model.js';
import { initRefreshToken, RefreshToken } from './refreshToken.model.js';
import { initLead, Lead } from './lead.model.js';
import { initDeal, Deal } from './deal.model.js';
import { initProject, Project } from './project.model.js';
import { initTask, Task } from './task.model.js';
import { initNote, Note } from './note.model.js';
import { initActivity, Activity } from './activity.model.js';

// Initialize all models
initUser(sequelize);
initRefreshToken(sequelize);
initLead(sequelize);
initDeal(sequelize);
initProject(sequelize);
initTask(sequelize);
initNote(sequelize);
initActivity(sequelize);

// User & Token associations
User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Lead associations
Lead.belongsTo(User, {
  foreignKey: 'assigned_user_id',
  as: 'assignedUser',
  onDelete: 'SET NULL',
});

Lead.belongsTo(User, {
  foreignKey: 'created_by_id',
  as: 'creator',
  onDelete: 'SET NULL',
});

User.hasMany(Lead, {
  foreignKey: 'assigned_user_id',
  as: 'assignedLeads',
});

User.hasMany(Lead, {
  foreignKey: 'created_by_id',
  as: 'createdLeads',
});

// Deal associations
Deal.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
  onDelete: 'SET NULL',
});

Lead.hasMany(Deal, {
  foreignKey: 'lead_id',
  as: 'deals',
});

Deal.belongsTo(User, {
  foreignKey: 'assigned_user_id',
  as: 'assignedUser',
  onDelete: 'SET NULL',
});

User.hasMany(Deal, {
  foreignKey: 'assigned_user_id',
  as: 'assignedDeals',
});

Deal.belongsTo(User, {
  foreignKey: 'created_by_id',
  as: 'creator',
  onDelete: 'SET NULL',
});

User.hasMany(Deal, {
  foreignKey: 'created_by_id',
  as: 'createdDeals',
});

// Project associations
Project.belongsTo(Deal, {
  foreignKey: 'deal_id',
  as: 'deal',
  onDelete: 'SET NULL',
});

Deal.hasMany(Project, {
  foreignKey: 'deal_id',
  as: 'projects',
});

Project.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
  onDelete: 'SET NULL',
});

Lead.hasMany(Project, {
  foreignKey: 'lead_id',
  as: 'projects',
});

Project.belongsTo(User, {
  foreignKey: 'assigned_user_id',
  as: 'assignedUser',
  onDelete: 'SET NULL',
});

User.hasMany(Project, {
  foreignKey: 'assigned_user_id',
  as: 'assignedProjects',
});

Project.belongsTo(User, {
  foreignKey: 'created_by_id',
  as: 'creator',
  onDelete: 'SET NULL',
});

User.hasMany(Project, {
  foreignKey: 'created_by_id',
  as: 'createdProjects',
});

// Task associations
Task.belongsTo(User, {
  foreignKey: 'assigned_user_id',
  as: 'assignedUser',
  onDelete: 'SET NULL',
});

User.hasMany(Task, {
  foreignKey: 'assigned_user_id',
  as: 'assignedTasks',
});

Task.belongsTo(User, {
  foreignKey: 'created_by_id',
  as: 'creator',
  onDelete: 'SET NULL',
});

User.hasMany(Task, {
  foreignKey: 'created_by_id',
  as: 'createdTasks',
});

Task.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
  onDelete: 'SET NULL',
});

Lead.hasMany(Task, {
  foreignKey: 'lead_id',
  as: 'tasks',
});

Task.belongsTo(Deal, {
  foreignKey: 'deal_id',
  as: 'deal',
  onDelete: 'SET NULL',
});

Deal.hasMany(Task, {
  foreignKey: 'deal_id',
  as: 'tasks',
});

Task.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
  onDelete: 'SET NULL',
});

Project.hasMany(Task, {
  foreignKey: 'project_id',
  as: 'tasks',
});

// Note associations
Note.belongsTo(User, {
  foreignKey: 'created_by_id',
  as: 'creator',
  onDelete: 'SET NULL',
});

User.hasMany(Note, {
  foreignKey: 'created_by_id',
  as: 'authoredNotes',
});

Note.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
  onDelete: 'SET NULL',
});

Lead.hasMany(Note, {
  foreignKey: 'lead_id',
  as: 'entityNotes',
});

Note.belongsTo(Deal, {
  foreignKey: 'deal_id',
  as: 'deal',
  onDelete: 'SET NULL',
});

Deal.hasMany(Note, {
  foreignKey: 'deal_id',
  as: 'entityNotes',
});

Note.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
  onDelete: 'SET NULL',
});

Project.hasMany(Note, {
  foreignKey: 'project_id',
  as: 'entityNotes',
});

Note.belongsTo(Task, {
  foreignKey: 'task_id',
  as: 'task',
  onDelete: 'SET NULL',
});

Task.hasMany(Note, {
  foreignKey: 'task_id',
  as: 'entityNotes',
});

// Activity associations
Activity.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'SET NULL',
});

User.hasMany(Activity, {
  foreignKey: 'user_id',
  as: 'activities',
});

Activity.belongsTo(Lead, {
  foreignKey: 'lead_id',
  as: 'lead',
  onDelete: 'SET NULL',
});

Lead.hasMany(Activity, {
  foreignKey: 'lead_id',
  as: 'activities',
});

Activity.belongsTo(Deal, {
  foreignKey: 'deal_id',
  as: 'deal',
  onDelete: 'SET NULL',
});

Deal.hasMany(Activity, {
  foreignKey: 'deal_id',
  as: 'activities',
});

Activity.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
  onDelete: 'SET NULL',
});

Project.hasMany(Activity, {
  foreignKey: 'project_id',
  as: 'activities',
});

Activity.belongsTo(Task, {
  foreignKey: 'task_id',
  as: 'task',
  onDelete: 'SET NULL',
});

Task.hasMany(Activity, {
  foreignKey: 'task_id',
  as: 'activities',
});

const models = {
  User,
  RefreshToken,
  Lead,
  Deal,
  Project,
  Task,
  Note,
  Activity,
};

const db = {
  sequelize,
  Sequelize,
  testDbConnection,
  uuidPrimaryKey,
  createModelOptions,
  models,
  User,
  RefreshToken,
  Lead,
  Deal,
  Project,
  Task,
  Note,
  Activity,
};

export {
  sequelize,
  Sequelize,
  testDbConnection,
  uuidPrimaryKey,
  createModelOptions,
  models,
  User,
  RefreshToken,
  Lead,
  Deal,
  Project,
  Task,
  Note,
  Activity,
};

export default db;
