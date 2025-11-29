import { ethers, Contract, JsonRpcProvider, Wallet, ContractTransactionResponse } from 'ethers';
import { config } from '../config';
import { VotingContractABI } from '../contracts/VotingABI';

/**
 * Proposal data structure from smart contract
 */
export interface ProposalData {
  id: bigint;
  title: string;
  startTime: bigint;
  endTime: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  exists: boolean;
}

/**
 * Proposal result data structure
 */
export interface ProposalResult {
  title: string;
  yesVotes: bigint;
  noVotes: bigint;
  votingOpen: boolean;
}

/**
 * Transaction result with hash and status
 */
export interface TransactionResult {
  success: boolean;
  txHash: string;
  error?: string;
}

/**
 * Blockchain Service
 * Handles all interactions with the Voting smart contract on Ethereum blockchain
 */
class BlockchainService {
  private provider: JsonRpcProvider | null = null;
  private signer: Wallet | null = null;
  private contract: Contract | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the blockchain connection
   * Connects to the Hardhat local network and sets up the contract
   */
  async initialize(): Promise<void> {
    try {
      // Create provider connection to Hardhat network
      this.provider = new JsonRpcProvider(config.blockchain.rpcUrl);
      
      // Verify connection
      const network = await this.provider.getNetwork();
      console.log(`✅ Connected to blockchain network: ${network.name} (chainId: ${network.chainId})`);

      // Set up signer if private key is provided
      if (config.blockchain.privateKey) {
        this.signer = new Wallet(config.blockchain.privateKey, this.provider);
        console.log(`✅ Admin wallet loaded: ${this.signer.address}`);
      } else {
        // For local development, use the first account from Hardhat
        console.log('⚠️  No private key provided, using default Hardhat account');
        // Hardhat's first account private key
        const defaultPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        this.signer = new Wallet(defaultPrivateKey, this.provider);
        console.log(`✅ Using default Hardhat account: ${this.signer.address}`);
      }

      // Initialize contract if address is provided
      if (config.blockchain.contractAddress) {
        this.contract = new Contract(
          config.blockchain.contractAddress,
          VotingContractABI,
          this.signer
        );
        console.log(`✅ Contract loaded at: ${config.blockchain.contractAddress}`);
      } else {
        console.log('⚠️  No contract address provided. Set CONTRACT_ADDRESS in .env');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to connect to blockchain:', error);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.contract) {
      throw new Error('Blockchain service not initialized or contract not loaded');
    }
  }

  /**
   * Get the provider instance
   */
  getProvider(): JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get the signer instance
   */
  getSigner(): Wallet | null {
    return this.signer;
  }

  /**
   * Get the contract instance
   */
  getContract(): Contract | null {
    return this.contract;
  }

  /**
   * Check if blockchain is connected
   */
  async isConnected(): Promise<boolean> {
    if (!this.provider) return false;
    try {
      await this.provider.getNetwork();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get admin address from contract
   */
  async getAdmin(): Promise<string> {
    this.ensureInitialized();
    return await this.contract!.getAdmin();
  }

  // ============ Shareholder Functions ============

  /**
   * Add a shareholder to the smart contract
   * @param shareholderAddress - Wallet address of the shareholder
   * @param shares - Number of shares to assign
   */
  async addShareholder(shareholderAddress: string, shares: number): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      console.log(`📝 Adding shareholder: ${shareholderAddress} with ${shares} shares`);
      
      const tx: ContractTransactionResponse = await this.contract!.addShareholder(
        shareholderAddress,
        shares
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log(`✅ Shareholder added. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('❌ Failed to add shareholder:', error.message);
      return {
        success: false,
        txHash: '',
        error: error.message || 'Failed to add shareholder',
      };
    }
  }

  /**
   * Get shares for a shareholder
   * @param shareholderAddress - Wallet address of the shareholder
   */
  async getShares(shareholderAddress: string): Promise<bigint> {
    this.ensureInitialized();
    return await this.contract!.getShares(shareholderAddress);
  }

  /**
   * Check if an address is a registered shareholder
   * @param address - Wallet address to check
   */
  async isShareholder(address: string): Promise<boolean> {
    this.ensureInitialized();
    return await this.contract!.isShareholder(address);
  }

  // ============ Proposal Functions ============

  /**
   * Create a new proposal on the blockchain
   * @param title - Title of the proposal
   * @param startTime - Unix timestamp for voting start
   * @param endTime - Unix timestamp for voting end
   */
  async createProposal(
    title: string,
    startTime: number,
    endTime: number
  ): Promise<TransactionResult & { proposalId?: number }> {
    this.ensureInitialized();
    
    try {
      console.log(`📝 Creating proposal: "${title}"`);
      console.log(`   Start: ${new Date(startTime * 1000).toISOString()}`);
      console.log(`   End: ${new Date(endTime * 1000).toISOString()}`);
      
      const tx: ContractTransactionResponse = await this.contract!.createProposal(
        title,
        startTime,
        endTime
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Get the new proposal count (which is the new proposal ID)
      const proposalCount = await this.contract!.proposalCount();
      
      console.log(`✅ Proposal created with ID: ${proposalCount}. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
        proposalId: Number(proposalCount),
      };
    } catch (error: any) {
      console.error('❌ Failed to create proposal:', error.message);
      return {
        success: false,
        txHash: '',
        error: error.message || 'Failed to create proposal',
      };
    }
  }

  /**
   * Get proposal details by ID
   * @param proposalId - ID of the proposal
   */
  async getProposal(proposalId: number): Promise<ProposalData> {
    this.ensureInitialized();
    const proposal = await this.contract!.getProposal(proposalId);
    return {
      id: proposal.id,
      title: proposal.title,
      startTime: proposal.startTime,
      endTime: proposal.endTime,
      yesVotes: proposal.yesVotes,
      noVotes: proposal.noVotes,
      exists: proposal.exists,
    };
  }

  /**
   * Get total proposal count
   */
  async getProposalCount(): Promise<number> {
    this.ensureInitialized();
    const count = await this.contract!.proposalCount();
    return Number(count);
  }

  /**
   * Check if voting is open for a proposal
   * @param proposalId - ID of the proposal
   */
  async isVotingOpen(proposalId: number): Promise<boolean> {
    this.ensureInitialized();
    return await this.contract!.isVotingOpen(proposalId);
  }

  // ============ Voting Functions ============

  /**
   * Cast a vote on a proposal
   * Note: This function should typically be called by the user's wallet
   * In a real application, this would be triggered from the frontend
   * @param proposalId - ID of the proposal to vote on
   * @param support - true for yes, false for no
   */
  async vote(proposalId: number, support: boolean): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      console.log(`📝 Casting vote on proposal ${proposalId}: ${support ? 'YES' : 'NO'}`);
      
      const tx: ContractTransactionResponse = await this.contract!.vote(proposalId, support);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log(`✅ Vote cast successfully. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('❌ Failed to cast vote:', error.message);
      return {
        success: false,
        txHash: '',
        error: error.message || 'Failed to cast vote',
      };
    }
  }

  /**
   * Check if an address has voted on a proposal
   * @param proposalId - ID of the proposal
   * @param voterAddress - Address of the voter
   */
  async hasVotedOnProposal(proposalId: number, voterAddress: string): Promise<boolean> {
    this.ensureInitialized();
    return await this.contract!.hasVotedOnProposal(proposalId, voterAddress);
  }

  // ============ Result Functions ============

  /**
   * Get the result of a proposal
   * @param proposalId - ID of the proposal
   */
  async getProposalResult(proposalId: number): Promise<ProposalResult> {
    this.ensureInitialized();
    
    const result = await this.contract!.getProposalResult(proposalId);
    
    return {
      title: result[0],
      yesVotes: result[1],
      noVotes: result[2],
      votingOpen: result[3],
    };
  }

  // ============ Utility Functions ============

  /**
   * Verify a signed message and recover the signer address
   * Used for wallet authentication
   * @param message - The original message
   * @param signature - The signature
   */
  verifyMessage(message: string, signature: string): string {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Validate an Ethereum address
   * @param address - Address to validate
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get current block timestamp
   */
  async getCurrentBlockTimestamp(): Promise<number> {
    if (!this.provider) throw new Error('Provider not initialized');
    const block = await this.provider.getBlock('latest');
    return block?.timestamp || Math.floor(Date.now() / 1000);
  }
}

export const blockchainService = new BlockchainService();
