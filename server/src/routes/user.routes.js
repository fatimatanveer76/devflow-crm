import { Router } from 'express';
import {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

// All user management routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/users
 * List all users with pagination.
 * Access: admin, manager
 */
router.get('/', requirePermission('canListUsers'), listUsers);

/**
 * GET /api/v1/users/:id
 * Get a single user by ID.
 * Access: admin, manager
 */
router.get('/:id', requirePermission('canViewUser'), getUserById);

/**
 * PATCH /api/v1/users/:id/role
 * Change a user's role.
 * Access: admin only
 */
router.patch('/:id/role', requirePermission('canChangeRole'), updateUserRole);

/**
 * PATCH /api/v1/users/:id/status
 * Activate or deactivate a user.
 * Access: admin only
 */
router.patch('/:id/status', requirePermission('canChangeStatus'), updateUserStatus);

/**
 * DELETE /api/v1/users/:id
 * Soft-delete a user.
 * Access: admin only
 */
router.delete('/:id', requirePermission('canDeleteUser'), deleteUser);

export default router;
