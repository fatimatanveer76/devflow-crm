import { getPermissions } from '../config/roles.js';

/**
 * Authorization middleware — RBAC role guard.
 * Must be used AFTER `authenticate` middleware which sets `req.user`.
 *
 * @param {...string} allowedRoles - One or more role strings that are permitted
 * @returns {Function} Express middleware
 *
 * @example
 * // Single role
 * router.get('/admin-only', authenticate, requireRole('admin'), controller);
 *
 * @example
 * // Multiple roles
 * router.get('/managers-plus', authenticate, requireRole('admin', 'manager'), controller);
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure authenticate() ran first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access this resource.',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware.
 * Checks a named permission from the permissions matrix.
 *
 * @param {string} permission - Key from the PERMISSIONS matrix (e.g. 'canChangeRole')
 * @returns {Function} Express middleware
 *
 * @example
 * router.patch('/:id/role', authenticate, requirePermission('canChangeRole'), controller);
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access this resource.',
      });
    }

    const perms = getPermissions(req.user.role);

    if (!perms[permission]) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};
