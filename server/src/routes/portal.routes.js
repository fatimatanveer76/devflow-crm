import { Router } from 'express';
import {
  getDashboard,
  listProjects,
  getProjectById,
  listRequirements,
  getRequirementById,
  getProfile,
  updateProfile,
} from '../controllers/portal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireClientRole } from '../middleware/portalAuth.middleware.js';

const router = Router();

// All portal endpoints require authentication and strict client role verification
router.use(authenticate);
router.use(requireClientRole);

/**
 * GET /api/v1/portal/dashboard
 * Client portal dashboard metrics & summary
 */
router.get('/dashboard', getDashboard);

/**
 * GET /api/v1/portal/projects
 * List client's assigned projects
 */
router.get('/projects', listProjects);

/**
 * GET /api/v1/portal/projects/:id
 * Retrieve single project details with tasks and requirements
 */
router.get('/projects/:id', getProjectById);

/**
 * GET /api/v1/portal/requirements
 * List approved and published requirements across client's projects
 */
router.get('/requirements', listRequirements);

/**
 * GET /api/v1/portal/requirements/:id
 * Retrieve single approved/published specification with version history
 */
router.get('/requirements/:id', getRequirementById);

/**
 * GET /api/v1/portal/profile
 * Retrieve client profile information
 */
router.get('/profile', getProfile);

/**
 * PATCH /api/v1/portal/profile
 * Update client profile information
 */
router.patch('/profile', updateProfile);

export default router;
