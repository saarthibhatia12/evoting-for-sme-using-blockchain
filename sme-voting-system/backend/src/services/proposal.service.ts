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
   * @param votingType - Type of voting: 'simple' (default) or 'quadratic'
   * @param baseTokens - Base token pool for quadratic voting (default: 100)
   * @returns The created proposal
   */
  async createProposal(
    title: string,
    description: string | undefined,
    startTime: Date | number,
    endTime: Date | number,
    votingType: 'simple' | 'quadratic' = 'simple',  // NEW: Default to 'simple' for backward compatibility
    baseTokens: number = 100                         // NEW: Default to 100 for quadratic voting
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

    // Create proposal on the appropriate blockchain contract based on voting type
    let blockchainResult;
    
    if (votingType === 'quadratic') {
      // Create on QuadraticVoting contract
      blockchainResult = await blockchainService.createQuadraticProposal(
        title,
        startTimestamp,
        endTimestamp,
        baseTokens
      );
    } else {
      // Create on simple Voting contract (default)
      blockchainResult = await blockchainService.createProposal(
        title,
        startTimestamp,
        endTimestamp
      );
    }

    if (!blockchainResult.success || !blockchainResult.proposalId) {
      throw new Error(blockchainResult.error || 'Failed to create proposal on blockchain');
    }

    // Create or update proposal in database (upsert handles blockchain reset scenarios)
    const proposal = await prisma.proposal.upsert({
      where: {
        proposalId: blockchainResult.proposalId,
      },
      update: {
        title,
        description,
        startTime: new Date(startTimestamp * 1000),
        endTime: new Date(endTimestamp * 1000),
        isActive: true,
        votingType,   // NEW: Include voting type (defaults to 'simple')
        baseTokens,   // NEW: Include base tokens (defaults to 100)
      },
      create: {
        proposalId: blockchainResult.proposalId,
        title,
        description,
        startTime: new Date(startTimestamp * 1000),
        endTime: new Date(endTimestamp * 1000),
        isActive: true,
        votingType,   // NEW: Include voting type (defaults to 'simple')
        baseTokens,   // NEW: Include base tokens (defaults to 100)
      },
    });

    console.log(`✅ Proposal created: ID=${proposal.proposalId}, Title="${title}", VotingType=${votingType}`);

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
   * Get proposal with blockchain data (falls back to database if unavailable)
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

    // Check if voting is still open based on time
    const now = new Date();
    const isVotingPeriodActive = now >= proposal.startTime && now <= proposal.endTime && proposal.isActive;

    try {
      const blockchainData = await blockchainService.getProposal(proposalId);
      
      // If blockchain has data with votes, use it
      if (blockchainData && (blockchainData.yesVotes > 0n || blockchainData.noVotes > 0n)) {
        const blockchainVotingOpen = await blockchainService.isVotingOpen(proposalId);
        // Trust blockchain if it says open, otherwise fall back to time-based check
        const isVotingOpen = blockchainVotingOpen || isVotingPeriodActive;
        
        return {
          proposal,
          blockchainData: {
            yesVotes: blockchainData.yesVotes.toString(),
            noVotes: blockchainData.noVotes.toString(),
            votingOpen: isVotingOpen,
          },
        };
      }
      
      // Blockchain empty or unavailable - fall back to database
      console.log(`📊 Using database results for proposal ${proposalId} (blockchain data unavailable)`);
      const dbResults = await this.calculateResultsFromDatabase(proposalId);
      
      return {
        proposal,
        blockchainData: {
          yesVotes: dbResults.yesVotes.toString(),
          noVotes: dbResults.noVotes.toString(),
          votingOpen: isVotingPeriodActive,
        },
      };
    } catch (error: any) {
      console.error(`⚠️ Failed to fetch blockchain data for proposal ${proposalId}:`, error.message);
      
      // Fall back to database on error
      const dbResults = await this.calculateResultsFromDatabase(proposalId);
      
      return {
        proposal,
        blockchainData: {
          yesVotes: dbResults.yesVotes.toString(),
          noVotes: dbResults.noVotes.toString(),
          votingOpen: isVotingPeriodActive,
        },
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

        // Determine status based on time
        if (now < proposal.startTime) {
          status = 'upcoming';
          votingOpen = false;
        } else if (now > proposal.endTime) {
          status = 'ended';
          votingOpen = false;
        } else {
          // Proposal is in active time window
          status = 'active';
          
          // Time-based check says voting should be open
          const isInVotingPeriod = proposal.isActive && now >= proposal.startTime && now <= proposal.endTime;
          
          // Try to verify with blockchain, but trust the time-based check if blockchain fails or disagrees
          try {
            const blockchainVotingOpen = await blockchainService.isVotingOpen(proposal.proposalId);
            // Use blockchain result if it says open, otherwise trust time-based check
            // This handles cases where proposal might not be synced to blockchain yet
            votingOpen = blockchainVotingOpen || isInVotingPeriod;
          } catch {
            // Blockchain unavailable - trust time-based check
            votingOpen = isInVotingPeriod;
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
   * Calculate results from database votes (weighted by shares)
   * This is the source of truth when blockchain data is unavailable
   */
  private async calculateResultsFromDatabase(proposalId: number): Promise<{
    yesVotes: bigint;
    noVotes: bigint;
  }> {
    // Get the proposal to determine voting type
    const proposal = await prisma.proposal.findFirst({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Get all votes for this proposal with shareholder shares
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

    let yesVotes = 0n;
    let noVotes = 0n;

    for (const vote of votes) {
      let voteWeight: bigint;
      
      if (proposal.votingType === 'quadratic') {
        // For quadratic voting, use voteWeight (vote count)
        voteWeight = BigInt(vote.voteWeight);
      } else {
        // For simple voting, use share weight
        voteWeight = BigInt(vote.shareholder.shares?.shares || 0);
      }
      
      if (vote.voteChoice) {
        yesVotes += voteWeight;
      } else {
        noVotes += voteWeight;
      }
    }

    return { yesVotes, noVotes };
  }

  /**
   * Get proposal result - tries blockchain first, falls back to database
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

    // Check if voting is still open based on time
    const now = new Date();
    const isVotingPeriodActive = now >= proposal.startTime && now <= proposal.endTime;

    let yesVotes: bigint;
    let noVotes: bigint;
    let votingOpen = false;

    // Try to get results from blockchain first
    const blockchainResult = await blockchainService.getProposalResult(proposalId);
    
    if (blockchainResult && (blockchainResult.yesVotes > 0n || blockchainResult.noVotes > 0n)) {
      // Blockchain has data, use it
      yesVotes = blockchainResult.yesVotes;
      noVotes = blockchainResult.noVotes;
      // Trust blockchain if it says open, otherwise fall back to time-based check
      votingOpen = blockchainResult.votingOpen || (isVotingPeriodActive && proposal.isActive);
    } else {
      // Blockchain data unavailable or empty - calculate from database
      console.log(`📊 Calculating results from database for proposal ${proposalId} (blockchain data unavailable)`);
      const dbResults = await this.calculateResultsFromDatabase(proposalId);
      yesVotes = dbResults.yesVotes;
      noVotes = dbResults.noVotes;
      votingOpen = isVotingPeriodActive && proposal.isActive;
    }

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
      votingOpen,
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
