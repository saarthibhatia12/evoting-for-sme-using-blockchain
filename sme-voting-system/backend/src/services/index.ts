// Services barrel file
// Export all services from this file

export { databaseService, prisma } from './database.service';
export { blockchainService } from './blockchain.service';
export { startupService } from './startup.service';
export { quadraticVotingService } from './quadratic-voting.service';
export { tieResolutionService } from './tie-resolution.service';

// Export tie resolution types for use in controllers
export type { 
  TieResolutionType, 
  FinalResultStatus, 
  FinalResultResponse,
  VoteTally 
} from './tie-resolution.service';
