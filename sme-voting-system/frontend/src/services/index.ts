// =============================================================================
// API SERVICE LAYER - Task 4.6
// Centralized exports for all API services
// =============================================================================

// Core API handler with interceptors
export { default as api } from './api';
export { 
  getStoredToken, 
  setStoredToken, 
  removeStoredToken, 
  isApiError, 
  getErrorMessage,
  isAuthenticated 
} from './api';
export type { ApiError } from './api';

// Service modules
export { default as authService } from './authService';
export { default as proposalService } from './proposalService';
export { default as votingService } from './votingService';
export { default as shareholderService } from './shareholderService';
export { default as blockchainService } from './blockchainService';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Auth types
export type { 
  NonceResponse, 
  VerifyResponse, 
  MeResponse, 
  User 
} from './authService';

// Proposal types
export type { 
  Proposal, 
  ProposalWithBlockchain, 
  ProposalResult,
  CreateProposalRequest,
  ProposalsResponse,
  ProposalResponse,
  ProposalResultResponse,
  CreateProposalResponse
} from './proposalService';

// Voting types
export type { 
  Vote,
  MyVote,
  VoteRequest, 
  VoteResponse, 
  VoteStatusResponse,
  MyVotesResponse,
  VoteSummary,
  ProposalVotesResponse
} from './votingService';

// Shareholder types
export type { 
  Shareholder, 
  ShareholdersResponse,
  ShareholderResponse,
  RegisterShareholderRequest,
  RegisterShareholderResponse,
  UpdateSharesResponse,
  TotalSharesResponse
} from './shareholderService';
