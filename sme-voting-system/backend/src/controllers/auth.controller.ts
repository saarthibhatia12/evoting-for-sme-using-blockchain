import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

/**
 * Authentication Controller
 * Handles nonce generation and signature verification endpoints
 */

/**
 * POST /auth/nonce
 * Request a nonce for wallet authentication
 * Body: { walletAddress: string }
 */
export const requestNonce = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    const result = await authService.requestNonce(walletAddress);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error requesting nonce:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate nonce',
    });
  }
};

/**
 * POST /auth/verify
 * Verify signature and authenticate user
 * Body: { walletAddress: string, signature: string }
 */
export const verifySignature = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      res.status(400).json({
        success: false,
        error: 'Wallet address and signature are required',
      });
      return;
    }

    const result = await authService.verifySignature(walletAddress, signature);

    if (result.authenticated) {
      res.json({
        success: true,
        data: {
          token: result.token,
          walletAddress,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('❌ Error verifying signature:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify signature',
    });
  }
};

/**
 * GET /auth/me
 * Get current authenticated user information
 * Requires Authorization header with Bearer token
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token is required',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Check if user is a registered shareholder
    const isShareholder = await authService.isRegisteredShareholder(decoded.walletAddress);

    res.json({
      success: true,
      data: {
        walletAddress: decoded.walletAddress,
        isShareholder,
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error getting current user:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user information',
    });
  }
};
