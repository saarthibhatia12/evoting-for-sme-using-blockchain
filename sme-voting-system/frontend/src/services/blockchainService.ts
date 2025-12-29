// =============================================================================
// BLOCKCHAIN SERVICE - Direct Smart Contract Interaction
// Handles direct communication with the Voting smart contract via MetaMask
// =============================================================================

import { BrowserProvider, Contract } from 'ethers';
import { VotingContractABI } from '../contracts/VotingABI';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/**
 * Get the contract instance connected to the user's MetaMask wallet
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

export const blockchainService = {
  castVoteOnChain,
  hasVotedOnProposal,
  getProposalResult,
  getShares,
};

export default blockchainService;
