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

export default {
  castVote,
  checkVoteStatus,
  getMyVotes,
  getVotesForProposal,
};
