import { Router } from 'express';
import {
  createDeal,
  listDeals,
  getDealById,
  updateDeal,
  updateDealStage,
  updateDealStatus,
  assignDeal,
  deleteDeal,
} from '../controllers/deal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  validateCreateDeal,
  validateUpdateDeal,
  validateUpdateStage,
  validateUpdateStatus,
  validateAssignDeal,
} from '../middleware/dealValidate.middleware.js';

const router = Router();

// All deal routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/deals
 * Create deal
 * Access: canCreateDeal
 */
router.post('/', requirePermission('canCreateDeal'), validateCreateDeal, createDeal);

/**
 * GET /api/v1/deals
 * List deals with search, stage/status filters, pagination, and pipeline summary
 * Access: canListDeals
 */
router.get('/', requirePermission('canListDeals'), listDeals);

/**
 * GET /api/v1/deals/:id
 * Retrieve deal by UUID
 * Access: canViewDeal
 */
router.get('/:id', requirePermission('canViewDeal'), getDealById);

/**
 * PATCH /api/v1/deals/:id
 * Update deal
 * Access: canUpdateDeal
 */
router.patch('/:id', requirePermission('canUpdateDeal'), validateUpdateDeal, updateDeal);

/**
 * PATCH /api/v1/deals/:id/stage
 * Update deal pipeline stage
 * Access: canUpdateDealStage
 */
router.patch('/:id/stage', requirePermission('canUpdateDealStage'), validateUpdateStage, updateDealStage);

/**
 * PATCH /api/v1/deals/:id/status
 * Update deal status (open / won / lost)
 * Access: canUpdateDealStatus
 */
router.patch('/:id/status', requirePermission('canUpdateDealStatus'), validateUpdateStatus, updateDealStatus);

/**
 * PATCH /api/v1/deals/:id/assign
 * Assign or reassign deal
 * Access: canAssignDeal (Admin and Manager only)
 */
router.patch('/:id/assign', requirePermission('canAssignDeal'), validateAssignDeal, assignDeal);

/**
 * DELETE /api/v1/deals/:id
 * Soft-delete deal
 * Access: canDeleteDeal (Admin only)
 */
router.delete('/:id', requirePermission('canDeleteDeal'), deleteDeal);

export default router;
