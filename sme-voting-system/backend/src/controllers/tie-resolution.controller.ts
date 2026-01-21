import { Response } from 'express';
import { tieResolutionService } from '../services/tie-resolution.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Tie Resolution Controller
 * Handles tie detection and admin resolution endpoints
 */

/**
 * GET /proposals/:proposalId/tie-status
 * Check if a proposal is tied and get tie status details
 * Requires: Authentication
 */
export const checkTieStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    const tieStatus = await tieResolutionService.getTieStatus(proposalId);

    res.json({
      success: true,
      data: tieStatus,
    });
  } catch (error: any) {
    console.error('❌ Error checking tie status:', error.message);
    
    if (error.message === 'Proposal not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check tie status',
    });
  }
};

/**
 * GET /proposals/:proposalId/final-result
 * Get the final result of a proposal (including tie resolution if applicable)
 * Requires: Authentication
 */
export const getProposalFinalResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    const result = await tieResolutionService.getFinalResult(proposalId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error getting final result:', error.message);
    
    if (error.message === 'Proposal not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get final result',
    });
  }
};

/**
 * POST /proposals/:proposalId/resolve-tie/status-quo
 * Resolve a tied proposal by rejecting it (Status Quo)
 * Requires: Admin authentication
 */
export const resolveTieStatusQuo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    // Get admin ID from authenticated shareholder
    if (!req.shareholder) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const adminId = req.shareholder.id;

    const proposal = await tieResolutionService.resolveWithStatusQuo(proposalId, adminId);

    res.json({
      success: true,
      data: {
        proposalId: proposal.proposalId,
        title: proposal.title,
        tieResolutionType: proposal.tieResolutionType,
        tieResolvedAt: proposal.tieResolvedAt,
        tieResolvedByAdminId: proposal.tieResolvedByAdminId,
      },
      message: 'Tie resolved: Proposal rejected (Status Quo)',
    });
  } catch (error: any) {
    console.error('❌ Error resolving tie (status quo):', error.message);
    
    // Map specific errors to appropriate HTTP status codes
    if (error.message === 'Proposal not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message === 'Cannot resolve tie before voting ends' ||
      error.message === 'Proposal is not tied' ||
      error.message === 'Tie has already been resolved'
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message === 'Admin not found' ||
      error.message === 'Only admins can resolve ties'
    ) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve tie',
    });
  }
};

/**
 * POST /proposals/:proposalId/resolve-tie/chairperson-vote
 * Resolve a tied proposal with the Chairperson's deciding vote
 * Body: { voteChoice: boolean }
 * Requires: Admin authentication
 */
export const resolveTieChairpersonVote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposalId = parseInt(req.params.proposalId, 10);

    if (isNaN(proposalId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid proposal ID',
      });
      return;
    }

    // Get admin ID from authenticated shareholder
    if (!req.shareholder) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const adminId = req.shareholder.id;

    // Validate voteChoice from body
    const { voteChoice } = req.body;

    if (typeof voteChoice !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'voteChoice must be a boolean (true for YES, false for NO)',
      });
      return;
    }

    const proposal = await tieResolutionService.resolveWithChairpersonVote(
      proposalId,
      adminId,
      voteChoice
    );

    const outcomeMessage = voteChoice
      ? 'Tie resolved: Chairperson voted YES - Proposal APPROVED'
      : 'Tie resolved: Chairperson voted NO - Proposal REJECTED';

    res.json({
      success: true,
      data: {
        proposalId: proposal.proposalId,
        title: proposal.title,
        tieResolutionType: proposal.tieResolutionType,
        tieResolvedAt: proposal.tieResolvedAt,
        tieResolvedByAdminId: proposal.tieResolvedByAdminId,
      },
      message: outcomeMessage,
    });
  } catch (error: any) {
    console.error('❌ Error resolving tie (chairperson vote):', error.message);
    
    // Map specific errors to appropriate HTTP status codes
    if (error.message === 'Proposal not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message === 'Cannot resolve tie before voting ends' ||
      error.message === 'Proposal is not tied' ||
      error.message === 'Tie has already been resolved'
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (
      error.message === 'Admin not found' ||
      error.message === 'Only admins can resolve ties'
    ) {
      res.status(403).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resolve tie',
    });
  }
};
