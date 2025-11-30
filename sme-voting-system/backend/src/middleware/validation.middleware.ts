import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';

/**
 * Validation Middleware
 * Express-validator based validation for API endpoints
 */

/**
 * Custom validator for Ethereum addresses
 */
const isEthereumAddress = (value: string) => {
  if (!ethers.isAddress(value)) {
    throw new Error('Invalid Ethereum wallet address');
  }
  return true;
};

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg,
      })),
    });
    return;
  }
  
  next();
};

/**
 * Validation rules for shareholder registration
 */
export const validateShareholderRegistration = [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .custom(isEthereumAddress),
  
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  
  body('shares')
    .notEmpty()
    .withMessage('Shares count is required')
    .isInt({ min: 0, max: 1000000000 })
    .withMessage('Shares must be a non-negative integer'),
  
  body('isAdmin')
    .optional()
    .isBoolean()
    .withMessage('isAdmin must be a boolean'),
  
  handleValidationErrors,
];

/**
 * Validation rules for proposal creation
 */
export const validateProposalCreation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Title must be between 5 and 500 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),
  
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required'),
  
  body('endTime')
    .notEmpty()
    .withMessage('End time is required'),
  
  handleValidationErrors,
];

/**
 * Validation rules for voting
 */
export const validateVote = [
  body('proposalId')
    .notEmpty()
    .withMessage('Proposal ID is required')
    .isInt({ min: 1 })
    .withMessage('Proposal ID must be a positive integer'),
  
  body('voteChoice')
    .notEmpty()
    .withMessage('Vote choice is required')
    .isBoolean()
    .withMessage('Vote choice must be a boolean (true for yes, false for no)'),
  
  handleValidationErrors,
];

/**
 * Validation rules for auth nonce request
 */
export const validateNonceRequest = [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .custom(isEthereumAddress),
  
  handleValidationErrors,
];

/**
 * Validation rules for auth verify request
 */
export const validateVerifyRequest = [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .custom(isEthereumAddress),
  
  body('signature')
    .notEmpty()
    .withMessage('Signature is required')
    .isString()
    .withMessage('Signature must be a string')
    .matches(/^0x[a-fA-F0-9]+$/)
    .withMessage('Invalid signature format'),
  
  handleValidationErrors,
];

/**
 * Validation rules for proposal ID parameter
 */
export const validateProposalIdParam = [
  param('proposalId')
    .notEmpty()
    .withMessage('Proposal ID is required')
    .isInt({ min: 1 })
    .withMessage('Proposal ID must be a positive integer'),
  
  handleValidationErrors,
];

/**
 * Validation rules for wallet address parameter
 */
export const validateWalletAddressParam = [
  param('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .custom(isEthereumAddress),
  
  handleValidationErrors,
];

/**
 * Validation rules for shares update
 */
export const validateSharesUpdate = [
  body('shares')
    .notEmpty()
    .withMessage('Shares count is required')
    .isInt({ min: 0, max: 1000000000 })
    .withMessage('Shares must be a non-negative integer'),
  
  handleValidationErrors,
];
