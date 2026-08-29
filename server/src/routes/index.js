import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// /api/v1/health
router.use('/health', healthRoutes);

export default router;
