import { prisma } from './database.service';
import { Proposal } from '@prisma/client';

/**
 * Tie Resolution Types
 * - STATUS_QUO_REJECT: Admin rejected the proposal (status quo preserved)
 * - CHAIRPERSON_YES: Admin cast deciding vote in favor
 * - CHAIRPERSON_NO: Admin cast deciding vote against
 */
export type TieResolutionType = 'STATUS_QUO_REJECT' | 'CHAIRPERSON_YES' | 'CHAIRPERSON_NO';

/**
 * Final Result Status
 * - APPROVED: Proposal passed (YES > NO, or tie resolved with YES)
 * - REJECTED: Proposal failed (NO > YES, or tie resolved with NO/Status Quo)
 * - TIE_PENDING: Voting ended with tie, awaiting admin resolution
 * - VOTING_ACTIVE: Voting still in progress
 * - NOT_STARTED: Voting hasn't begun yet
 */
export type FinalResultStatus = 'APPROVED' | 'REJECTED' | 'TIE_PENDING' | 'VOTING_ACTIVE' | 'NOT_STARTED';

/**
 * Vote Tally Result
 */
export interface VoteTally {
  yesVotes: number;
  noVotes: number;
  isTied: boolean;
  votingType: string;
}

/**
 * Final Result Response
 */
export interface FinalResultResponse {
  proposalId: number;
  title: string;
  status: FinalResultStatus;
  yesVotes: number;
  noVotes: number;
  isTied: boolean;
  tieResolutionType: TieResolutionType | null;
  tieResolvedAt: Date | null;
  tieResolvedByAdminId: number | null;
  votingType: string;
}

/**
 * Tie Resolution Service
 * 
 * Handles tie detection and resolution for both Simple and Quadratic voting.
 * 
 * Vote Tally Logic:
 * - Simple Voting: Sum of share weights (voteWeight field, or shareholder.shares.shares)
 * - Quadratic Voting: Sum of √tokensSpent (voting power)
 * 
 * Important: A tie is only possible when voting has ENDED.
 */
class TieResolutionService {

  /**
   * Calculate vote tally for a proposal
   * Handles both Simple and Quadratic voting types
   * 
   * @param proposalId - The proposal ID
   * @returns Vote tally with yes/no counts and tie status
   */
  async calculateVoteTally(proposalId: number): Promise<VoteTally> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const votes = await prisma.vote.findMany({
      where: { proposalId },
      include: {
        shareholder: {
          include: {
            shares: true,
          },
        },
      },
    });

    let yesVotes = 0;
    let noVotes = 0;

    if (proposal.votingType === 'quadratic') {
      // Quadratic voting: voting power = √tokensSpent
      for (const vote of votes) {
        const votingPower = Math.sqrt(vote.tokensSpent);
        if (vote.voteChoice) {
          yesVotes += votingPower;
        } else {
          noVotes += votingPower;
        }
      }
    } else {
      // Simple voting: sum of share weights
      for (const vote of votes) {
        // Use voteWeight if set, otherwise fall back to shareholder shares
        const weight = vote.voteWeight > 1 
          ? vote.voteWeight 
          : (vote.shareholder?.shares?.shares || 0);
        
        if (vote.voteChoice) {
          yesVotes += weight;
        } else {
          noVotes += weight;
        }
      }
    }

    // Round to avoid floating point comparison issues
    yesVotes = Math.round(yesVotes * 100) / 100;
    noVotes = Math.round(noVotes * 100) / 100;

    return {
      yesVotes,
      noVotes,
      isTied: yesVotes === noVotes && (yesVotes > 0 || noVotes > 0),
      votingType: proposal.votingType,
    };
  }

  /**
   * Check if a proposal is tied and mark it in the database
   * Should be called when voting ends
   * 
   * @param proposalId - The proposal ID
   * @returns Updated proposal with tie status
   */
  async checkAndMarkTie(proposalId: number): Promise<Proposal> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Check if voting has ended
    const now = new Date();
    if (now < proposal.endTime) {
      throw new Error('Voting has not ended yet');
    }

    // Calculate vote tally
    const tally = await this.calculateVoteTally(proposalId);

    // Update proposal with tie status
    const updatedProposal = await prisma.proposal.update({
      where: { proposalId },
      data: {
        isTied: tally.isTied,
      },
    });

    if (tally.isTied) {
      console.log(`⚖️ Proposal ${proposalId} is TIED: YES=${tally.yesVotes}, NO=${tally.noVotes}`);
    } else {
      console.log(`📊 Proposal ${proposalId} result: YES=${tally.yesVotes}, NO=${tally.noVotes} (Not tied)`);
    }

    return updatedProposal;
  }

  /**
   * Resolve a tied proposal with Status Quo (Reject)
   * The proposal fails, preserving the status quo
   * 
   * @param proposalId - The proposal ID
   * @param adminId - The admin's shareholder ID
   * @returns Updated proposal
   */
  async resolveWithStatusQuo(proposalId: number, adminId: number): Promise<Proposal> {
    await this.validateTieResolution(proposalId, adminId);

    const proposal = await prisma.proposal.update({
      where: { proposalId },
      data: {
        tieResolutionType: 'STATUS_QUO_REJECT',
        tieResolvedAt: new Date(),
        tieResolvedByAdminId: adminId,
      },
    });

    console.log(`🚫 Tie resolved with STATUS_QUO_REJECT: Proposal ${proposalId} rejected by Admin ${adminId}`);

    return proposal;
  }

  /**
   * Resolve a tied proposal with Chairperson's Vote
   * The admin casts the deciding vote
   * 
   * @param proposalId - The proposal ID
   * @param adminId - The admin's shareholder ID
   * @param voteChoice - true for YES, false for NO
   * @returns Updated proposal
   */
  async resolveWithChairpersonVote(
    proposalId: number, 
    adminId: number, 
    voteChoice: boolean
  ): Promise<Proposal> {
    await this.validateTieResolution(proposalId, adminId);

    const resolutionType: TieResolutionType = voteChoice ? 'CHAIRPERSON_YES' : 'CHAIRPERSON_NO';

    const proposal = await prisma.proposal.update({
      where: { proposalId },
      data: {
        tieResolutionType: resolutionType,
        tieResolvedAt: new Date(),
        tieResolvedByAdminId: adminId,
      },
    });

    console.log(`🗳️ Tie resolved with ${resolutionType}: Proposal ${proposalId} by Admin ${adminId}`);

    return proposal;
  }

  /**
   * Get the final result of a proposal
   * Takes into account tie resolution if applicable
   * 
   * @param proposalId - The proposal ID
   * @returns Final result with status and details
   */
  async getFinalResult(proposalId: number): Promise<FinalResultResponse> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const tally = await this.calculateVoteTally(proposalId);
    const now = new Date();

    // Determine status
    let status: FinalResultStatus;

    if (now < proposal.startTime) {
      status = 'NOT_STARTED';
    } else if (now < proposal.endTime) {
      status = 'VOTING_ACTIVE';
    } else {
      // Voting has ended - determine outcome
      if (tally.isTied || proposal.isTied) {
        // Check if tie has been resolved
        if (proposal.tieResolutionType) {
          // Tie was resolved
          if (proposal.tieResolutionType === 'CHAIRPERSON_YES') {
            status = 'APPROVED';
          } else {
            // STATUS_QUO_REJECT or CHAIRPERSON_NO
            status = 'REJECTED';
          }
        } else {
          // Tie not yet resolved
          status = 'TIE_PENDING';
        }
      } else {
        // No tie - determine by votes
        if (tally.yesVotes > tally.noVotes) {
          status = 'APPROVED';
        } else if (tally.noVotes > tally.yesVotes) {
          status = 'REJECTED';
        } else {
          // Both zero or equal (edge case)
          status = tally.yesVotes === 0 && tally.noVotes === 0 ? 'REJECTED' : 'TIE_PENDING';
        }
      }
    }

    return {
      proposalId: proposal.proposalId,
      title: proposal.title,
      status,
      yesVotes: tally.yesVotes,
      noVotes: tally.noVotes,
      isTied: tally.isTied || proposal.isTied,
      tieResolutionType: proposal.tieResolutionType as TieResolutionType | null,
      tieResolvedAt: proposal.tieResolvedAt,
      tieResolvedByAdminId: proposal.tieResolvedByAdminId,
      votingType: proposal.votingType,
    };
  }

  /**
   * Get tie status for a proposal
   * Quick check if proposal is tied and needs resolution
   * 
   * @param proposalId - The proposal ID
   * @returns Tie status information
   */
  async getTieStatus(proposalId: number): Promise<{
    proposalId: number;
    isTied: boolean;
    isResolved: boolean;
    tieResolutionType: TieResolutionType | null;
    votingEnded: boolean;
    yesVotes: number;
    noVotes: number;
  }> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const tally = await this.calculateVoteTally(proposalId);
    const now = new Date();
    const votingEnded = now > proposal.endTime;

    // Auto-mark tie if voting ended and not already marked
    if (votingEnded && !proposal.isTied && tally.isTied) {
      await this.checkAndMarkTie(proposalId);
    }

    return {
      proposalId: proposal.proposalId,
      isTied: tally.isTied || proposal.isTied,
      isResolved: !!proposal.tieResolutionType,
      tieResolutionType: proposal.tieResolutionType as TieResolutionType | null,
      votingEnded,
      yesVotes: tally.yesVotes,
      noVotes: tally.noVotes,
    };
  }

  /**
   * Validate that a tie resolution can be performed
   * Checks: proposal exists, voting ended, is tied, not already resolved, user is admin
   * 
   * @param proposalId - The proposal ID
   * @param adminId - The admin's shareholder ID
   * @throws Error if validation fails
   */
  private async validateTieResolution(proposalId: number, adminId: number): Promise<void> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Check if voting has ended
    const now = new Date();
    if (now < proposal.endTime) {
      throw new Error('Cannot resolve tie before voting ends');
    }

    // Check if already resolved
    if (proposal.tieResolutionType) {
      throw new Error('Tie has already been resolved');
    }

    // Calculate current tally to verify tie
    const tally = await this.calculateVoteTally(proposalId);

    // Mark as tied if not already
    if (!proposal.isTied && tally.isTied) {
      await prisma.proposal.update({
        where: { proposalId },
        data: { isTied: true },
      });
    }

    // Verify it's actually tied
    if (!tally.isTied && !proposal.isTied) {
      throw new Error('Proposal is not tied');
    }

    // Verify admin exists and is admin
    const admin = await prisma.shareholder.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    if (!admin.isAdmin) {
      throw new Error('Only admins can resolve ties');
    }
  }
}

export const tieResolutionService = new TieResolutionService();
