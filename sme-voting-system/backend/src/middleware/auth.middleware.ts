import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { prisma } from '../services/database.service';
import { ethers } from 'ethers';
import { Shareholder } from '@prisma/client';

/**
 * Extended Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
    iat: number;
  };
  shareholder?: Shareholder;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Shareholder middleware
 * Ensures the authenticated user is a registered shareholder
 * Must be used after authenticate middleware
 */
export const requireShareholder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const shareholder = await prisma.shareholder.findUnique({
      where: { walletAddress: ethers.getAddress(req.user.walletAddress) },
    });

    if (!shareholder) {
      res.status(403).json({
        success: false,
        error: 'Only registered shareholders can access this resource',
      });
      return;
    }

    if (!shareholder.isActive) {
      res.status(403).json({
        success: false,
        error: 'Your shareholder account is inactive',
      });
      return;
    }

    req.shareholder = shareholder;
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify shareholder status',
    });
  }
};

/**
 * Admin middleware
 * Ensures the authenticated user is an admin
 * Must be used after authenticate and requireShareholder middleware
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.shareholder) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.shareholder.isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin status',
    });
  }
};
