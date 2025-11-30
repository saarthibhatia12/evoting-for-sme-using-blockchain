import { Router } from 'express';
import {
  castVote,
  getMyVotes,
  getVotesForProposal,
  checkVoteStatus,
  getResults,
} from '../controllers/voting.controller';
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

export default router;
