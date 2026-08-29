import { config } from '../config/env.js';
import { testDbConnection } from '../config/database.js';

/**
 * Controller to handle system health check
 */
export const getHealth = async (req, res, next) => {
  try {
    const dbStatus = await testDbConnection();

    const healthData = {
      server: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: config.nodeEnv,
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        dialect: config.db.dialect,
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
      },
    };

    return res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};
