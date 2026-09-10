import { Router } from 'express';
import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateUpdateTaskStatus,
  validateAssignTask,
} from '../middleware/taskValidate.middleware.js';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/tasks
 * Create task
 * Access: canCreateTask
 */
router.post('/', requirePermission('canCreateTask'), validateCreateTask, createTask);

/**
 * GET /api/v1/tasks
 * List tasks
 * Access: canListTasks
 */
router.get('/', requirePermission('canListTasks'), listTasks);

/**
 * GET /api/v1/tasks/:id
 * Retrieve task by UUID
 * Access: canViewTask
 */
router.get('/:id', requirePermission('canViewTask'), getTaskById);

/**
 * PATCH /api/v1/tasks/:id
 * Update task
 * Access: canUpdateTask
 */
router.patch('/:id', requirePermission('canUpdateTask'), validateUpdateTask, updateTask);

/**
 * PATCH /api/v1/tasks/:id/status
 * Update task status
 * Access: canUpdateTaskStatus
 */
router.patch('/:id/status', requirePermission('canUpdateTaskStatus'), validateUpdateTaskStatus, updateTaskStatus);

/**
 * PATCH /api/v1/tasks/:id/assign
 * Assign or reassign task
 * Access: canAssignTask (Admin and Manager only)
 */
router.patch('/:id/assign', requirePermission('canAssignTask'), validateAssignTask, assignTask);

/**
 * DELETE /api/v1/tasks/:id
 * Soft-delete task
 * Access: canDeleteTask (Admin only)
 */
router.delete('/:id', requirePermission('canDeleteTask'), deleteTask);

export default router;
