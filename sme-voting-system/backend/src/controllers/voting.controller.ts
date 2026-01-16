import { Response } from 'express';
import { votingService } from '../services/voting.service';
import { proposalService } from '../services/proposal.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Voting Controller
 * Handles vote casting and retrieval endpoints
 */

/**
 * POST /vote
 * Cast a vote on a proposal (Shareholders only)
 * Body: { 
 *   proposalId: number, 
 *   voteChoice: boolean,
 *   voteCount?: number  // NEW: optional, for quadratic voting (default: 1)
 * }
 */
export const castVote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { proposalId, voteChoice, voteCount } = req.body;

    // Validate required fields
    if (proposalId === undefined || voteChoice === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: proposalId, voteChoice',
      });
      return;
    }

    // Validate types
    const parsedProposalId = parseInt(proposalId, 10);
    if (isNaN(parsedProposalId)) {
      res.status(400).json({
        success: false,
        error: 'proposalId must be a number',
      });
      return;
    }

    if (typeof voteChoice !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'voteChoice must be a boolean (true for yes, false for no)',
      });
      return;
    }

    // Get wallet address from authenticated user
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Parse optional voteCount (default: 1 for backward compatibility)
    const parsedVoteCount = typeof voteCount === 'number' && voteCount > 0 
      ? Math.floor(voteCount) 
      : 1;

    const result = await votingService.castVote(
      req.user.walletAddress,
      parsedProposalId,
      voteChoice,
      parsedVoteCount  // NEW: Pass vote count (defaults to 1)
    );

    // Build response data - include quadratic voting fields if present
    const responseData: any = {
      vote: result.vote,
      blockchainTx: result.blockchainTx,
    };

    // Add quadratic voting info if present
    if (result.tokensSpent !== undefined) {
      responseData.tokensSpent = result.tokensSpent;
    }
    if (result.remainingTokens !== undefined) {
      responseData.remainingTokens = result.remainingTokens;
    }
    if (result.votingPower !== undefined) {
      responseData.votingPower = result.votingPower;
    }

    res.status(201).json({
      success: true,
      data: responseData,
      message: `Vote cast successfully: ${voteChoice ? 'YES' : 'NO'}${parsedVoteCount > 1 ? ` (${parsedVoteCount} votes)` : ''}`,
    });
  } catch (error: any) {
    console.error('❌ Error casting vote:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to cast vote',
    });
  }
};

/**
 * GET /votes/my-votes
 * Get all votes by the current user
 */
export const getMyVotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const votes = await votingService.getMyVotes(req.user.walletAddress);

    res.json({
      success: true,
      data: {
        votes,
        count: votes.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching votes:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch votes',
    });
  }
};

/**
 * GET /votes/proposal/:proposalId
 * Get all votes for a proposal (Admin only)
 */
export const getVotesForProposal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    const votes = await votingService.getVotesForProposal(proposalId);
    const summary = await votingService.getVoteSummary(proposalId);

    res.json({
      success: true,
      data: {
        votes,
        summary,
        count: votes.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching proposal votes:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch proposal votes',
    });
  }
};

/**
 * GET /votes/check/:proposalId
 * Check if current user has voted on a proposal
 */
export const checkVoteStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const hasVoted = await votingService.hasVoted(req.user.walletAddress, proposalId);

    res.json({
      success: true,
      data: {
        proposalId,
        hasVoted,
      },
    });
  } catch (error: any) {
    console.error('❌ Error checking vote status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check vote status',
    });
  }
};

/**
 * GET /results/:proposalId
 * Get proposal voting results
 */
export const getResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    const result = await proposalService.getProposalResult(proposalId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error fetching results:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch results',
    });
  }
};
