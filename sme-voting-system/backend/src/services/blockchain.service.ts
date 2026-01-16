import { ethers, Contract, JsonRpcProvider, Wallet, ContractTransactionResponse } from 'ethers';
import { config } from '../config';
import { VotingContractABI } from '../contracts/VotingABI';
import { QuadraticVotingABI } from '../contracts/QuadraticVotingABI';

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
  private quadraticContract: Contract | null = null;  // NEW: QuadraticVoting contract
  private isInitialized: boolean = false;
  
  // Transaction queue to prevent nonce conflicts
  private pendingNonce: number | null = null;
  private txLock: Promise<void> = Promise.resolve();

  /**
   * Initialize the blockchain connection
   * Connects to the Hardhat local network and sets up the contracts
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

      // Initialize Voting contract if address is provided
      if (config.blockchain.contractAddress) {
        this.contract = new Contract(
          config.blockchain.contractAddress,
          VotingContractABI,
          this.signer
        );
        console.log(`✅ Voting contract loaded at: ${config.blockchain.contractAddress}`);
      } else {
        console.log('⚠️  No contract address provided. Set CONTRACT_ADDRESS in .env');
      }

      // Initialize QuadraticVoting contract if address is provided
      if (config.blockchain.quadraticContractAddress) {
        this.quadraticContract = new Contract(
          config.blockchain.quadraticContractAddress,
          QuadraticVotingABI,
          this.signer
        );
        console.log(`✅ QuadraticVoting contract loaded at: ${config.blockchain.quadraticContractAddress}`);
      } else {
        console.log('⚠️  No quadratic contract address provided. Set QUADRATIC_CONTRACT_ADDRESS in .env');
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
   * Check if the quadratic contract is initialized
   */
  private ensureQuadraticInitialized(): void {
    if (!this.isInitialized || !this.quadraticContract) {
      throw new Error('Blockchain service not initialized or QuadraticVoting contract not loaded. Set QUADRATIC_CONTRACT_ADDRESS in .env');
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
   * Get the quadratic contract instance
   */
  getQuadraticContract(): Contract | null {
    return this.quadraticContract;
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

  /**
   * Wait for a short delay to allow nonce to update
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a transaction with queue to prevent nonce conflicts
   * Ensures transactions are serialized to prevent nonce collisions
   */
  private async queueTransaction<T>(fn: () => Promise<T>): Promise<T> {
    // Chain this transaction onto the queue
    const previousLock = this.txLock;
    let releaseLock: () => void;
    
    // Create new lock for this transaction
    this.txLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    
    try {
      // Wait for previous transaction to complete
      await previousLock;
      
      // Execute the transaction
      const result = await fn();
      
      // Small delay to ensure nonce is updated on the node
      await this.delay(50);
      
      return result;
    } finally {
      // Release the lock
      releaseLock!();
    }
  }

  // ============ Shareholder Functions ============

  /**
   * Add a shareholder to the smart contract
   * @param shareholderAddress - Wallet address of the shareholder
   * @param shares - Number of shares to assign
   * @param options - Optional settings (skipFunding: skip auto-funding)
   */
  async addShareholder(
    shareholderAddress: string, 
    shares: number,
    options: { skipFunding?: boolean } = {}
  ): Promise<TransactionResult> {
    this.ensureInitialized();
    
    return this.queueTransaction(async () => {
      try {
        console.log(`📝 Adding shareholder: ${shareholderAddress} with ${shares} shares`);
        
        const tx: ContractTransactionResponse = await this.contract!.addShareholder(
          shareholderAddress,
          shares
        );
        
        // Wait for transaction confirmation
        await tx.wait();
        
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
    });
  }

  /**
   * Fund a wallet with ETH (for local development/testing)
   * @param address - The wallet address to fund
   * @param amount - Amount of ETH to send (as string, e.g., "1.0")
   */
  async fundWallet(address: string, amount: string): Promise<TransactionResult> {
    this.ensureInitialized();
    
    return this.queueTransaction(async () => {
      try {
        console.log(`💰 Funding wallet ${address} with ${amount} ETH...`);
        
        const tx = await this.signer!.sendTransaction({
          to: address,
          value: ethers.parseEther(amount)
        });
        
        await tx.wait();
        
        console.log(`✅ Wallet funded. TX: ${tx.hash}`);
        
        return {
          success: true,
          txHash: tx.hash,
        };
      } catch (error: any) {
        console.error('❌ Failed to fund wallet:', error.message);
        return {
          success: false,
          txHash: '',
          error: error.message || 'Failed to fund wallet',
        };
      }
    });
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
   * Create a new quadratic voting proposal on the blockchain
   * @param title - Title of the proposal
   * @param startTime - Unix timestamp for voting start
   * @param endTime - Unix timestamp for voting end
   * @param baseTokens - Base token pool for distribution (default: 100)
   */
  async createQuadraticProposal(
    title: string,
    startTime: number,
    endTime: number,
    baseTokens: number = 100
  ): Promise<TransactionResult & { proposalId?: number }> {
    this.ensureQuadraticInitialized();
    
    try {
      console.log(`📝 Creating quadratic proposal: "${title}"`);
      console.log(`   Start: ${new Date(startTime * 1000).toISOString()}`);
      console.log(`   End: ${new Date(endTime * 1000).toISOString()}`);
      console.log(`   Base Tokens: ${baseTokens}`);
      
      const tx: ContractTransactionResponse = await this.quadraticContract!.createQuadraticProposal(
        title,
        startTime,
        endTime,
        baseTokens
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Get the new proposal count (which is the new proposal ID)
      const proposalCount = await this.quadraticContract!.proposalCount();
      
      console.log(`✅ Quadratic proposal created with ID: ${proposalCount}. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
        proposalId: Number(proposalCount),
      };
    } catch (error: any) {
      console.error('❌ Failed to create quadratic proposal:', error.message);
      return {
        success: false,
        txHash: '',
        error: error.message || 'Failed to create quadratic proposal',
      };
    }
  }

  /**
   * Initialize voter tokens for a quadratic voting proposal
   * @param proposalId - ID of the proposal
   * @param voterAddress - Address of the voter
   * @param tokens - Number of tokens to allocate
   */
  async initializeVoterTokens(
    proposalId: number,
    voterAddress: string,
    tokens: number
  ): Promise<TransactionResult> {
    this.ensureQuadraticInitialized();
    
    try {
      console.log(`🎟️ Initializing tokens: Proposal=${proposalId}, Voter=${voterAddress}, Tokens=${tokens}`);
      
      const tx: ContractTransactionResponse = await this.quadraticContract!.initializeVoterTokens(
        proposalId,
        voterAddress,
        tokens
      );
      
      await tx.wait();
      
      console.log(`✅ Tokens initialized. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('❌ Failed to initialize voter tokens:', error.message);
      return {
        success: false,
        txHash: '',
        error: error.message || 'Failed to initialize voter tokens',
      };
    }
  }

  /**
   * Add shareholder to QuadraticVoting contract
   * @param address - Shareholder address
   * @param shares - Number of shares
   */
  async addShareholderToQuadratic(address: string, shares: number): Promise<TransactionResult> {
    this.ensureQuadraticInitialized();
    
    try {
      console.log(`👤 Adding shareholder to QuadraticVoting: ${address} with ${shares} shares`);
      
      const tx: ContractTransactionResponse = await this.quadraticContract!.addShareholder(
        address,
        shares
      );
      
      await tx.wait();
      
      console.log(`✅ Shareholder added to QuadraticVoting. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('❌ Failed to add shareholder to QuadraticVoting:', error.message);
      return {
        success: false,
        txHash: '',
        error: error.message || 'Failed to add shareholder to QuadraticVoting',
      };
    }
  }

  /**
   * Get proposal details by ID
   * @param proposalId - ID of the proposal
   */
  async getProposal(proposalId: number): Promise<ProposalData | null> {
    this.ensureInitialized();
    try {
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
    } catch (error: any) {
      // Proposal doesn't exist on blockchain
      console.log(`ℹ️ Proposal ${proposalId} not found on blockchain`);
      return null;
    }
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
    try {
      return await this.contract!.isVotingOpen(proposalId);
    } catch (error: any) {
      // Proposal may not exist on blockchain
      console.log(`ℹ️ Could not check voting status for proposal ${proposalId}`);
      return false;
    }
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
   * Cast a vote on behalf of a shareholder (for testing/development)
   * Uses account impersonation on Hardhat network
   * @param shareholderAddress - Address of the shareholder voting
   * @param proposalId - ID of the proposal to vote on
   * @param support - true for yes, false for no
   */
  async voteAsShareHolder(
    shareholderAddress: string,
    proposalId: number,
    support: boolean
  ): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      console.log(`📝 Casting vote as ${shareholderAddress} on proposal ${proposalId}: ${support ? 'YES' : 'NO'}`);
      
      // For Hardhat local network, we can impersonate accounts
      // Send some ETH to the shareholder account for gas
      await this.provider!.send('hardhat_impersonateAccount', [shareholderAddress]);
      
      // Fund the account with ETH for gas
      const fundTx = await this.signer!.sendTransaction({
        to: shareholderAddress,
        value: ethers.parseEther('1.0')
      });
      await fundTx.wait();
      
      // Create a signer for the shareholder
      const shareholderSigner = await this.provider!.getSigner(shareholderAddress);
      
      // Connect contract with shareholder signer
      const contractAsShareHolder = this.contract!.connect(shareholderSigner) as Contract;
      
      // Cast the vote
      const tx: ContractTransactionResponse = await contractAsShareHolder.vote(proposalId, support);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Stop impersonating
      await this.provider!.send('hardhat_stopImpersonatingAccount', [shareholderAddress]);
      
      console.log(`✅ Vote cast successfully as ${shareholderAddress}. TX: ${tx.hash}`);
      
      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error('❌ Failed to cast vote as shareholder:', error.message);
      
      // Try to stop impersonating in case of error
      try {
        await this.provider!.send('hardhat_stopImpersonatingAccount', [shareholderAddress]);
      } catch {}
      
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
    try {
      return await this.contract!.hasVotedOnProposal(proposalId, voterAddress);
    } catch (error: any) {
      // Proposal may not exist on blockchain
      console.log(`ℹ️ Could not check vote status for proposal ${proposalId}`);
      return false;
    }
  }

  // ============ Result Functions ============

  /**
   * Get the result of a proposal
   * @param proposalId - ID of the proposal
   */
  async getProposalResult(proposalId: number): Promise<ProposalResult | null> {
    this.ensureInitialized();
    
    try {
      const result = await this.contract!.getProposalResult(proposalId);
      
      return {
        title: result[0],
        yesVotes: result[1],
        noVotes: result[2],
        votingOpen: result[3],
      };
    } catch (error: any) {
      // Proposal doesn't exist on blockchain - this is normal after fresh-start
      console.log(`ℹ️ Proposal ${proposalId} not found on blockchain (may need re-sync)`);
      return null;
    }
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
