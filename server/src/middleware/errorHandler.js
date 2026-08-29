import { config } from '../config/env.js';

/**
 * Centralized error-handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const isProduction = config.nodeEnv === 'production';

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  };

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
