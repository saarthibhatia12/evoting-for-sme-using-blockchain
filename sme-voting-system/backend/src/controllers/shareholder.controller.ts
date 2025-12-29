import { Response } from 'express';
import { shareholderService } from '../services/shareholder.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Shareholder Controller
 * Handles shareholder registration and management endpoints
 */

/**
 * POST /shareholders/register
 * Register a new shareholder (Admin only)
 * Body: { walletAddress: string, name: string, email: string, shares: number, isAdmin?: boolean }
 */
export const registerShareholder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { walletAddress, name, email, shares, isAdmin } = req.body;

    // Validate required fields
    if (!walletAddress || !name || !email || shares === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, name, email, shares',
      });
      return;
    }

    // Validate shares is a number
    if (typeof shares !== 'number' || shares < 0) {
      res.status(400).json({
        success: false,
        error: 'Shares must be a non-negative number',
      });
      return;
    }

    const result = await shareholderService.registerShareholder(
      walletAddress,
      name,
      email,
      shares,
      isAdmin || false
    );

    res.status(201).json({
      success: true,
      data: {
        shareholder: result.shareholder,
        blockchainTx: result.blockchainTx,
      },
      message: 'Shareholder registered successfully',
    });
  } catch (error: any) {
    console.error('❌ Error registering shareholder:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to register shareholder',
    });
  }
};

/**
 * GET /shareholders
 * Get all shareholders
 * Query: { includeInactive?: boolean }
 */
export const getAllShareholders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    const shareholders = await shareholderService.getAllShareholders(includeInactive);

    res.json({
      success: true,
      data: {
        shareholders,
        count: shareholders.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching shareholders:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch shareholders',
    });
  }
};

/**
 * GET /shareholders/:walletAddress
 * Get a shareholder by wallet address
 */
export const getShareholderByWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    const shareholder = await shareholderService.getShareholderByWallet(walletAddress);

    if (!shareholder) {
      res.status(404).json({
        success: false,
        error: 'Shareholder not found',
      });
      return;
    }

    res.json({
      success: true,
      data: shareholder,
    });
  } catch (error: any) {
    console.error('❌ Error fetching shareholder:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch shareholder',
    });
  }
};

/**
 * PUT /shareholders/:walletAddress/shares
 * Update shareholder shares (Admin only)
 * Body: { shares: number }
 */
export const updateShares = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const { shares } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    if (shares === undefined || typeof shares !== 'number' || shares < 0) {
      res.status(400).json({
        success: false,
        error: 'Shares must be a non-negative number',
      });
      return;
    }

    const shareholder = await shareholderService.updateShares(walletAddress, shares);

    res.json({
      success: true,
      data: shareholder,
      message: 'Shares updated successfully',
    });
  } catch (error: any) {
    console.error('❌ Error updating shares:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update shares',
    });
  }
};

/**
 * DELETE /shareholders/:walletAddress
 * Deactivate a shareholder (Admin only)
 */
export const deactivateShareholder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    const shareholder = await shareholderService.deactivateShareholder(walletAddress);

    res.json({
      success: true,
      data: shareholder,
      message: 'Shareholder deactivated successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deactivating shareholder:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to deactivate shareholder',
    });
  }
};

/**
 * GET /shareholders/stats/total-shares
 * Get total shares count
 */
export const getTotalShares = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalShares = await shareholderService.getTotalShares();

    res.json({
      success: true,
      data: {
        totalShares,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching total shares:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch total shares',
    });
  }
};

/**
 * POST /shareholders/fund/:walletAddress
 * Fund a shareholder wallet with ETH for gas fees (Admin only, for testing)
 */
export const fundShareholderWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const { amount } = req.body;

    if (!walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
      return;
    }

    const ethAmount = amount || '10.0'; // Default 10 ETH

    const result = await shareholderService.fundShareholderWallet(walletAddress, ethAmount);

    res.json({
      success: true,
      data: {
        walletAddress,
        amount: ethAmount,
        txHash: result.txHash,
      },
      message: `Wallet funded with ${ethAmount} ETH for gas fees`,
    });
  } catch (error: any) {
    console.error('❌ Error funding wallet:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fund wallet',
    });
  }
};
