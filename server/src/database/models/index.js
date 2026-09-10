import { sequelize, Sequelize, testDbConnection } from '../../config/database.js';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';
import { initUser, User } from './user.model.js';
import { initRefreshToken, RefreshToken } from './refreshToken.model.js';
import { initLead, Lead } from './lead.model.js';

// Initialize all models
initUser(sequelize);
initRefreshToken(sequelize);
initLead(sequelize);

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

const models = {
  User,
  RefreshToken,
  Lead,
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
};

export default db;
