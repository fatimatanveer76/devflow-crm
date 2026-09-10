import { Router } from 'express';
import { listActivities } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/activities
 * List activity entries with entity filtering and pagination
 * Access: canListActivities
 */
router.get('/', requirePermission('canListActivities'), listActivities);

export default router;
