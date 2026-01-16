import { Response } from 'express';
import { quadraticVotingService } from '../services/quadratic-voting.service';
import { proposalService } from '../services/proposal.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../services/database.service';
import { ethers } from 'ethers';

/**
 * Quadratic Voting Controller
 * Handles quadratic voting specific endpoints
 * These are ADDITIVE endpoints - the main voting flow remains unchanged
 */

/**
 * GET /api/proposals/:proposalId/token-balance
 * Get the current user's token balance for a quadratic voting proposal
 */
export const getTokenBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
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

    // Get the proposal to check if it's quadratic
    const proposal = await proposalService.getProposalById(proposalId);
    
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }

    if (proposal.votingType !== 'quadratic') {
      res.status(400).json({
        success: false,
        error: 'This endpoint is only for quadratic voting proposals',
      });
      return;
    }

    // Get shareholder
    const normalizedAddress = ethers.getAddress(req.user.walletAddress);
    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!shareholder) {
      res.status(403).json({
        success: false,
        error: 'Only registered shareholders can view token balance',
      });
      return;
    }

    // Get token balance info
    const balanceInfo = await quadraticVotingService.getTokenBalanceInfo(
      proposalId,
      shareholder.id
    );

    // Map backend field names to frontend expected names
    res.json({
      success: true,
      data: {
        proposalId: balanceInfo.proposalId,
        shareholderId: balanceInfo.shareholderId,
        totalTokens: balanceInfo.totalTokens,
        tokensUsed: balanceInfo.tokensUsed,
        tokensRemaining: balanceInfo.remainingTokens,  // Frontend expects tokensRemaining
        currentVotes: balanceInfo.currentVotes,
        voteDirection: balanceInfo.voteDirection,
        isDirectionLocked: balanceInfo.voteDirection !== null,  // Frontend expects this
        maxAdditionalVotes: balanceInfo.maxAdditionalVotes,
        votingPower: balanceInfo.votingPower,
        proposalTitle: proposal.title,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching token balance:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token balance',
    });
  }
};

/**
 * GET /api/vote/quadratic/cost-preview/:proposalId
 * Preview the cost for casting additional votes
 * Query: { voteCount: number }
 */
export const previewVoteCost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // proposalId from URL params, voteCount from query
    const proposalId = parseInt(req.params.proposalId as string, 10) || parseInt(req.query.proposalId as string, 10);
    const voteCount = parseInt(req.query.voteCount as string, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    if (isNaN(voteCount) || voteCount <= 0) {
      res.status(400).json({
        success: false,
        error: 'voteCount must be a positive number',
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

    // Get the proposal to check if it's quadratic
    const proposal = await proposalService.getProposalById(proposalId);
    
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }

    if (proposal.votingType !== 'quadratic') {
      res.status(400).json({
        success: false,
        error: 'Cost preview is only available for quadratic voting proposals',
      });
      return;
    }

    // Get shareholder
    const normalizedAddress = ethers.getAddress(req.user.walletAddress);
    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!shareholder) {
      res.status(403).json({
        success: false,
        error: 'Only registered shareholders can preview vote cost',
      });
      return;
    }

    // Get cost preview
    const preview = await quadraticVotingService.previewVoteCost(
      proposalId,
      shareholder.id,
      voteCount
    );

    // Map backend field names to frontend expected names
    res.json({
      success: true,
      data: {
        proposalId,
        proposalTitle: proposal.title,
        currentVotes: preview.currentVotes,
        additionalVotes: preview.additionalVotes,
        newTotalVotes: preview.newTotalVotes,
        tokenCost: preview.cost,                        // Frontend expects tokenCost
        tokensRemaining: preview.remainingTokensAfter,  // Frontend expects tokensRemaining
        tokensAfterVote: preview.remainingTokensAfter,  // Same as tokensRemaining
        canAfford: preview.canAfford,
        votingPower: preview.votingPowerAfter,          // Frontend expects votingPower
      },
    });
  } catch (error: any) {
    console.error('❌ Error previewing vote cost:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview vote cost',
    });
  }
};

/**
 * GET /api/proposals/:proposalId/quadratic-results
 * Get the quadratic voting results for a proposal
 */
export const getQuadraticResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    // Get the proposal
    const proposal = await proposalService.getProposalById(proposalId);
    
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }

    if (proposal.votingType !== 'quadratic') {
      res.status(400).json({
        success: false,
        error: 'This endpoint is only for quadratic voting proposals',
      });
      return;
    }

    // Get quadratic results
    const results = await quadraticVotingService.getQuadraticResults(proposalId);

    res.json({
      success: true,
      data: {
        proposalId,
        proposalTitle: proposal.title,
        votingType: 'quadratic',
        ...results,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching quadratic results:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch quadratic results',
    });
  }
};

/**
 * POST /api/vote/quadratic
 * Cast a quadratic vote on a proposal
 * Body: { proposalId: number, voteChoice: boolean, voteCount: number }
 * 
 * This is a DEDICATED endpoint for quadratic voting.
 * The main POST /api/vote endpoint also supports quadratic voting via routing,
 * but this endpoint provides explicit quadratic voting with clear parameter expectations.
 */
export const castQuadraticVote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Validate proposalId
    const parsedProposalId = parseInt(proposalId, 10);
    if (isNaN(parsedProposalId)) {
      res.status(400).json({
        success: false,
        error: 'proposalId must be a number',
      });
      return;
    }

    // Validate voteChoice
    if (typeof voteChoice !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'voteChoice must be a boolean (true for YES, false for NO)',
      });
      return;
    }

    // Validate voteCount (required for quadratic voting)
    const parsedVoteCount = typeof voteCount === 'number' && voteCount > 0 
      ? Math.floor(voteCount) 
      : 1;

    if (parsedVoteCount <= 0) {
      res.status(400).json({
        success: false,
        error: 'voteCount must be a positive integer',
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

    // Verify the proposal is quadratic voting type
    const proposal = await proposalService.getProposalById(parsedProposalId);
    
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }

    if (proposal.votingType !== 'quadratic') {
      res.status(400).json({
        success: false,
        error: 'This endpoint is only for quadratic voting proposals. Use POST /api/vote for simple voting.',
      });
      return;
    }

    // Cast the quadratic vote
    const result = await quadraticVotingService.castQuadraticVote(
      req.user.walletAddress,
      parsedProposalId,
      voteChoice,
      parsedVoteCount
    );

    res.status(201).json({
      success: true,
      data: {
        vote: result.vote,
        tokensSpent: result.tokensSpent,
        remainingTokens: result.remainingTokens,
        currentVotes: result.currentVotes,
        votingPower: result.votingPower,
        blockchainTx: result.blockchainTx,
      },
      message: `Quadratic vote cast successfully: ${voteChoice ? 'YES' : 'NO'} (${parsedVoteCount} vote${parsedVoteCount > 1 ? 's' : ''})`,
    });
  } catch (error: any) {
    console.error('❌ Error casting quadratic vote:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to cast quadratic vote',
    });
  }
};
