import { Router } from 'express';
import {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
} from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import {
  validateCreateLead,
  validateUpdateLead,
  validateUpdateStatus,
  validateAssignLead,
} from '../middleware/leadValidate.middleware.js';

const router = Router();

// All lead routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/leads
 * Create lead
 * Access: all authenticated roles with canCreateLead
 */
router.post('/', requirePermission('canCreateLead'), validateCreateLead, createLead);

/**
 * GET /api/v1/leads
 * List leads with pagination, search, and filters
 * Access: canListLeads (admins/managers view all, employees view assigned)
 */
router.get('/', requirePermission('canListLeads'), listLeads);

/**
 * GET /api/v1/leads/:id
 * Get single lead by UUID
 * Access: canViewLead (scoped by role)
 */
router.get('/:id', requirePermission('canViewLead'), getLeadById);

/**
 * PATCH /api/v1/leads/:id
 * Update lead details
 * Access: canUpdateLead (scoped by role)
 */
router.patch('/:id', requirePermission('canUpdateLead'), validateUpdateLead, updateLead);

/**
 * PATCH /api/v1/leads/:id/status
 * Update lead status
 * Access: canUpdateLeadStatus (scoped by role)
 */
router.patch('/:id/status', requirePermission('canUpdateLeadStatus'), validateUpdateStatus, updateLeadStatus);

/**
 * PATCH /api/v1/leads/:id/assign
 * Assign or reassign lead to user
 * Access: canAssignLead (Admin and Manager only)
 */
router.patch('/:id/assign', requirePermission('canAssignLead'), validateAssignLead, assignLead);

/**
 * DELETE /api/v1/leads/:id
 * Soft-delete lead
 * Access: canDeleteLead (Admin only)
 */
router.delete('/:id', requirePermission('canDeleteLead'), deleteLead);

export default router;
