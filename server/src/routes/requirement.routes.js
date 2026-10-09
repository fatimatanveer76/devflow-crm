import { Router } from 'express';
import {
  createRequirement,
  listRequirements,
  getRequirementById,
  updateRequirement,
  changeRequirementStatus,
  approveRequirement,
  rejectRequirement,
  publishRequirement,
  deleteRequirement,
  getVersionHistory,
} from '../controllers/requirement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  validateCreateRequirement,
  validateUpdateRequirement,
  validateChangeRequirementStatus,
  validateRejectRequirement,
} from '../middleware/requirementValidate.middleware.js';

const router = Router();

// All requirement endpoints require authentication
router.use(authenticate);

/**
 * POST /api/v1/requirements
 * Create requirement (Draft status)
 * Access: canCreateRequirement
 */
router.post(
  '/',
  requirePermission('canCreateRequirement'),
  validateCreateRequirement,
  createRequirement
);

/**
 * GET /api/v1/requirements
 * List requirements with search, filters, pagination
 * Access: canListRequirements
 */
router.get(
  '/',
  requirePermission('canListRequirements'),
  listRequirements
);

/**
 * GET /api/v1/requirements/:id
 * Retrieve requirement by UUID with complete version history
 * Access: canViewRequirement
 */
router.get(
  '/:id',
  requirePermission('canViewRequirement'),
  getRequirementById
);

/**
 * PATCH /api/v1/requirements/:id
 * Update requirement (snapshots existing state into immutable version history)
 * Access: canUpdateRequirement
 */
router.patch(
  '/:id',
  requirePermission('canUpdateRequirement'),
  validateUpdateRequirement,
  updateRequirement
);

/**
 * PATCH /api/v1/requirements/:id/status
 * Transition requirement status
 * Access: canUpdateRequirement
 */
router.patch(
  '/:id/status',
  requirePermission('canUpdateRequirement'),
  validateChangeRequirementStatus,
  changeRequirementStatus
);

/**
 * PATCH /api/v1/requirements/:id/approve
 * Approve requirement
 * Access: canApproveRequirement (Admin / Manager)
 */
router.patch(
  '/:id/approve',
  requirePermission('canApproveRequirement'),
  approveRequirement
);

/**
 * PATCH /api/v1/requirements/:id/reject
 * Reject requirement with explanation
 * Access: canApproveRequirement (Admin / Manager)
 */
router.patch(
  '/:id/reject',
  requirePermission('canApproveRequirement'),
  validateRejectRequirement,
  rejectRequirement
);

/**
 * PATCH /api/v1/requirements/:id/publish
 * Publish approved requirement
 * Access: canPublishRequirement (Admin / Manager)
 */
router.patch(
  '/:id/publish',
  requirePermission('canPublishRequirement'),
  publishRequirement
);

/**
 * DELETE /api/v1/requirements/:id
 * Soft-delete requirement
 * Access: canDeleteRequirement (Admin only)
 */
router.delete(
  '/:id',
  requirePermission('canDeleteRequirement'),
  deleteRequirement
);

/**
 * GET /api/v1/requirements/:id/versions
 * Full version history snapshots
 * Access: canViewRequirement
 */
router.get(
  '/:id/versions',
  requirePermission('canViewRequirement'),
  getVersionHistory
);

export default router;
