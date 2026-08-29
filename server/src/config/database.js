import { Sequelize } from 'sequelize';
import { config } from './env.js';

export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

/**
 * Tests database connectivity
 * @returns {Promise<{connected: boolean, error: string|null}>}
 */
export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};
