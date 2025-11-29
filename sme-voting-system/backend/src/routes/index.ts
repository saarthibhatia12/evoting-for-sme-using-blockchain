import { Router } from 'express';
import { healthCheck, rootInfo } from '../controllers/health.controller';

const router = Router();

// Health check route
router.get('/health', healthCheck);

// Root route
router.get('/', rootInfo);

export default router;
