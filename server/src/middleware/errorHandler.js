import { config } from '../config/env.js';

/**
 * Centralized error-handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = err.errors?.[0]?.message || 'A record with this information already exists.';
    errors = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error.';
    errors = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
  }

  const isProduction = config.nodeEnv === 'production';

  const response = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(err.code && { code: err.code }),
  };

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
