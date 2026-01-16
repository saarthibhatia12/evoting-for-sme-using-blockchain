// =============================================================================
// BLOCKCHAIN SERVICE - Direct Smart Contract Interaction
// Handles direct communication with the Voting smart contract via MetaMask
// =============================================================================

import { BrowserProvider, Contract } from 'ethers';
import { VotingContractABI } from '../contracts/VotingABI';
import { QuadraticVotingABI } from '../contracts/QuadraticVotingABI';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const QUADRATIC_CONTRACT_ADDRESS = import.meta.env.VITE_QUADRATIC_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

/**
 * Get the simple voting contract instance connected to the user's MetaMask wallet
 */
const getContract = async (): Promise<Contract> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Create provider from MetaMask
  const provider = new BrowserProvider(window.ethereum);
  
  // Get signer (user's wallet)
  const signer = await provider.getSigner();
  
  // Create contract instance
  const contract = new Contract(CONTRACT_ADDRESS, VotingContractABI, signer);
  
  return contract;
};

/**
 * Get the quadratic voting contract instance connected to the user's MetaMask wallet
 */
const getQuadraticContract = async (): Promise<Contract> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Create provider from MetaMask
  const provider = new BrowserProvider(window.ethereum);
  
  // Get signer (user's wallet)
  const signer = await provider.getSigner();
  
  // Create contract instance for QuadraticVoting
  const contract = new Contract(QUADRATIC_CONTRACT_ADDRESS, QuadraticVotingABI, signer);
  
  return contract;
};

/**
 * Cast a vote directly on the blockchain using MetaMask
 * @param proposalId - The proposal ID
 * @param support - true for YES, false for NO
 * @returns Transaction hash
 */
export const castVoteOnChain = async (
  proposalId: number,
  support: boolean
): Promise<string> => {
  try {
    const contract = await getContract();
    
    console.log(`📝 Casting vote on blockchain for proposal ${proposalId}: ${support ? 'YES' : 'NO'}`);
    
    // Call the vote function on the smart contract
    // This will prompt MetaMask to sign the transaction
    const tx = await contract.vote(proposalId, support);
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`✅ Vote recorded on blockchain! Block: ${receipt.blockNumber}`);
    
    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to cast vote on blockchain:', error);
    
    // Handle specific errors
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction was rejected by user');
    } else if (error.message.includes('Already voted')) {
      throw new Error('You have already voted on this proposal');
    } else if (error.message.includes('Only shareholders can vote')) {
      throw new Error('You must be a registered shareholder to vote');
    } else if (error.message.includes('Voting is not open')) {
      throw new Error('Voting period is not currently open for this proposal');
    }
    
    throw new Error(error.message || 'Failed to cast vote on blockchain');
  }
};

/**
 * Check if a user has voted on a proposal
 * @param proposalId - The proposal ID
 * @param voterAddress - The voter's wallet address
 * @returns true if already voted
 */
export const hasVotedOnProposal = async (
  proposalId: number,
  voterAddress: string
): Promise<boolean> => {
  try {
    const contract = await getContract();
    return await contract.hasVotedOnProposal(proposalId, voterAddress);
  } catch (error) {
    console.error('Failed to check vote status:', error);
    return false;
  }
};

/**
 * Get proposal result from blockchain
 * @param proposalId - The proposal ID
 * @returns Proposal result or null if not found
 */
export const getProposalResult = async (proposalId: number): Promise<{
  title: string;
  yesVotes: bigint;
  noVotes: bigint;
  votingOpen: boolean;
} | null> => {
  try {
    const contract = await getContract();
    const result = await contract.getProposalResult(proposalId);
    
    return {
      title: result[0],
      yesVotes: result[1],
      noVotes: result[2],
      votingOpen: result[3],
    };
  } catch (error) {
    // Proposal may not exist on blockchain - this is normal
    console.log(`ℹ️ Proposal ${proposalId} not found on blockchain`);
    return null;
  }
};

/**
 * Get shareholder's shares from blockchain
 * @param shareholderAddress - The shareholder's wallet address
 * @returns Number of shares
 */
export const getShares = async (shareholderAddress: string): Promise<bigint> => {
  try {
    const contract = await getContract();
    return await contract.getShares(shareholderAddress);
  } catch (error) {
    console.error('Failed to get shares:', error);
    return 0n;
  }
};

// =============================================================================
// QUADRATIC VOTING FUNCTIONS
// =============================================================================

/**
 * Cast a quadratic vote directly on the blockchain using MetaMask
 * @param proposalId - The proposal ID
 * @param support - true for YES, false for NO
 * @param voteCount - Number of votes to cast
 * @returns Transaction hash
 */
export const castQuadraticVoteOnChain = async (
  proposalId: number,
  support: boolean,
  voteCount: number
): Promise<string> => {
  try {
    const contract = await getQuadraticContract();
    
    console.log(`📝 Casting quadratic vote on blockchain for proposal ${proposalId}: ${voteCount} votes ${support ? 'YES' : 'NO'}`);
    
    // Call the castQuadraticVote function on the smart contract
    // This will prompt MetaMask to sign the transaction
    const tx = await contract.castQuadraticVote(proposalId, support, voteCount);
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`✅ Quadratic vote recorded on blockchain! Block: ${receipt.blockNumber}`);
    
    return tx.hash;
  } catch (error: any) {
    console.error('❌ Failed to cast quadratic vote on blockchain:', error);
    
    // Handle specific errors
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction was rejected by user');
    } else if (error.message.includes('Cannot change vote direction')) {
      throw new Error('Cannot change vote direction after first vote');
    } else if (error.message.includes('Insufficient tokens')) {
      throw new Error('Insufficient tokens for this many votes');
    } else if (error.message.includes('Voter tokens not initialized')) {
      throw new Error('Your voting tokens have not been initialized for this proposal');
    } else if (error.message.includes('Voting is not open')) {
      throw new Error('Voting period is not currently open for this proposal');
    }
    
    throw new Error(error.message || 'Failed to cast quadratic vote on blockchain');
  }
};

/**
 * Get voter status from quadratic voting contract
 * @param proposalId - The proposal ID
 * @param voterAddress - The voter's wallet address
 * @returns Voter status info
 */
export const getQuadraticVoterStatus = async (
  proposalId: number,
  voterAddress: string
): Promise<{
  totalTokens: bigint;
  tokensRemaining: bigint;
  tokensSpent: bigint;
  votesCast: bigint;
  hasVoted: boolean;
  voteDirection: boolean;
} | null> => {
  try {
    const contract = await getQuadraticContract();
    const result = await contract.getVoterStatus(proposalId, voterAddress);
    
    return {
      totalTokens: result[0],
      tokensRemaining: result[1],
      tokensSpent: result[2],
      votesCast: result[3],
      hasVoted: result[4],
      voteDirection: result[5],
    };
  } catch (error) {
    console.error('Failed to get quadratic voter status:', error);
    return null;
  }
};

export const blockchainService = {
  castVoteOnChain,
  hasVotedOnProposal,
  getProposalResult,
  getShares,
  // Quadratic voting
  castQuadraticVoteOnChain,
  getQuadraticVoterStatus,
};

export default blockchainService;
