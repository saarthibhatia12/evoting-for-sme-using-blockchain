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
  checkTieStatus,
  getProposalFinalResult,
  resolveTieStatusQuo,
  resolveTieChairpersonVote,
} from '../controllers/tie-resolution.controller';
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

// =============================================================================
// TIE-BREAKING ROUTES
// =============================================================================

/**
 * GET /proposals/:proposalId/tie-status
 * Check if a proposal is tied and get tie status details
 */
router.get('/:proposalId/tie-status', authenticate, validateProposalIdParam, checkTieStatus);

/**
 * GET /proposals/:proposalId/final-result
 * Get the final result of a proposal (including tie resolution if applicable)
 */
router.get('/:proposalId/final-result', authenticate, validateProposalIdParam, getProposalFinalResult);

/**
 * POST /proposals/:proposalId/resolve-tie/status-quo
 * Resolve a tied proposal by rejecting it (Status Quo)
 * Admin only
 */
router.post('/:proposalId/resolve-tie/status-quo', authenticate, requireShareholder, requireAdmin, validateProposalIdParam, resolveTieStatusQuo);

/**
 * POST /proposals/:proposalId/resolve-tie/chairperson-vote
 * Resolve a tied proposal with the Chairperson's deciding vote
 * Body: { voteChoice: boolean }
 * Admin only
 */
router.post('/:proposalId/resolve-tie/chairperson-vote', authenticate, requireShareholder, requireAdmin, validateProposalIdParam, resolveTieChairpersonVote);

export default router;
