import { ethers } from 'ethers';
import { prisma } from './database.service';
import { blockchainService } from './blockchain.service';
import { Vote, VoterTokenBalance, Proposal } from '@prisma/client';

/**
 * Quadratic vote result interface
 */
export interface QuadraticVoteResult {
  vote: Vote;
  tokensSpent: number;
  remainingTokens: number;
  currentVotes: number;
  votingPower: number;
  blockchainTx?: string;
}

/**
 * Token balance with calculated fields
 */
export interface TokenBalanceInfo {
  shareholderId: number;
  proposalId: number;
  totalTokens: number;
  tokensUsed: number;
  remainingTokens: number;
  voteDirection: boolean | null;
  currentVotes: number;
  votingPower: number;
  maxAdditionalVotes: number;
}

/**
 * Vote cost preview
 */
export interface VoteCostPreview {
  currentVotes: number;
  additionalVotes: number;
  cost: number;
  newTotalVotes: number;
  newTotalTokensSpent: number;
  remainingTokensAfter: number;
  votingPowerAfter: number;
  canAfford: boolean;
}

/**
 * Quadratic Voting Service
 * 
 * IMPORTANT: This service handles ONLY quadratic voting logic.
 * Simple voting continues to use the existing voting.service.ts UNCHANGED.
 * 
 * Key Design Decisions:
 * - Cost Model: n² total cost (3 votes cost 9 tokens total)
 * - Token Pool: 100 × share ratio (default baseTokens = 100)
 * - Vote Direction: Single direction (YES or NO, not both)
 * - Token Persistence: Per-proposal fresh allocation
 */
class QuadraticVotingService {
  
  /**
   * Calculate tokens for a shareholder on a proposal
   * Formula: baseTokens × (shareholderShares / totalShares)
   * 
   * @param proposalId - The proposal ID
   * @param shareholderId - The shareholder ID
   * @returns Number of tokens allocated
   */
  async calculateVoterTokens(
    proposalId: number, 
    shareholderId: number
  ): Promise<number> {
    const proposal = await prisma.proposal.findUnique({ 
      where: { proposalId } 
    });
    
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    if (proposal.votingType !== 'quadratic') {
      throw new Error('Proposal is not quadratic voting type');
    }
    
    const shareholder = await prisma.shareholder.findUnique({
      where: { id: shareholderId },
      include: { shares: true },
    });
    
    if (!shareholder) {
      throw new Error('Shareholder not found');
    }
    
    if (!shareholder.shares || shareholder.shares.shares <= 0) {
      throw new Error('Shareholder has no shares');
    }
    
    // Get total shares across all active shareholders
    const totalSharesResult = await prisma.share.aggregate({ 
      _sum: { shares: true },
      where: {
        shareholder: {
          isActive: true,
        },
      },
    });
    
    const totalShares = totalSharesResult._sum.shares ?? 0;
    
    if (totalShares <= 0) {
      throw new Error('No active shares in the system');
    }
    
    const shareholderShares = shareholder.shares.shares;
    const baseTokens = proposal.baseTokens ?? 100;
    
    // Calculate tokens proportionally: baseTokens × (shareholderShares / totalShares)
    const tokens = Math.floor(baseTokens * (shareholderShares / totalShares));
    
    // Ensure at least 1 token if shareholder has any shares
    return Math.max(tokens, 1);
  }
  
  /**
   * Ensure voter tokens are initialized on the blockchain
   * Checks blockchain state and initializes if not already done
   * 
   * @param proposalId - The proposal ID
   * @param walletAddress - The voter's wallet address
   * @param tokens - Number of tokens to initialize
   */
  async ensureBlockchainTokensInitialized(
    proposalId: number,
    walletAddress: string,
    tokens: number
  ): Promise<void> {
    try {
      // Try to initialize - will fail silently if already initialized
      const blockchainResult = await blockchainService.initializeVoterTokens(
        proposalId,
        walletAddress,
        tokens
      );
      
      if (blockchainResult.success) {
        console.log(`✅ Tokens initialized on blockchain: TX=${blockchainResult.txHash}`);
      } else if (blockchainResult.error?.includes('already initialized')) {
        console.log(`ℹ️ Tokens already initialized on blockchain for ${walletAddress}`);
      } else {
        console.warn(`⚠️ Failed to initialize tokens on blockchain: ${blockchainResult.error}`);
      }
    } catch (blockchainError: any) {
      // Check if it's "already initialized" error - that's OK
      if (blockchainError.message?.includes('already initialized')) {
        console.log(`ℹ️ Tokens already initialized on blockchain for ${walletAddress}`);
      } else {
        console.warn(`⚠️ Blockchain token initialization error: ${blockchainError.message}`);
      }
    }
  }

  /**
   * Get or create token balance for a voter on a proposal
   * Creates the token balance on first access (lazy initialization)
   * Also ensures tokens are initialized on the blockchain
   * 
   * @param proposalId - The proposal ID
   * @param shareholderId - The shareholder ID
   * @param ensureBlockchain - Whether to ensure blockchain tokens are initialized (default: true)
   * @returns The voter token balance record
   */
  async getOrCreateTokenBalance(
    proposalId: number, 
    shareholderId: number,
    ensureBlockchain: boolean = true
  ): Promise<VoterTokenBalance> {
    // Get shareholder info - needed for wallet address
    const shareholder = await prisma.shareholder.findUnique({
      where: { id: shareholderId }
    });
    
    if (!shareholder) {
      throw new Error('Shareholder not found');
    }

    // Try to find existing balance
    let balance = await prisma.voterTokenBalance.findUnique({
      where: {
        shareholderId_proposalId: { shareholderId, proposalId }
      }
    });
    
    // If not found, calculate and create in DB
    if (!balance) {
      const tokens = await this.calculateVoterTokens(proposalId, shareholderId);
      
      // Create database entry
      balance = await prisma.voterTokenBalance.create({
        data: {
          shareholderId,
          proposalId,
          totalTokens: tokens,
          tokensUsed: 0,           // Default: 0 - no tokens spent yet
          voteDirection: null,     // Default: null - not voted yet
        }
      });
      
      console.log(`📊 Token balance initialized in DB: Shareholder=${shareholderId}, Proposal=${proposalId}, Tokens=${tokens}`);
    }
    
    // Always ensure blockchain tokens are initialized (handles both new and existing DB entries)
    if (ensureBlockchain) {
      await this.ensureBlockchainTokensInitialized(
        proposalId,
        shareholder.walletAddress,
        balance.totalTokens
      );
    }
    
    return balance;
  }
  
  /**
   * Get token balance info with calculated fields
   * 
   * @param proposalId - The proposal ID
   * @param shareholderId - The shareholder ID
   * @returns Token balance with calculated voting power and remaining tokens
   */
  async getTokenBalanceInfo(
    proposalId: number,
    shareholderId: number
  ): Promise<TokenBalanceInfo> {
    const balance = await this.getOrCreateTokenBalance(proposalId, shareholderId);
    
    const remainingTokens = balance.totalTokens - balance.tokensUsed;
    const currentVotes = this.calculateVotesFromTokens(balance.tokensUsed);
    const votingPower = this.calculateVotingPower(balance.tokensUsed);
    const maxAdditionalVotes = this.calculateMaxVotesWithTokens(currentVotes, remainingTokens);
    
    return {
      shareholderId: balance.shareholderId,
      proposalId: balance.proposalId,
      totalTokens: balance.totalTokens,
      tokensUsed: balance.tokensUsed,
      remainingTokens,
      voteDirection: balance.voteDirection,
      currentVotes,
      votingPower,
      maxAdditionalVotes,
    };
  }
  
  /**
   * Calculate cost for additional votes
   * Formula: (currentVotes + additionalVotes)² - currentVotes²
   * 
   * Examples:
   * - 0→3 votes: 3² - 0² = 9 tokens
   * - 2→5 votes: 5² - 2² = 25 - 4 = 21 tokens
   * 
   * @param currentVotes - Number of votes already cast
   * @param additionalVotes - Number of additional votes to cast
   * @returns Token cost for the additional votes
   */
  calculateVoteCost(currentVotes: number, additionalVotes: number): number {
    if (additionalVotes <= 0) {
      return 0;
    }
    
    const newTotal = currentVotes + additionalVotes;
    return (newTotal * newTotal) - (currentVotes * currentVotes);
  }
  
  /**
   * Calculate votes from tokens spent
   * Inverse of the cost formula: votes = √tokensSpent
   * 
   * @param tokensSpent - Number of tokens spent
   * @returns Number of votes (rounded down)
   */
  calculateVotesFromTokens(tokensSpent: number): number {
    if (tokensSpent <= 0) {
      return 0;
    }
    return Math.floor(Math.sqrt(tokensSpent));
  }
  
  /**
   * Calculate voting power from tokens spent
   * Voting power = √tokensSpent (exact, not rounded)
   * 
   * @param tokensSpent - Number of tokens spent
   * @returns Voting power (may be fractional)
   */
  calculateVotingPower(tokensSpent: number): number {
    if (tokensSpent <= 0) {
      return 0;
    }
    return Math.sqrt(tokensSpent);
  }
  
  /**
   * Calculate maximum additional votes possible with remaining tokens
   * 
   * @param currentVotes - Current number of votes
   * @param remainingTokens - Remaining tokens available
   * @returns Maximum additional votes that can be afforded
   */
  calculateMaxVotesWithTokens(currentVotes: number, remainingTokens: number): number {
    if (remainingTokens <= 0) {
      return 0;
    }
    
    // Binary search for max votes we can afford
    // Formula: (currentVotes + x)² - currentVotes² ≤ remainingTokens
    // Solving: x ≤ √(remainingTokens + currentVotes²) - currentVotes
    const maxVotes = Math.floor(
      Math.sqrt(remainingTokens + currentVotes * currentVotes) - currentVotes
    );
    
    return Math.max(maxVotes, 0);
  }
  
  /**
   * Preview the cost for casting additional votes
   * 
   * @param proposalId - The proposal ID
   * @param shareholderId - The shareholder ID
   * @param additionalVotes - Number of additional votes to preview
   * @returns Cost preview with all relevant information
   */
  async previewVoteCost(
    proposalId: number,
    shareholderId: number,
    additionalVotes: number
  ): Promise<VoteCostPreview> {
    const balanceInfo = await this.getTokenBalanceInfo(proposalId, shareholderId);
    
    const cost = this.calculateVoteCost(balanceInfo.currentVotes, additionalVotes);
    const newTotalVotes = balanceInfo.currentVotes + additionalVotes;
    const newTotalTokensSpent = balanceInfo.tokensUsed + cost;
    const remainingTokensAfter = balanceInfo.remainingTokens - cost;
    const votingPowerAfter = this.calculateVotingPower(newTotalTokensSpent);
    const canAfford = cost <= balanceInfo.remainingTokens;
    
    return {
      currentVotes: balanceInfo.currentVotes,
      additionalVotes,
      cost,
      newTotalVotes,
      newTotalTokensSpent,
      remainingTokensAfter,
      votingPowerAfter,
      canAfford,
    };
  }
  
  /**
   * Cast a quadratic vote
   * Can be called multiple times (incremental voting) as long as:
   * - Direction remains the same
   * - Sufficient tokens are available
   * 
   * @param walletAddress - The voter's wallet address
   * @param proposalId - The proposal ID
   * @param voteChoice - true for YES, false for NO
   * @param voteCount - Number of additional votes to cast (default: 1)
   * @returns The vote result with token and voting power information
   */
  async castQuadraticVote(
    walletAddress: string,
    proposalId: number,
    voteChoice: boolean,
    voteCount: number = 1  // Default: 1 vote for backward compatibility
  ): Promise<QuadraticVoteResult> {
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

    // Validate vote count
    if (voteCount <= 0) {
      throw new Error('Vote count must be at least 1');
    }

    // Check if proposal exists and is quadratic voting type
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.votingType !== 'quadratic') {
      throw new Error('This proposal does not use quadratic voting');
    }

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

    // Get or create token balance
    const tokenBalance = await this.getOrCreateTokenBalance(proposalId, shareholder.id);

    // Check vote direction consistency
    if (tokenBalance.voteDirection !== null && tokenBalance.voteDirection !== voteChoice) {
      throw new Error('Cannot change vote direction. You have already voted ' + 
        (tokenBalance.voteDirection ? 'YES' : 'NO'));
    }

    // Calculate cost
    const currentVotes = this.calculateVotesFromTokens(tokenBalance.tokensUsed);
    const cost = this.calculateVoteCost(currentVotes, voteCount);
    const remainingTokens = tokenBalance.totalTokens - tokenBalance.tokensUsed;

    if (cost > remainingTokens) {
      throw new Error(
        `Insufficient tokens. Cost: ${cost} tokens, Available: ${remainingTokens} tokens. ` +
        `You can afford up to ${this.calculateMaxVotesWithTokens(currentVotes, remainingTokens)} more votes.`
      );
    }

    // Use a transaction to update token balance and create/update vote
    const result = await prisma.$transaction(async (tx) => {
      // Update token balance
      const updatedBalance = await tx.voterTokenBalance.update({
        where: {
          shareholderId_proposalId: {
            shareholderId: shareholder.id,
            proposalId: proposal.proposalId,
          },
        },
        data: {
          tokensUsed: tokenBalance.tokensUsed + cost,
          voteDirection: voteChoice,
        },
      });

      // Check if vote record already exists
      const existingVote = await tx.vote.findUnique({
        where: {
          shareholderId_proposalId: {
            shareholderId: shareholder.id,
            proposalId: proposal.proposalId,
          },
        },
      });

      let vote: Vote;

      if (existingVote) {
        // Update existing vote with new weight and tokens spent
        const newWeight = currentVotes + voteCount;
        const newTokensSpent = tokenBalance.tokensUsed + cost;

        vote = await tx.vote.update({
          where: {
            shareholderId_proposalId: {
              shareholderId: shareholder.id,
              proposalId: proposal.proposalId,
            },
          },
          data: {
            voteWeight: newWeight,
            tokensSpent: newTokensSpent,
          },
        });
      } else {
        // Create new vote record
        vote = await tx.vote.create({
          data: {
            shareholderId: shareholder.id,
            proposalId: proposal.proposalId,
            voteChoice,
            voteWeight: voteCount,
            tokensSpent: cost,
            txHash: null,
          },
        });
      }

      return {
        vote,
        updatedBalance,
      };
    });

    const newTotalVotes = currentVotes + voteCount;
    const newTotalTokensSpent = tokenBalance.tokensUsed + cost;
    const newRemainingTokens = tokenBalance.totalTokens - newTotalTokensSpent;
    const newVotingPower = this.calculateVotingPower(newTotalTokensSpent);

    console.log(
      `📊 Quadratic vote cast: ` +
      `Shareholder=${shareholder.name}, ` +
      `Proposal=${proposal.title}, ` +
      `Choice=${voteChoice ? 'YES' : 'NO'}, ` +
      `Votes=${voteCount} (total: ${newTotalVotes}), ` +
      `Cost=${cost} tokens, ` +
      `Remaining=${newRemainingTokens} tokens, ` +
      `VotingPower=${newVotingPower.toFixed(2)}`
    );

    return {
      vote: result.vote,
      tokensSpent: cost,
      remainingTokens: newRemainingTokens,
      currentVotes: newTotalVotes,
      votingPower: newVotingPower,
      blockchainTx: undefined, // Blockchain integration can be added later
    };
  }

  /**
   * Get quadratic voting results for a proposal
   * Returns aggregated voting power for YES and NO
   * 
   * @param proposalId - The proposal ID
   * @returns Voting results with voting power calculations
   */
  async getQuadraticResults(proposalId: number): Promise<{
    yesVotingPower: number;
    noVotingPower: number;
    totalVotingPower: number;
    yesPercentage: number;
    noPercentage: number;
    yesTokensSpent: number;
    noTokensSpent: number;
    totalTokensSpent: number;
    voterCount: number;
  }> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.votingType !== 'quadratic') {
      throw new Error('Proposal is not quadratic voting type');
    }

    // Get all votes for this proposal
    const votes = await prisma.vote.findMany({
      where: { proposalId },
    });

    let yesTokensSpent = 0;
    let noTokensSpent = 0;

    for (const vote of votes) {
      if (vote.voteChoice) {
        yesTokensSpent += vote.tokensSpent;
      } else {
        noTokensSpent += vote.tokensSpent;
      }
    }

    // Calculate voting power (√tokensSpent)
    const yesVotingPower = this.calculateVotingPower(yesTokensSpent);
    const noVotingPower = this.calculateVotingPower(noTokensSpent);
    const totalVotingPower = yesVotingPower + noVotingPower;

    const yesPercentage = totalVotingPower > 0 
      ? (yesVotingPower / totalVotingPower) * 100 
      : 0;
    const noPercentage = totalVotingPower > 0 
      ? (noVotingPower / totalVotingPower) * 100 
      : 0;

    return {
      yesVotingPower,
      noVotingPower,
      totalVotingPower,
      yesPercentage: Math.round(yesPercentage * 100) / 100,
      noPercentage: Math.round(noPercentage * 100) / 100,
      yesTokensSpent,
      noTokensSpent,
      totalTokensSpent: yesTokensSpent + noTokensSpent,
      voterCount: votes.length,
    };
  }

  /**
   * Initialize token balances for all active shareholders on a quadratic proposal
   * This is useful for pre-calculating token allocations
   * 
   * @param proposalId - The proposal ID
   * @returns Number of token balances initialized
   */
  async initializeAllTokenBalances(proposalId: number): Promise<number> {
    const proposal = await prisma.proposal.findUnique({
      where: { proposalId },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.votingType !== 'quadratic') {
      throw new Error('Proposal is not quadratic voting type');
    }

    // Get all active shareholders with shares
    const shareholders = await prisma.shareholder.findMany({
      where: {
        isActive: true,
        shares: {
          shares: {
            gt: 0,
          },
        },
      },
    });

    let initialized = 0;

    for (const shareholder of shareholders) {
      try {
        await this.getOrCreateTokenBalance(proposalId, shareholder.id);
        initialized++;
      } catch (error: any) {
        console.warn(`⚠️ Could not initialize tokens for shareholder ${shareholder.id}: ${error.message}`);
      }
    }

    console.log(`📊 Token balances initialized for ${initialized} shareholders on proposal ${proposalId}`);

    return initialized;
  }
}

export const quadraticVotingService = new QuadraticVotingService();
