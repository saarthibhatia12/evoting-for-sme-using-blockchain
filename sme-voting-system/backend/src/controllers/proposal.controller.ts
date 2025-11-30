import { Response } from 'express';
import { proposalService } from '../services/proposal.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Proposal Controller
 * Handles proposal creation and management endpoints
 */

/**
 * POST /proposals/create
 * Create a new proposal (Admin only)
 * Body: { title: string, description?: string, startTime: string|number, endTime: string|number }
 */
export const createProposal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, startTime, endTime } = req.body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: title, startTime, endTime',
      });
      return;
    }

    // Parse times (accept both ISO strings and Unix timestamps)
    let parsedStartTime: number;
    let parsedEndTime: number;

    if (typeof startTime === 'string') {
      parsedStartTime = Math.floor(new Date(startTime).getTime() / 1000);
    } else if (typeof startTime === 'number') {
      parsedStartTime = startTime;
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid startTime format',
      });
      return;
    }

    if (typeof endTime === 'string') {
      parsedEndTime = Math.floor(new Date(endTime).getTime() / 1000);
    } else if (typeof endTime === 'number') {
      parsedEndTime = endTime;
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid endTime format',
      });
      return;
    }

    // Validate parsed times
    if (isNaN(parsedStartTime) || isNaN(parsedEndTime)) {
      res.status(400).json({
        success: false,
        error: 'Invalid time format. Use ISO string or Unix timestamp.',
      });
      return;
    }

    const result = await proposalService.createProposal(
      title,
      description,
      parsedStartTime,
      parsedEndTime
    );

    res.status(201).json({
      success: true,
      data: {
        proposal: result.proposal,
        blockchainTx: result.blockchainTx,
      },
      message: 'Proposal created successfully',
    });
  } catch (error: any) {
    console.error('❌ Error creating proposal:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create proposal',
    });
  }
};

/**
 * GET /proposals
 * Get all proposals
 * Query: { activeOnly?: boolean, status?: 'upcoming'|'active'|'ended' }
 */
export const getAllProposals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { activeOnly, status } = req.query;

    let proposals;

    if (status === 'upcoming') {
      proposals = await proposalService.getUpcomingProposals();
    } else if (status === 'active') {
      proposals = await proposalService.getActiveProposals();
    } else if (status === 'ended') {
      proposals = await proposalService.getEndedProposals();
    } else {
      proposals = await proposalService.getAllProposalsWithStatus();
    }

    res.json({
      success: true,
      data: {
        proposals,
        count: proposals.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching proposals:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch proposals',
    });
  }
};

/**
 * GET /proposals/:proposalId
 * Get a proposal by ID with blockchain data
 */
export const getProposalById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    const result = await proposalService.getProposalWithBlockchainData(proposalId);

    if (!result.proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...result.proposal,
        blockchainData: result.blockchainData,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching proposal:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch proposal',
    });
  }
};

/**
 * GET /results/:proposalId
 * Get proposal voting results
 */
export const getProposalResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    console.error('❌ Error fetching proposal result:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch proposal result',
    });
  }
};

/**
 * DELETE /proposals/:proposalId
 * Deactivate a proposal (Admin only)
 */
export const deactivateProposal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    const proposal = await proposalService.deactivateProposal(proposalId);

    res.json({
      success: true,
      data: proposal,
      message: 'Proposal deactivated successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deactivating proposal:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to deactivate proposal',
    });
  }
};
