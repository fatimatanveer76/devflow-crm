import { sequelize, Sequelize, testDbConnection } from '../../config/database.js';
import { uuidPrimaryKey, createModelOptions } from './baseModel.js';

/**
 * DevFlow CRM Model Registry
 *
 * Future phases will register entity models into this registry.
 * Models are exported alongside the singleton Sequelize instance.
 */
const db = {
  sequelize,
  Sequelize,
  testDbConnection,
  uuidPrimaryKey,
  createModelOptions,
  models: {},
};

export {
  sequelize,
  Sequelize,
  testDbConnection,
  uuidPrimaryKey,
  createModelOptions,
};

export default db;
