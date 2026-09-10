import { sequelize, Sequelize, testDbConnection } from '../../config/database.js';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import { initUser, User } from './user.model.js';
import { initRefreshToken, RefreshToken } from './refreshToken.model.js';
import { initLead, Lead } from './lead.model.js';
import { initDeal, Deal } from './deal.model.js';
import { initProject, Project } from './project.model.js';

// Initialize all models
initUser(sequelize);
initRefreshToken(sequelize);
initLead(sequelize);
initDeal(sequelize);
initProject(sequelize);

// Define associations
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

const models = {
  User,
  RefreshToken,
  Lead,
  Deal,
  Project,
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
};

export default db;
