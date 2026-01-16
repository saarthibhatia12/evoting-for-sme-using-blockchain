import { Router } from 'express';
import {
  createProposal,
  getAllProposals,
  getProposalById,
  getProposalResult,
  deactivateProposal,
} from '../controllers/proposal.controller';
import {
  getTokenBalance,
  getQuadraticResults,
} from '../controllers/quadratic-voting.controller';
import {
  authenticate,
  requireShareholder,
  requireAdmin,
} from '../middleware/auth.middleware';
import {
  validateProposalCreation,
  validateProposalIdParam,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * Proposal Routes
 * All routes require authentication
 */

/**
 * POST /proposals/create
 * Create a new proposal (Admin only)
 * Body: { title: string, description?: string, startTime: string|number, endTime: string|number }
 */
router.post('/create', authenticate, requireShareholder, requireAdmin, validateProposalCreation, createProposal);

/**
 * GET /proposals
 * Get all proposals (authenticated users)
 * Query: { activeOnly?: boolean, status?: 'upcoming'|'active'|'ended' }
 */
router.get('/', authenticate, getAllProposals);

/**
 * GET /proposals/:proposalId
 * Get a proposal by ID with blockchain data (authenticated users)
 */
router.get('/:proposalId', authenticate, validateProposalIdParam, getProposalById);

/**
 * DELETE /proposals/:proposalId
 * Deactivate a proposal (Admin only)
 */
router.delete('/:proposalId', authenticate, requireShareholder, requireAdmin, validateProposalIdParam, deactivateProposal);

/**
 * GET /proposals/:proposalId/token-balance
 * Get the current user's token balance for a quadratic voting proposal
 */
router.get('/:proposalId/token-balance', authenticate, requireShareholder, validateProposalIdParam, getTokenBalance);

/**
 * GET /proposals/:proposalId/quadratic-results
 * Get the quadratic voting results for a proposal
 */
router.get('/:proposalId/quadratic-results', authenticate, validateProposalIdParam, getQuadraticResults);

export default router;
