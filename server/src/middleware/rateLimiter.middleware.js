import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Factory for creating standardized rate limiters matching DevFlow CRM response contract
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests permitted per window per IP
 * @param {string} options.message - Human-readable error message
 * @returns {Function} Express rate limit middleware
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Draft-6 RateLimit headers
    legacyHeaders: false, // X-RateLimit headers disabled
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    },
    skip: () => config.nodeEnv === 'test', // Skip during automated test suites
  });
};

/**
 * Authentication rate limiter for login and registration endpoints.
 * Protects against brute-force credential stuffing while allowing normal usage.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimit?.authWindowMs || 15 * 60 * 1000,
  max: config.rateLimit?.authMax || 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export default {
  createRateLimiter,
  authRateLimiter,
};
