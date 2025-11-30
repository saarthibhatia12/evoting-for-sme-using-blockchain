import { ethers } from 'ethers';

/**
 * Validation Utilities
 * Centralized validation functions for the application
 */

/**
 * Validate Ethereum wallet address
 * @param address - The address to validate
 * @returns Object with isValid boolean and normalized address or error message
 */
export const validateWalletAddress = (address: string): {
  isValid: boolean;
  normalizedAddress?: string;
  error?: string;
} => {
  if (!address) {
    return { isValid: false, error: 'Wallet address is required' };
  }

  if (typeof address !== 'string') {
    return { isValid: false, error: 'Wallet address must be a string' };
  }

  // Check if it's a valid Ethereum address
  if (!ethers.isAddress(address)) {
    return { isValid: false, error: 'Invalid Ethereum wallet address format' };
  }

  // Normalize to checksum address
  try {
    const normalizedAddress = ethers.getAddress(address);
    return { isValid: true, normalizedAddress };
  } catch (error) {
    return { isValid: false, error: 'Failed to normalize wallet address' };
  }
};

/**
 * Validate email address
 * @param email - The email to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateEmail = (email: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (email.length > 255) {
    return { isValid: false, error: 'Email must be less than 255 characters' };
  }

  return { isValid: true };
};

/**
 * Validate proposal title
 * @param title - The title to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateProposalTitle = (title: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!title) {
    return { isValid: false, error: 'Proposal title is required' };
  }

  if (typeof title !== 'string') {
    return { isValid: false, error: 'Proposal title must be a string' };
  }

  if (title.trim().length < 5) {
    return { isValid: false, error: 'Proposal title must be at least 5 characters' };
  }

  if (title.length > 500) {
    return { isValid: false, error: 'Proposal title must be less than 500 characters' };
  }

  return { isValid: true };
};

/**
 * Validate voting time range
 * @param startTime - Start timestamp (seconds or Date)
 * @param endTime - End timestamp (seconds or Date)
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateVotingTimeRange = (
  startTime: number | Date,
  endTime: number | Date
): {
  isValid: boolean;
  error?: string;
  startTimestamp?: number;
  endTimestamp?: number;
} => {
  // Convert to timestamps
  const startTs = typeof startTime === 'number' 
    ? startTime 
    : Math.floor(startTime.getTime() / 1000);
  
  const endTs = typeof endTime === 'number'
    ? endTime
    : Math.floor(endTime.getTime() / 1000);

  const now = Math.floor(Date.now() / 1000);

  // Allow 5 minutes grace period for start time
  if (startTs < now - 300) {
    return { isValid: false, error: 'Start time cannot be more than 5 minutes in the past' };
  }

  if (endTs <= startTs) {
    return { isValid: false, error: 'End time must be after start time' };
  }

  // Minimum voting duration: 1 hour
  if (endTs - startTs < 3600) {
    return { isValid: false, error: 'Voting period must be at least 1 hour' };
  }

  // Maximum voting duration: 30 days
  if (endTs - startTs > 30 * 24 * 3600) {
    return { isValid: false, error: 'Voting period cannot exceed 30 days' };
  }

  return { 
    isValid: true, 
    startTimestamp: startTs, 
    endTimestamp: endTs 
  };
};

/**
 * Validate shares count
 * @param shares - Number of shares
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateShares = (shares: number): {
  isValid: boolean;
  error?: string;
} => {
  if (shares === undefined || shares === null) {
    return { isValid: false, error: 'Shares count is required' };
  }

  if (typeof shares !== 'number') {
    return { isValid: false, error: 'Shares must be a number' };
  }

  if (!Number.isInteger(shares)) {
    return { isValid: false, error: 'Shares must be a whole number' };
  }

  if (shares < 0) {
    return { isValid: false, error: 'Shares cannot be negative' };
  }

  if (shares > 1000000000) {
    return { isValid: false, error: 'Shares count exceeds maximum limit' };
  }

  return { isValid: true };
};

/**
 * Validate shareholder name
 * @param name - The name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateName = (name: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }

  if (typeof name !== 'string') {
    return { isValid: false, error: 'Name must be a string' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.length > 255) {
    return { isValid: false, error: 'Name must be less than 255 characters' };
  }

  return { isValid: true };
};

/**
 * Validate proposal ID
 * @param proposalId - The proposal ID to validate
 * @returns Object with isValid boolean and parsed ID or error message
 */
export const validateProposalId = (proposalId: any): {
  isValid: boolean;
  parsedId?: number;
  error?: string;
} => {
  if (proposalId === undefined || proposalId === null) {
    return { isValid: false, error: 'Proposal ID is required' };
  }

  const parsed = parseInt(proposalId, 10);

  if (isNaN(parsed)) {
    return { isValid: false, error: 'Proposal ID must be a valid number' };
  }

  if (parsed < 1) {
    return { isValid: false, error: 'Proposal ID must be a positive number' };
  }

  return { isValid: true, parsedId: parsed };
};

/**
 * Validate vote choice
 * @param voteChoice - The vote choice to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateVoteChoice = (voteChoice: any): {
  isValid: boolean;
  error?: string;
} => {
  if (voteChoice === undefined || voteChoice === null) {
    return { isValid: false, error: 'Vote choice is required' };
  }

  if (typeof voteChoice !== 'boolean') {
    return { isValid: false, error: 'Vote choice must be a boolean (true for yes, false for no)' };
  }

  return { isValid: true };
};

/**
 * Sanitize string input
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
};
