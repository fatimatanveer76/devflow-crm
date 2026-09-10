import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  assignProject,
  deleteProject,
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  validateCreateProject,
  validateUpdateProject,
  validateUpdateProjectStatus,
  validateAssignProject,
} from '../middleware/projectValidate.middleware.js';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/projects
 * Create project
 * Access: canCreateProject
 */
router.post('/', requirePermission('canCreateProject'), validateCreateProject, createProject);

/**
 * GET /api/v1/projects
 * List projects with search, status/priority filters, pagination, and metrics
 * Access: canListProjects
 */
router.get('/', requirePermission('canListProjects'), listProjects);

/**
 * GET /api/v1/projects/:id
 * Retrieve project by UUID
 * Access: canViewProject
 */
router.get('/:id', requirePermission('canViewProject'), getProjectById);

/**
 * PATCH /api/v1/projects/:id
 * Update project details
 * Access: canUpdateProject
 */
router.patch('/:id', requirePermission('canUpdateProject'), validateUpdateProject, updateProject);

/**
 * PATCH /api/v1/projects/:id/status
 * Update project status
 * Access: canUpdateProjectStatus
 */
router.patch('/:id/status', requirePermission('canUpdateProjectStatus'), validateUpdateProjectStatus, updateProjectStatus);

/**
 * PATCH /api/v1/projects/:id/assign
 * Assign or reassign project
 * Access: canAssignProject (Admin and Manager only)
 */
router.patch('/:id/assign', requirePermission('canAssignProject'), validateAssignProject, assignProject);

/**
 * DELETE /api/v1/projects/:id
 * Soft-delete project
 * Access: canDeleteProject (Admin only)
 */
router.delete('/:id', requirePermission('canDeleteProject'), deleteProject);

export default router;
