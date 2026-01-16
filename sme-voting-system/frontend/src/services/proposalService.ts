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

export default {
  getAllProposals,
  getProposalsByStatus,
  getActiveProposals,
  getProposalById,
  getProposalResults,
  createProposal,
  deactivateProposal,
};
