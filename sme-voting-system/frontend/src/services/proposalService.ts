// =============================================================================
// PROPOSAL SERVICE - Task 4.6
// Handles proposal CRUD operations and results fetching
// =============================================================================

import api from './api';

export interface Proposal {
  id: number;
  proposalId: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
  status: 'upcoming' | 'active' | 'ended';
  votingOpen: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Quadratic voting support
  votingType?: 'simple' | 'quadratic';
  baseTokens?: number;
}

export interface ProposalWithBlockchain extends Proposal {
  blockchainData?: {
    yesVotes: string;
    noVotes: string;
    totalVotes: string;
    startTime: number;
    endTime: number;
    exists: boolean;
  };
}

export interface ProposalResult {
  proposalId: number;
  title: string;
  description: string | null;
  yesVotes: string;
  noVotes: string;
  totalVotes: string;
  yesPercentage: number;
  noPercentage: number;
  votingOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface CreateProposalRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  // Quadratic voting support (optional - defaults to simple)
  votingType?: 'simple' | 'quadratic';
  baseTokens?: number;
}

export interface ProposalsResponse {
  success: boolean;
  data: {
    proposals: Proposal[];
    count: number;
  };
}

export interface ProposalResponse {
  success: boolean;
  data: ProposalWithBlockchain;
}

export interface ProposalResultResponse {
  success: boolean;
  data: ProposalResult;
}

export interface CreateProposalResponse {
  success: boolean;
  data: {
    proposal: Proposal;
    blockchainTx: string;
  };
  message: string;
}

// =============================================================================
// TIE RESOLUTION TYPES
// =============================================================================

export type TieResolutionType = 'STATUS_QUO_REJECT' | 'CHAIRPERSON_YES' | 'CHAIRPERSON_NO';
export type FinalResultStatus = 'APPROVED' | 'REJECTED' | 'TIE_PENDING' | 'VOTING_ACTIVE' | 'NOT_STARTED';

export interface TieStatusResponse {
  success: boolean;
  data: {
    proposalId: number;
    isTied: boolean;
    isResolved: boolean;
    tieResolutionType: TieResolutionType | null;
    votingEnded: boolean;
    yesVotes: number;
    noVotes: number;
  };
}

export interface FinalResultResponse {
  success: boolean;
  data: {
    proposalId: number;
    title: string;
    status: FinalResultStatus;
    yesVotes: number;
    noVotes: number;
    isTied: boolean;
    tieResolutionType: TieResolutionType | null;
    tieResolvedAt: string | null;
    tieResolvedByAdminId: number | null;
    votingType: string;
  };
}

export interface TieResolutionResponse {
  success: boolean;
  data: {
    proposalId: number;
    title: string;
    tieResolutionType: TieResolutionType;
    tieResolvedAt: string;
    tieResolvedByAdminId: number;
  };
  message: string;
}

// Get all proposals
export const getAllProposals = async (): Promise<ProposalsResponse> => {
  const response = await api.get('/proposals');
  return response.data;
};

// Get proposals by status
export const getProposalsByStatus = async (status: 'upcoming' | 'active' | 'ended'): Promise<ProposalsResponse> => {
  const response = await api.get(`/proposals?status=${status}`);
  return response.data;
};

// Get active proposals only
export const getActiveProposals = async (): Promise<ProposalsResponse> => {
  const response = await api.get('/proposals?status=active');
  return response.data;
};

// Get a single proposal by ID
export const getProposalById = async (proposalId: number): Promise<ProposalResponse> => {
  const response = await api.get(`/proposals/${proposalId}`);
  return response.data;
};

// Get proposal results
export const getProposalResults = async (proposalId: number): Promise<ProposalResultResponse> => {
  const response = await api.get(`/results/${proposalId}`);
  return response.data;
};

// Create a new proposal (Admin only)
export const createProposal = async (proposal: CreateProposalRequest): Promise<CreateProposalResponse> => {
  const response = await api.post('/proposals/create', proposal);
  return response.data;
};

// Deactivate a proposal (Admin only)
export const deactivateProposal = async (proposalId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/proposals/${proposalId}`);
  return response.data;
};

// =============================================================================
// TIE RESOLUTION API METHODS
// =============================================================================

// Get tie status for a proposal
export const getTieStatus = async (proposalId: number): Promise<TieStatusResponse> => {
  const response = await api.get(`/proposals/${proposalId}/tie-status`);
  return response.data;
};

// Get the final result of a proposal (including tie resolution if applicable)
export const getFinalResult = async (proposalId: number): Promise<FinalResultResponse> => {
  const response = await api.get(`/proposals/${proposalId}/final-result`);
  return response.data;
};

// Resolve a tied proposal with Status Quo (reject) - Admin only
export const resolveTieStatusQuo = async (proposalId: number): Promise<TieResolutionResponse> => {
  const response = await api.post(`/proposals/${proposalId}/resolve-tie/status-quo`);
  return response.data;
};

// Resolve a tied proposal with Chairperson's vote - Admin only
export const resolveTieChairpersonVote = async (
  proposalId: number, 
  voteChoice: boolean
): Promise<TieResolutionResponse> => {
  const response = await api.post(`/proposals/${proposalId}/resolve-tie/chairperson-vote`, { voteChoice });
  return response.data;
};

export default {
  getAllProposals,
  getProposalsByStatus,
  getActiveProposals,
  getProposalById,
  getProposalResults,
  createProposal,
  deactivateProposal,
  // Tie resolution methods
  getTieStatus,
  getFinalResult,
  resolveTieStatusQuo,
  resolveTieChairpersonVote,
};
