import { ethers } from 'ethers';
import { prisma } from './database.service';
import { blockchainService } from './blockchain.service';
import { quadraticVotingService } from './quadratic-voting.service';
import { Vote } from '@prisma/client';

/**
 * Vote with related data
 */
export interface VoteWithRelations extends Vote {
  shareholder?: {
    id: number;
    walletAddress: string;
    name: string;
  };
  proposal?: {
    proposalId: number;
    title: string;
  };
}

/**
 * Voting Service
 * Handles vote casting and vote retrieval
 */
class VotingService {
  /**
   * Cast a vote on a proposal
   * Routes to appropriate voting logic based on proposal's votingType
   * 
   * @param walletAddress - Voter's wallet address
   * @param proposalId - The proposal ID to vote on
   * @param voteChoice - true for yes, false for no
   * @param voteCount - Number of votes to cast (only used for quadratic voting, default: 1)
   * @returns The vote record with optional token info for quadratic voting
   */
  async castVote(
    walletAddress: string,
    proposalId: number,
    voteChoice: boolean,
    voteCount: number = 1  // NEW: Optional parameter with default 1 for backward compatibility
  ): Promise<{
    vote: Vote;
    blockchainTx?: string;
    tokensSpent?: number;        // NEW: Only for quadratic voting
    remainingTokens?: number;    // NEW: Only for quadratic voting
    votingPower?: number;        // NEW: Only for quadratic voting
  }> {
    // ============================================================
    // ROUTING LOGIC: Check voting type and route accordingly
    // ============================================================
    
    // First, fetch the proposal to determine voting type
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // QUADRATIC VOTING PATH - Route to separate service
    if (proposal.votingType === 'quadratic') {
      const result = await quadraticVotingService.castQuadraticVote(
        walletAddress,
        proposalId,
        voteChoice,
        voteCount
      );
      
      return {
        vote: result.vote,
        blockchainTx: result.blockchainTx,
        tokensSpent: result.tokensSpent,
        remainingTokens: result.remainingTokens,
        votingPower: result.votingPower,
      };
    }

    // ============================================================
    // SIMPLE VOTING PATH - EXISTING CODE UNCHANGED BELOW
    // ============================================================
    
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);

    // Check if shareholder exists and is active
    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { shares: true },
    });

    if (!shareholder) {
      throw new Error('Only registered shareholders can vote');
    }

    if (!shareholder.isActive) {
      throw new Error('Your shareholder account is inactive');
    }

    if (!shareholder.shares || shareholder.shares.shares <= 0) {
      throw new Error('You must have shares to vote');
    }

    // NOTE: proposal already fetched above in routing logic

    if (!proposal.isActive) {
      throw new Error('Proposal is not active');
    }

    // Check voting period
    const now = new Date();
    if (now < proposal.startTime) {
      throw new Error('Voting has not started yet');
    }
    if (now > proposal.endTime) {
      throw new Error('Voting has ended');
    }

    // Check if already voted in database
    const existingVote = await prisma.vote.findUnique({
      where: {
        shareholderId_proposalId: {
          shareholderId: shareholder.id,
          proposalId: proposal.proposalId,
        },
      },
    });

    if (existingVote) {
      throw new Error('You have already voted on this proposal');
    }

    // Verify vote was cast on blockchain
    // The frontend casts the vote using MetaMask FIRST, then calls this API
    // We verify it exists on blockchain and record it in the database
    let blockchainTx: string | undefined;
    
    try {
      // Verify the vote exists on blockchain (frontend should have already cast it)
      const hasVotedOnChain = await blockchainService.hasVotedOnProposal(proposalId, normalizedAddress);
      
      if (hasVotedOnChain) {
        console.log(`✅ Vote verified on blockchain for ${shareholder.name}`);
      } else {
        console.warn('⚠️  Vote not yet confirmed on blockchain, recording anyway (pending confirmation)');
      }
    } catch (error: any) {
      console.warn(`⚠️ Could not verify vote on blockchain: ${error.message}`);
      // Continue anyway - the vote may still be pending
    }

    // Create vote record in database
    const vote = await prisma.vote.create({
      data: {
        shareholderId: shareholder.id,
        proposalId: proposal.proposalId,
        voteChoice,
        txHash: blockchainTx || null,
      },
    });

    console.log(`✅ Vote cast: Shareholder=${shareholder.name}, Proposal=${proposal.title}, Choice=${voteChoice ? 'YES' : 'NO'}`);

    return {
      vote,
      blockchainTx,
    };
  }

  /**
   * Get votes by shareholder
   * @param walletAddress - Shareholder's wallet address
   * @returns List of votes by this shareholder
   */
  async getVotesByShareHolder(walletAddress: string): Promise<VoteWithRelations[]> {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);

    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!shareholder) {
      return [];
    }

    const votes = await prisma.vote.findMany({
      where: { shareholderId: shareholder.id },
      include: {
        proposal: {
          select: {
            proposalId: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        votedAt: 'desc',
      },
    });

    return votes as VoteWithRelations[];
  }

  /**
   * Get votes for a proposal
   * @param proposalId - The proposal ID
   * @returns List of votes for this proposal
   */
  async getVotesForProposal(proposalId: number): Promise<VoteWithRelations[]> {
    const votes = await prisma.vote.findMany({
      where: { proposalId },
      include: {
        shareholder: {
          select: {
            id: true,
            walletAddress: true,
            name: true,
          },
        },
      },
      orderBy: {
        votedAt: 'desc',
      },
    });

    return votes as VoteWithRelations[];
  }

  /**
   * Check if a shareholder has voted on a proposal
   * @param walletAddress - Shareholder's wallet address
   * @param proposalId - The proposal ID
   * @returns True if already voted
   */
  async hasVoted(walletAddress: string, proposalId: number): Promise<boolean> {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);

    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!shareholder) {
      return false;
    }

    const vote = await prisma.vote.findUnique({
      where: {
        shareholderId_proposalId: {
          shareholderId: shareholder.id,
          proposalId,
        },
      },
    });

    return !!vote;
  }

  /**
   * Get vote summary for a proposal
   * @param proposalId - The proposal ID
   * @returns Vote count summary
   */
  async getVoteSummary(proposalId: number): Promise<{
    yesVotes: number;
    noVotes: number;
    totalVotes: number;
    yesPercentage: number;
    noPercentage: number;
  }> {
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

    for (const vote of votes) {
      const shareCount = vote.shareholder?.shares?.shares || 0;
      if (vote.voteChoice) {
        yesVotes += shareCount;
      } else {
        noVotes += shareCount;
      }
    }

    const totalVotes = yesVotes + noVotes;
    const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
    const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;

    return {
      yesVotes,
      noVotes,
      totalVotes,
      yesPercentage: Math.round(yesPercentage * 100) / 100,
      noPercentage: Math.round(noPercentage * 100) / 100,
    };
  }

  /**
   * Get all votes for the current user with proposal details
   * @param walletAddress - User's wallet address
   * @returns Detailed vote history
   */
  async getMyVotes(walletAddress: string): Promise<Array<{
    proposalId: number;
    proposalTitle: string;
    voteChoice: boolean;
    votedAt: Date;
    proposalStatus: 'upcoming' | 'active' | 'ended';
  }>> {
    const votes = await this.getVotesByShareHolder(walletAddress);
    const now = new Date();

    return votes.map((vote) => {
      let status: 'upcoming' | 'active' | 'ended';
      const proposal = vote.proposal as any;

      if (now < proposal.startTime) {
        status = 'upcoming';
      } else if (now > proposal.endTime) {
        status = 'ended';
      } else {
        status = 'active';
      }

      return {
        proposalId: proposal.proposalId,
        proposalTitle: proposal.title,
        voteChoice: vote.voteChoice,
        votedAt: vote.votedAt,
        proposalStatus: status,
      };
    });
  }
}

export const votingService = new VotingService();
