import { sequelize, Sequelize, testDbConnection } from '../../config/database.js';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import { initUser, User } from './user.model.js';
import { initRefreshToken, RefreshToken } from './refreshToken.model.js';
import { initLead, Lead } from './lead.model.js';
import { initDeal, Deal } from './deal.model.js';

// Initialize all models
initUser(sequelize);
initRefreshToken(sequelize);
initLead(sequelize);
initDeal(sequelize);

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

const models = {
  User,
  RefreshToken,
  Lead,
  Deal,
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
};

export default db;
