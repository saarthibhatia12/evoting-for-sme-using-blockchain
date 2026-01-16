import { Router } from 'express';
import {
  castVote,
  getMyVotes,
  getVotesForProposal,
  checkVoteStatus,
  getResults,
} from '../controllers/voting.controller';
import {
  previewVoteCost,
  castQuadraticVote,
  getTokenBalance,
  getQuadraticResults,
} from '../controllers/quadratic-voting.controller';
import {
  authenticate,
  requireShareholder,
  requireAdmin,
} from '../middleware/auth.middleware';
import {
  validateVote,
  validateProposalIdParam,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * Voting Routes
 * All routes require authentication
 */

/**
 * POST /vote
 * Cast a vote on a proposal (Shareholders only)
 * Body: { proposalId: number, voteChoice: boolean }
 */
router.post('/', authenticate, requireShareholder, validateVote, castVote);

/**
 * GET /votes/my-votes
 * Get all votes by the current user
 */
router.get('/my-votes', authenticate, getMyVotes);

/**
 * GET /votes/check/:proposalId
 * Check if current user has voted on a proposal
 */
router.get('/check/:proposalId', authenticate, validateProposalIdParam, checkVoteStatus);

/**
 * GET /votes/proposal/:proposalId
 * Get all votes for a proposal (Admin only)
 */
router.get('/proposal/:proposalId', authenticate, requireShareholder, requireAdmin, validateProposalIdParam, getVotesForProposal);

/**
 * GET /votes/cost-preview
 * Preview the cost for casting additional votes (Quadratic voting only)
 * Query: { proposalId: number, voteCount: number }
 */
router.get('/cost-preview', authenticate, requireShareholder, previewVoteCost);

/**
 * POST /votes/quadratic
 * Cast a quadratic vote on a proposal (Shareholders only)
 * Body: { proposalId: number, voteChoice: boolean, voteCount: number }
 * 
 * This is a DEDICATED endpoint for quadratic voting with explicit parameter expectations.
 * The main POST /api/vote endpoint also supports quadratic voting via routing.
 */
router.post('/quadratic', authenticate, requireShareholder, castQuadraticVote);

/**
 * GET /votes/quadratic/token-balance/:proposalId
 * Get the current user's token balance for a quadratic voting proposal
 */
router.get('/quadratic/token-balance/:proposalId', authenticate, requireShareholder, getTokenBalance);

/**
 * GET /votes/quadratic/cost-preview/:proposalId
 * Preview the cost for casting additional votes
 * Query: { voteCount: number }
 */
router.get('/quadratic/cost-preview/:proposalId', authenticate, requireShareholder, previewVoteCost);

/**
 * GET /votes/quadratic/results/:proposalId
 * Get quadratic voting results for a proposal
 */
router.get('/quadratic/results/:proposalId', authenticate, getQuadraticResults);

export default router;
