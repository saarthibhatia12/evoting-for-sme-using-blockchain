import { Router } from 'express';
import { getResults } from '../controllers/voting.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateProposalIdParam } from '../middleware/validation.middleware';

const router = Router();

/**
 * Results Routes
 * Get proposal voting results
 */

/**
 * GET /results/:proposalId
 * Get proposal voting results (authenticated users)
 */
router.get('/:proposalId', authenticate, validateProposalIdParam, getResults);

export default router;
