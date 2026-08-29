import { Sequelize } from 'sequelize';
import { config } from './env.js';

const dialectOptions = {};
if (config.db.ssl) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
    pool: {
      max: config.db.pool.max,
      min: config.db.pool.min,
      acquire: config.db.pool.acquire,
      idle: config.db.pool.idle,
    },
    dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false,
    },
  }
);

/**
 * Tests database connectivity using sequelize.authenticate()
 * @returns {Promise<{connected: boolean, error: string|null}>}
 */
export const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    return { connected: true, error: null };
  } catch (error) {
    // Sanitize error message to prevent leaking credentials or connection strings
    const sanitizedError = error.name || 'Database connection error';
    return {
      connected: false,
      error: sanitizedError,
      details: config.nodeEnv === 'development' ? error.message : undefined,
    };
  }
};

export { Sequelize };
