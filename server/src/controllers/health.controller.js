import { config } from '../config/env.js';
import { testDbConnection } from '../config/database.js';

/**
 * Controller to handle system and database health check
 * @route GET /api/v1/health
 */
export const getHealth = async (req, res, next) => {
  try {
    const dbStatus = await testDbConnection();

    const healthData = {
      server: {
        status: 'healthy',
        uptime: `${Math.floor(process.uptime())}s`,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      },
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        dialect: config.db.dialect,
        database: config.db.name,
        ...(dbStatus.connected ? {} : { message: 'Database currently unreachable' }),
      },
    };

    return res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    // Graceful fallback to prevent server crashing on health check failure
    return res.status(200).json({
      success: true,
      data: {
        server: {
          status: 'healthy',
          environment: config.nodeEnv,
          timestamp: new Date().toISOString(),
        },
        database: {
          status: 'disconnected',
          message: 'Database check failed',
        },
      },
    });
  }
};
