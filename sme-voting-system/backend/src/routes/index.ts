import { Router } from 'express';
import { healthCheck, rootInfo } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import shareholderRoutes from './shareholder.routes';
import proposalRoutes from './proposal.routes';
import votingRoutes from './voting.routes';
import resultsRoutes from './results.routes';

const router = Router();

// Health check route
router.get('/health', healthCheck);

// Root route
router.get('/', rootInfo);

// Authentication routes
router.use('/auth', authRoutes);

// Shareholder routes
router.use('/shareholders', shareholderRoutes);

// Proposal routes
router.use('/proposals', proposalRoutes);

// Voting routes
router.use('/vote', votingRoutes);

// Results routes
router.use('/results', resultsRoutes);

export default router;
