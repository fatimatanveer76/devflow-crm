import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/dashboard/summary
 * Protected endpoint returning aggregated metrics, KPI cards, and activity trends
 * Access: canViewDashboard
 */
router.get('/summary', requirePermission('canViewDashboard'), getDashboardSummary);

export default router;
