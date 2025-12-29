import { Router } from 'express';
import {
  registerShareholder,
  getAllShareholders,
  getShareholderByWallet,
  updateShares,
  deactivateShareholder,
  getTotalShares,
  fundShareholderWallet,
} from '../controllers/shareholder.controller';
import {
  authenticate,
  requireShareholder,
  requireAdmin,
} from '../middleware/auth.middleware';
import {
  validateShareholderRegistration,
  validateWalletAddressParam,
  validateSharesUpdate,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * Shareholder Routes
 * All routes require authentication
 */

/**
 * GET /shareholders/stats/total-shares
 * Get total shares count (authenticated users)
 */
router.get('/stats/total-shares', authenticate, getTotalShares);

/**
 * POST /shareholders/register
 * Register a new shareholder (Admin only)
 * Body: { walletAddress: string, name: string, email: string, shares: number, isAdmin?: boolean }
 */
router.post('/register', authenticate, requireShareholder, requireAdmin, validateShareholderRegistration, registerShareholder);

/**
 * GET /shareholders
 * Get all shareholders (authenticated users)
 * Query: { includeInactive?: boolean }
 */
router.get('/', authenticate, getAllShareholders);

/**
 * GET /shareholders/:walletAddress
 * Get a shareholder by wallet address (authenticated users)
 */
router.get('/:walletAddress', authenticate, validateWalletAddressParam, getShareholderByWallet);

/**
 * PUT /shareholders/:walletAddress/shares
 * Update shareholder shares (Admin only)
 * Body: { shares: number }
 */
router.put('/:walletAddress/shares', authenticate, requireShareholder, requireAdmin, validateWalletAddressParam, validateSharesUpdate, updateShares);

/**
 * DELETE /shareholders/:walletAddress
 * Deactivate a shareholder (Admin only)
 */
router.delete('/:walletAddress', authenticate, requireShareholder, requireAdmin, validateWalletAddressParam, deactivateShareholder);

/**
 * POST /shareholders/fund/:walletAddress
 * Fund a shareholder wallet with ETH for gas fees (Admin only, for testing)
 * Body: { amount?: string } (defaults to "10.0" ETH)
 */
router.post('/fund/:walletAddress', authenticate, requireShareholder, requireAdmin, validateWalletAddressParam, fundShareholderWallet);

export default router;
