import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './database.service';
import { config } from '../config';

/**
 * Authentication Service
 * Handles MetaMask-based nonce signature authentication
 */
class AuthService {
  /**
   * Generate a random nonce for wallet authentication
   * @returns A random nonce string
   */
  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create the message to be signed by the wallet
   * @param nonce - The random nonce
   * @returns The formatted message string
   */
  createSignMessage(nonce: string): string {
    return `Welcome to SME Voting System!\n\nPlease sign this message to authenticate.\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  /**
   * Request a nonce for a wallet address
   * Creates or updates the nonce in the database
   * @param walletAddress - The wallet address requesting authentication
   * @returns Object containing nonce and message to sign
   */
  async requestNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    // Normalize address to checksum format
    const normalizedAddress = ethers.getAddress(walletAddress);

    // Generate new nonce
    const nonce = this.generateNonce();

    // Set expiration time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Upsert nonce in database
    await prisma.authNonce.upsert({
      where: { walletAddress: normalizedAddress },
      update: {
        nonce,
        expiresAt,
      },
      create: {
        walletAddress: normalizedAddress,
        nonce,
        expiresAt,
      },
    });

    console.log(`📝 Nonce generated for wallet: ${normalizedAddress}`);

    return {
      nonce,
      message: this.createSignMessage(nonce),
    };
  }

  /**
   * Verify the signature and authenticate the user
   * @param walletAddress - The wallet address claiming to sign
   * @param signature - The signature from MetaMask
   * @returns Object containing authentication result and JWT token
   */
  async verifySignature(
    walletAddress: string,
    signature: string
  ): Promise<{ authenticated: boolean; token?: string; error?: string }> {
    try {
      // Validate wallet address
      if (!ethers.isAddress(walletAddress)) {
        return { authenticated: false, error: 'Invalid wallet address' };
      }

      // Normalize address
      const normalizedAddress = ethers.getAddress(walletAddress);

      // Get nonce from database
      const authNonce = await prisma.authNonce.findUnique({
        where: { walletAddress: normalizedAddress },
      });

      if (!authNonce) {
        return { authenticated: false, error: 'No nonce found. Please request a nonce first.' };
      }

      // Check if nonce has expired
      if (new Date() > authNonce.expiresAt) {
        // Delete expired nonce
        await prisma.authNonce.delete({
          where: { walletAddress: normalizedAddress },
        });
        return { authenticated: false, error: 'Nonce has expired. Please request a new one.' };
      }

      // Recreate the message that was signed
      const message = this.createSignMessage(authNonce.nonce);

      // Recover the signer address from the signature
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(message, signature);
      } catch (error) {
        return { authenticated: false, error: 'Invalid signature format' };
      }

      // Verify the recovered address matches the claimed address
      if (recoveredAddress.toLowerCase() !== normalizedAddress.toLowerCase()) {
        return { authenticated: false, error: 'Signature does not match wallet address' };
      }

      // Authentication successful - delete the used nonce
      await prisma.authNonce.delete({
        where: { walletAddress: normalizedAddress },
      });

      // Generate JWT token
      const token = this.generateToken(normalizedAddress);

      console.log(`✅ Authentication successful for wallet: ${normalizedAddress}`);

      return {
        authenticated: true,
        token,
      };
    } catch (error: any) {
      console.error('❌ Authentication error:', error.message);
      return { authenticated: false, error: error.message || 'Authentication failed' };
    }
  }

  /**
   * Generate a JWT token for the authenticated user
   * @param walletAddress - The authenticated wallet address
   * @returns JWT token string
   */
  generateToken(walletAddress: string): string {
    const payload = {
      walletAddress,
      iat: Math.floor(Date.now() / 1000),
    };

    const options: jwt.SignOptions = {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, config.jwtSecret, options);
  }

  /**
   * Verify a JWT token
   * @param token - The JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): { walletAddress: string; iat: number } | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        walletAddress: string;
        iat: number;
      };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a wallet address is a registered shareholder
   * @param walletAddress - The wallet address to check
   * @returns True if registered shareholder
   */
  async isRegisteredShareholder(walletAddress: string): Promise<boolean> {
    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: ethers.getAddress(walletAddress) },
    });
    return !!shareholder;
  }

  /**
   * Get full shareholder details including shares and status
   * @param walletAddress - The wallet address to lookup
   * @returns Shareholder details or null if not found
   */
  async getShareholderDetails(walletAddress: string): Promise<{
    id: number;
    walletAddress: string;
    name: string;
    email: string;
    isActive: boolean;
    isAdmin: boolean;
    shares: number;
  } | null> {
    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: ethers.getAddress(walletAddress) },
      include: {
        shares: true,
      },
    });

    if (!shareholder) {
      return null;
    }

    return {
      id: shareholder.id,
      walletAddress: shareholder.walletAddress,
      name: shareholder.name,
      email: shareholder.email,
      isActive: shareholder.isActive,
      isAdmin: shareholder.isAdmin,
      shares: shareholder.shares?.shares || 0,
    };
  }
}

export const authService = new AuthService();
