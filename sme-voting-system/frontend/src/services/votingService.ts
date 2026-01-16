// =============================================================================
// VOTING SERVICE - Task 4.6
// Handles vote casting, vote status checking, and vote retrieval
// =============================================================================

import api from './api';

export interface Vote {
  id: number;
  shareholderId: number;
  proposalId: number;
  voteChoice: boolean;
  txHash: string | null;
  votedAt: string;
  shareholder?: {
    id: number;
    walletAddress: string;
    name: string;
    shares?: number;
  };
}

export interface MyVote {
  proposalId: number;
  proposalTitle: string;
  voteChoice: boolean;
  votedAt: string;
  proposalStatus: 'upcoming' | 'active' | 'ended';
}

export interface VoteRequest {
  proposalId: number;
  voteChoice: boolean; // true = Yes, false = No
}

export interface VoteResponse {
  success: boolean;
  data: {
    vote: Vote;
    blockchainTx?: string;
  };
  message: string;
}

export interface VoteStatusResponse {
  success: boolean;
  data: {
    proposalId: number;
    hasVoted: boolean;
  };
}

export interface MyVotesResponse {
  success: boolean;
  data: {
    votes: MyVote[];
    count: number;
  };
}

export interface VoteSummary {
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  yesPercentage: number;
  noPercentage: number;
}

export interface ProposalVotesResponse {
  success: boolean;
  data: {
    votes: Vote[];
    summary: VoteSummary;
    count: number;
  };
}

// Cast a vote on a proposal
export const castVote = async (proposalId: number, voteChoice: boolean): Promise<VoteResponse> => {
  const response = await api.post('/vote', { proposalId, voteChoice });
  return response.data;
};

// Check if user has already voted on a proposal
export const checkVoteStatus = async (proposalId: number): Promise<VoteStatusResponse> => {
  const response = await api.get(`/vote/check/${proposalId}`);
  return response.data;
};

// Get all votes by current user
export const getMyVotes = async (): Promise<MyVotesResponse> => {
  const response = await api.get('/vote/my-votes');
  return response.data;
};

// Get all votes for a proposal (Admin only)
export const getVotesForProposal = async (proposalId: number): Promise<ProposalVotesResponse> => {
  const response = await api.get(`/vote/proposal/${proposalId}`);
  return response.data;
};

// =============================================================================
// QUADRATIC VOTING FUNCTIONS
// =============================================================================

export interface TokenBalance {
  proposalId: number;
  shareholderId: number;
  totalTokens: number;
  tokensUsed: number;
  tokensRemaining: number;
  currentVotes: number;
  voteDirection: boolean | null;
  isDirectionLocked: boolean;
}

export interface TokenBalanceResponse {
  success: boolean;
  data: TokenBalance;
}

export interface CostPreview {
  proposalId: number;
  currentVotes: number;
  additionalVotes: number;
  newTotalVotes: number;
  tokenCost: number;
  tokensRemaining: number;
  canAfford: boolean;
  tokensAfterVote: number;
  votingPower: number;
}

export interface CostPreviewResponse {
  success: boolean;
  data: CostPreview;
}

export interface QuadraticVoteRequest {
  proposalId: number;
  voteChoice: boolean;
  voteCount: number;
}

export interface QuadraticVoteResponse {
  success: boolean;
  data: {
    vote: {
      id: number;
      proposalId: number;
      shareholderId: number;
      voteChoice: boolean;
      voteWeight: number;
      tokensSpent: number;
      txHash: string;
    };
    tokenBalance: TokenBalance;
    blockchainTx: string;
  };
  message: string;
}

export interface QuadraticResults {
  proposalId: number;
  proposalTitle: string;
  votingType: 'quadratic';
  // Results are at the top level, not nested
  yesVotingPower: number;
  noVotingPower: number;
  totalVotingPower: number;
  yesPercentage: number;
  noPercentage: number;
  yesTokensSpent: number;
  noTokensSpent: number;
  totalTokensSpent: number;
  voterCount: number;
}

export interface QuadraticResultsResponse {
  success: boolean;
  data: QuadraticResults;
}

// Get token balance for quadratic voting
export const getTokenBalance = async (proposalId: number): Promise<TokenBalanceResponse> => {
  const response = await api.get(`/vote/quadratic/token-balance/${proposalId}`);
  return response.data;
};

// Preview vote cost before casting
export const previewVoteCost = async (proposalId: number, voteCount: number): Promise<CostPreviewResponse> => {
  const response = await api.get(`/vote/quadratic/cost-preview/${proposalId}?voteCount=${voteCount}`);
  return response.data;
};

// Get quadratic voting results
export const getQuadraticResults = async (proposalId: number): Promise<QuadraticResultsResponse> => {
  const response = await api.get(`/vote/quadratic/results/${proposalId}`);
  return response.data;
};

// Cast quadratic vote
export const castQuadraticVote = async (
  proposalId: number, 
  voteChoice: boolean, 
  voteCount: number
): Promise<QuadraticVoteResponse> => {
  const response = await api.post('/vote/quadratic', { proposalId, voteChoice, voteCount });
  return response.data;
};

export default {
  castVote,
  checkVoteStatus,
  getMyVotes,
  getVotesForProposal,
  // Quadratic voting
  getTokenBalance,
  previewVoteCost,
  getQuadraticResults,
  castQuadraticVote,
};
