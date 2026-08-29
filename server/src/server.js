import app from './app.js';
import { config } from './config/env.js';
import { testDbConnection } from './config/database.js';

const startServer = async () => {
  try {
    // Probe database connection on startup (non-fatal for foundation phase)
    const dbStatus = await testDbConnection();
    if (dbStatus.connected) {
      console.log('✓ PostgreSQL database connected successfully.');
    } else {
      console.warn(`! Database connection note: ${dbStatus.error}`);
    }

    const server = app.listen(config.port, () => {
      console.log(`===========================================`);
      console.log(` DevFlow CRM Backend Server Running`);
      console.log(` Port:        ${config.port}`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(` Health:      http://localhost:${config.port}/api/v1/health`);
      console.log(`===========================================`);
    });

    // Graceful shutdown handlers
    const shutdown = () => {
      console.log('\nGracefully shutting down DevFlow server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
