import { ethers } from 'ethers';
import { prisma } from './database.service';
import { blockchainService } from './blockchain.service';
import { Shareholder, Share } from '@prisma/client';

/**
 * Shareholder with shares included
 */
export interface ShareholderWithShares extends Shareholder {
  shares: Share | null;
}

/**
 * Shareholder Service
 * Handles shareholder registration and management
 */
class ShareholderService {
  /**
   * Register a new shareholder
   * @param walletAddress - Ethereum wallet address
   * @param name - Shareholder's name
   * @param email - Shareholder's email
   * @param shares - Number of shares
   * @param isAdmin - Whether the shareholder is an admin
   * @returns The created shareholder record
   */
  async registerShareholder(
    walletAddress: string,
    name: string,
    email: string,
    shares: number,
    isAdmin: boolean = false
  ): Promise<{
    shareholder: ShareholderWithShares | null;
    blockchainTx?: string;
  }> {
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    // Normalize address to checksum format
    const normalizedAddress = ethers.getAddress(walletAddress);

    // Check if shareholder already exists
    const existing = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (existing) {
      throw new Error('Shareholder with this wallet address already exists');
    }

    // Check if email already exists
    const existingEmail = await prisma.shareholder.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new Error('Shareholder with this email already exists');
    }

    // Validate shares
    if (shares < 0) {
      throw new Error('Shares cannot be negative');
    }

    // Create shareholder in database with shares in a transaction
    const shareholder = await prisma.$transaction(async (tx) => {
      // Create shareholder record
      const newShareholder = await tx.shareholder.create({
        data: {
          walletAddress: normalizedAddress,
          name,
          email,
          isAdmin,
          isActive: true,
        },
      });

      // Create shares record
      await tx.share.create({
        data: {
          shareholderId: newShareholder.id,
          shares,
        },
      });

      return newShareholder;
    });

    // Add shareholder to blockchain
    let blockchainTx: string | undefined;
    try {
      const result = await blockchainService.addShareholder(normalizedAddress, shares);
      if (result.success) {
        blockchainTx = result.txHash;
        console.log(`✅ Shareholder added to blockchain: ${normalizedAddress}, TX: ${result.txHash}`);
      } else {
        console.error(`⚠️ Failed to add shareholder to blockchain: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`⚠️ Failed to add shareholder to blockchain: ${error.message}`);
      // Note: We don't rollback the database transaction here
      // The admin can retry the blockchain transaction later
    }

    // Fetch shareholder with shares
    const shareholderWithShares = await prisma.shareholder.findUnique({
      where: { id: shareholder.id },
      include: { shares: true },
    });

    return {
      shareholder: shareholderWithShares,
      blockchainTx,
    };
  }

  /**
   * Get all shareholders
   * @param includeInactive - Whether to include inactive shareholders
   * @returns List of all shareholders with their shares
   */
  async getAllShareholders(includeInactive: boolean = false): Promise<ShareholderWithShares[]> {
    const shareholders = await prisma.shareholder.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        shares: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return shareholders;
  }

  /**
   * Get a shareholder by wallet address
   * @param walletAddress - The wallet address to look up
   * @returns Shareholder record or null
   */
  async getShareholderByWallet(walletAddress: string): Promise<ShareholderWithShares | null> {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);

    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { shares: true },
    });

    return shareholder;
  }

  /**
   * Get a shareholder by ID
   * @param id - Shareholder ID
   * @returns Shareholder record or null
   */
  async getShareholderById(id: number): Promise<ShareholderWithShares | null> {
    const shareholder = await prisma.shareholder.findUnique({
      where: { id },
      include: { shares: true },
    });

    return shareholder;
  }

  /**
   * Update shareholder shares
   * @param walletAddress - The wallet address
   * @param newShares - New number of shares
   * @returns Updated shareholder
   */
  async updateShares(walletAddress: string, newShares: number): Promise<ShareholderWithShares | null> {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    if (newShares < 0) {
      throw new Error('Shares cannot be negative');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);

    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { shares: true },
    });

    if (!shareholder) {
      throw new Error('Shareholder not found');
    }

    // Update shares in database
    await prisma.share.update({
      where: { shareholderId: shareholder.id },
      data: { shares: newShares },
    });

    // Update shares on blockchain
    try {
      const result = await blockchainService.addShareholder(normalizedAddress, newShares);
      if (result.success) {
        console.log(`✅ Shareholder shares updated on blockchain: ${normalizedAddress}, TX: ${result.txHash}`);
      }
    } catch (error: any) {
      console.error(`⚠️ Failed to update shares on blockchain: ${error.message}`);
    }

    return this.getShareholderByWallet(normalizedAddress);
  }

  /**
   * Deactivate a shareholder
   * @param walletAddress - The wallet address
   * @returns Updated shareholder
   */
  async deactivateShareholder(walletAddress: string): Promise<ShareholderWithShares> {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const normalizedAddress = ethers.getAddress(walletAddress);

    const shareholder = await prisma.shareholder.update({
      where: { walletAddress: normalizedAddress },
      data: { isActive: false },
      include: { shares: true },
    });

    console.log(`🚫 Shareholder deactivated: ${normalizedAddress}`);

    return shareholder;
  }

  /**
   * Get total shares count
   * @returns Total number of shares across all active shareholders
   */
  async getTotalShares(): Promise<number> {
    const result = await prisma.share.aggregate({
      _sum: {
        shares: true,
      },
      where: {
        shareholder: {
          isActive: true,
        },
      },
    });

    return result._sum?.shares || 0;
  }
}

export const shareholderService = new ShareholderService();
