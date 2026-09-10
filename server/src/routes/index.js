import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import leadRoutes from './lead.routes.js';
import dealRoutes from './deal.routes.js';
import projectRoutes from './project.routes.js';

const router = Router();

// /api/v1/health
router.use('/health', healthRoutes);

// /api/v1/auth
router.use('/auth', authRoutes);

// /api/v1/users — requires authentication + RBAC permission
router.use('/users', userRoutes);

// /api/v1/leads — requires authentication + RBAC permission
router.use('/leads', leadRoutes);

// /api/v1/deals — requires authentication + RBAC permission
router.use('/deals', dealRoutes);

// /api/v1/projects — requires authentication + RBAC permission
router.use('/projects', projectRoutes);

export default router;
