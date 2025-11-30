import { Router } from 'express';
import {
  requestNonce,
  verifySignature,
  getCurrentUser,
} from '../controllers/auth.controller';
import {
  validateNonceRequest,
  validateVerifyRequest,
} from '../middleware/validation.middleware';

const router = Router();

/**
 * Authentication Routes
 * MetaMask-based nonce signature authentication
 */

/**
 * POST /auth/nonce
 * Request a nonce for wallet authentication
 * Body: { walletAddress: string }
 * Response: { success: true, data: { nonce: string, message: string } }
 */
router.post('/nonce', validateNonceRequest, requestNonce);

/**
 * POST /auth/verify
 * Verify signature and get JWT token
 * Body: { walletAddress: string, signature: string }
 * Response: { success: true, data: { token: string, walletAddress: string } }
 */
router.post('/verify', validateVerifyRequest, verifySignature);

/**
 * GET /auth/me
 * Get current authenticated user info
 * Headers: { Authorization: 'Bearer <token>' }
 * Response: { success: true, data: { walletAddress: string, isShareholder: boolean, issuedAt: string } }
 */
router.get('/me', getCurrentUser);

export default router;
