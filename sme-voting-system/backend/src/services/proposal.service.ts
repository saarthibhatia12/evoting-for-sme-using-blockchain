import { prisma } from './database.service';
import { blockchainService } from './blockchain.service';
import { Proposal } from '@prisma/client';

/**
 * Proposal Service
 * Handles proposal creation and management
 */
class ProposalService {
  /**
   * Create a new proposal
   * @param title - Proposal title
   * @param description - Proposal description
   * @param startTime - Voting start time (Date or Unix timestamp)
   * @param endTime - Voting end time (Date or Unix timestamp)
   * @returns The created proposal
   */
  async createProposal(
    title: string,
    description: string | undefined,
    startTime: Date | number,
    endTime: Date | number
  ): Promise<{
    proposal: Proposal;
    blockchainTx?: string;
  }> {
    // Convert dates to timestamps
    const startTimestamp = typeof startTime === 'number' 
      ? startTime 
      : Math.floor(startTime.getTime() / 1000);
    
    const endTimestamp = typeof endTime === 'number'
      ? endTime
      : Math.floor(endTime.getTime() / 1000);

    // Validate times
    const now = Math.floor(Date.now() / 1000);
    
    if (startTimestamp < now - 60) { // Allow 1 minute grace period
      throw new Error('Start time cannot be in the past');
    }

    if (endTimestamp <= startTimestamp) {
      throw new Error('End time must be after start time');
    }

    // Create proposal on blockchain first
    const blockchainResult = await blockchainService.createProposal(
      title,
      startTimestamp,
      endTimestamp
    );

    if (!blockchainResult.success || !blockchainResult.proposalId) {
      throw new Error(blockchainResult.error || 'Failed to create proposal on blockchain');
    }

    // Create proposal in database
    const proposal = await prisma.proposal.create({
      data: {
        proposalId: blockchainResult.proposalId,
        title,
        description,
        startTime: new Date(startTimestamp * 1000),
        endTime: new Date(endTimestamp * 1000),
        isActive: true,
      },
    });

    console.log(`✅ Proposal created: ID=${proposal.proposalId}, Title="${title}"`);

    return {
      proposal,
      blockchainTx: blockchainResult.txHash,
    };
  }

  /**
   * Get all proposals
   * @param activeOnly - Only return active proposals
   * @returns List of proposals
   */
  async getAllProposals(activeOnly: boolean = false): Promise<Proposal[]> {
    const proposals = await prisma.proposal.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return proposals;
  }

  /**
   * Get a proposal by ID
   * @param proposalId - The blockchain proposal ID
   * @returns Proposal or null
   */
  async getProposalById(proposalId: number): Promise<Proposal | null> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    return proposal;
  }

  /**
   * Get proposal with blockchain data
   * @param proposalId - The blockchain proposal ID
   * @returns Combined proposal data
   */
  async getProposalWithBlockchainData(proposalId: number): Promise<{
    proposal: Proposal | null;
    blockchainData: {
      yesVotes: string;
      noVotes: string;
      votingOpen: boolean;
    } | null;
  }> {
    const proposal = await this.getProposalById(proposalId);

    if (!proposal) {
      return { proposal: null, blockchainData: null };
    }

    try {
      const blockchainData = await blockchainService.getProposal(proposalId);
      const isVotingOpen = await blockchainService.isVotingOpen(proposalId);

      return {
        proposal,
        blockchainData: {
          yesVotes: blockchainData.yesVotes.toString(),
          noVotes: blockchainData.noVotes.toString(),
          votingOpen: isVotingOpen,
        },
      };
    } catch (error: any) {
      console.error(`⚠️ Failed to fetch blockchain data for proposal ${proposalId}:`, error.message);
      return {
        proposal,
        blockchainData: null,
      };
    }
  }

  /**
   * Get all proposals with their current status
   * @returns List of proposals with status
   */
  async getAllProposalsWithStatus(): Promise<Array<Proposal & {
    status: 'upcoming' | 'active' | 'ended';
    votingOpen: boolean;
  }>> {
    const proposals = await this.getAllProposals();
    const now = new Date();

    const proposalsWithStatus = await Promise.all(
      proposals.map(async (proposal) => {
        let status: 'upcoming' | 'active' | 'ended';
        let votingOpen = false;

        if (now < proposal.startTime) {
          status = 'upcoming';
        } else if (now > proposal.endTime) {
          status = 'ended';
        } else {
          status = 'active';
          // Check blockchain for actual voting status
          try {
            votingOpen = await blockchainService.isVotingOpen(proposal.proposalId);
          } catch {
            votingOpen = true; // Assume open if we can't check
          }
        }

        return {
          ...proposal,
          status,
          votingOpen,
        };
      })
    );

    return proposalsWithStatus;
  }

  /**
   * Get proposal result from blockchain
   * @param proposalId - The blockchain proposal ID
   * @returns Voting results
   */
  async getProposalResult(proposalId: number): Promise<{
    proposalId: number;
    title: string;
    description: string | null;
    yesVotes: string;
    noVotes: string;
    totalVotes: string;
    yesPercentage: number;
    noPercentage: number;
    votingOpen: boolean;
    startTime: Date;
    endTime: Date;
  }> {
    const proposal = await this.getProposalById(proposalId);

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const result = await blockchainService.getProposalResult(proposalId);
    
    const yesVotes = result.yesVotes;
    const noVotes = result.noVotes;
    const totalVotes = yesVotes + noVotes;

    const yesPercentage = totalVotes > 0n 
      ? Number((yesVotes * 10000n) / totalVotes) / 100 
      : 0;
    const noPercentage = totalVotes > 0n 
      ? Number((noVotes * 10000n) / totalVotes) / 100 
      : 0;

    return {
      proposalId: proposal.proposalId,
      title: proposal.title,
      description: proposal.description,
      yesVotes: yesVotes.toString(),
      noVotes: noVotes.toString(),
      totalVotes: totalVotes.toString(),
      yesPercentage,
      noPercentage,
      votingOpen: result.votingOpen,
      startTime: proposal.startTime,
      endTime: proposal.endTime,
    };
  }

  /**
   * Deactivate a proposal (mark as inactive)
   * @param proposalId - The blockchain proposal ID
   * @returns Updated proposal
   */
  async deactivateProposal(proposalId: number): Promise<Proposal> {
    const proposal = await prisma.proposal.update({
      where: { proposalId },
      data: { isActive: false },
    });

    console.log(`🚫 Proposal deactivated: ID=${proposalId}`);

    return proposal;
  }

  /**
   * Get upcoming proposals (voting not started yet)
   * @returns List of upcoming proposals
   */
  async getUpcomingProposals(): Promise<Proposal[]> {
    const now = new Date();

    const proposals = await prisma.proposal.findMany({
      where: {
        isActive: true,
        startTime: { gt: now },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return proposals;
  }

  /**
   * Get active proposals (voting currently open)
   * @returns List of active proposals
   */
  async getActiveProposals(): Promise<Proposal[]> {
    const now = new Date();

    const proposals = await prisma.proposal.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: {
        endTime: 'asc',
      },
    });

    return proposals;
  }

  /**
   * Get ended proposals (voting completed)
   * @returns List of ended proposals
   */
  async getEndedProposals(): Promise<Proposal[]> {
    const now = new Date();

    const proposals = await prisma.proposal.findMany({
      where: {
        isActive: true,
        endTime: { lt: now },
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    return proposals;
  }
}

export const proposalService = new ProposalService();
